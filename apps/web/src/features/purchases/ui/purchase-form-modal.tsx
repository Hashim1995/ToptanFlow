import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import {
  CheckCircle,
  Plus,
  ShoppingCart,
  Trash,
} from '@phosphor-icons/react';
import {
  DATE_DISPLAY_FORMAT,
  bakuTodayDateOnly,
  dateOnlyPickerToApi,
  dateOnlyPickerValue,
  toDateOnlyApi,
} from '../../../shared/datetime';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { mapApiError } from '../../../api/map-api-error';
import { formatMoney } from '../../../shared/money/format-money';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { useBusinessPartnersList } from '../../master-data/api/business-partners.hooks';
import { useProductsList } from '../../master-data/api/products.hooks';
import { DecimalInput } from '../../master-data/ui/decimal-input';
import type { Purchase, PurchaseInput } from '../api/purchases.api';
import {
  useCreatePurchase,
  usePostPurchase,
  usePurchase,
  useUpdatePurchase,
} from '../api/purchases.hooks';
import {
  calculateLineTotal,
  calculatePurchaseTotals,
  purchaseFormSchema,
  type PurchaseFormValues,
} from '../forms/purchase.schemas';
import { PURCHASE_LABELS } from './labels';
import { PurchasePostConfirmModal } from './purchase-post-confirm-modal';
import {
  emptyPurchaseImmediatePayment,
  isPurchaseImmediatePaymentValid,
  PurchaseImmediatePaymentSection,
  type PurchaseImmediatePaymentState,
} from './purchase-immediate-payment-section';

const { Text } = Typography;

const emptyLine = {
  productId: '',
  quantity: '',
  unitPrice: '',
  discountAmount: '',
  notes: '',
};

const emptyForm: PurchaseFormValues = {
  partnerId: '',
  businessDate: bakuTodayDateOnly(),
  notes: '',
  supplierInvoiceNumber: '',
  discountAmount: '',
  items: [emptyLine],
};

function toInput(values: PurchaseFormValues): PurchaseInput {
  const optional = (value: string) => value.trim() || undefined;
  return {
    partnerId: values.partnerId,
    businessDate: values.businessDate,
    notes: optional(values.notes),
    supplierInvoiceNumber: optional(values.supplierInvoiceNumber),
    discountAmount: optional(values.discountAmount),
    items: values.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: optional(item.discountAmount),
      notes: optional(item.notes),
    })),
  };
}

function toFormValues(purchase: Purchase): PurchaseFormValues {
  return {
    partnerId: purchase.partner.id,
    businessDate: toDateOnlyApi(purchase.businessDate) ?? '',
    notes: purchase.notes ?? '',
    supplierInvoiceNumber: purchase.supplierInvoiceNumber ?? '',
    discountAmount: purchase.discountAmount ?? '',
    items: purchase.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount ?? '',
      notes: item.notes ?? '',
    })),
  };
}

type PurchaseFormModalProps = {
  open: boolean;
  purchaseId?: string;
  onCancel: () => void;
  onSaved: (purchase: Purchase) => void;
};

export function PurchaseFormModal({
  open,
  purchaseId,
  onCancel,
  onSaved,
}: PurchaseFormModalProps) {
  const isEdit = Boolean(purchaseId);
  const purchase = usePurchase(open && purchaseId ? purchaseId : undefined);
  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();
  const postMutation = usePostPurchase();
  const initializedId = useRef<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string>();
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [pendingPostPurchase, setPendingPostPurchase] = useState<Purchase>();
  const [immediatePayment, setImmediatePayment] =
    useState<PurchaseImmediatePaymentState>(() =>
      emptyPurchaseImmediatePayment(),
    );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: emptyForm,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const values = useWatch({ control });

  const partners = useBusinessPartnersList({
    pageSize: 100,
    isSupplier: true,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const products = useProductsList({
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  useEffect(() => {
    if (!open) {
      initializedId.current = undefined;
      setImmediatePayment(emptyPurchaseImmediatePayment());
      return;
    }
    if (!isEdit) {
      reset({
        ...emptyForm,
        businessDate: bakuTodayDateOnly(),
        items: [emptyLine],
      });
      setImmediatePayment(emptyPurchaseImmediatePayment());
      return;
    }
    if (!purchase.data || initializedId.current === purchase.data.id) return;
    if (purchase.data.status !== 'DRAFT') {
      return;
    }
    initializedId.current = purchase.data.id;
    reset(toFormValues(purchase.data));
    setImmediatePayment(emptyPurchaseImmediatePayment(purchase.data.totalAmount));
  }, [isEdit, open, purchase.data, reset]);

  const partnerOptions = useMemo(() => {
    const options = (partners.data?.data ?? [])
      .filter((partner) => partner.isSupplier && partner.isActive)
      .map((partner) => ({
        value: partner.id,
        label: `${partner.code} — ${partner.name}`,
      }));
    if (
      purchase.data &&
      !options.some((option) => option.value === purchase.data?.partner.id)
    ) {
      options.push({
        value: purchase.data.partner.id,
        label: `${purchase.data.partner.code} — ${purchase.data.partner.name}`,
      });
    }
    return options;
  }, [partners.data?.data, purchase.data]);

  const productOptions = useMemo(() => {
    const options = (products.data?.data ?? []).map((product) => ({
      value: product.id,
      label: `${product.code} — ${product.name}`,
    }));
    purchase.data?.items.forEach((item) => {
      if (!options.some((option) => option.value === item.productId)) {
        options.push({
          value: item.productId,
          label: `${item.productCodeSnapshot} — ${item.productNameSnapshot}`,
        });
      }
    });
    return options;
  }, [products.data?.data, purchase.data?.items]);

  const totals = useMemo(
    () =>
      calculatePurchaseTotals({
        partnerId: values.partnerId ?? '',
        businessDate: values.businessDate ?? '',
        notes: values.notes ?? '',
        supplierInvoiceNumber: values.supplierInvoiceNumber ?? '',
        discountAmount: values.discountAmount ?? '',
        items: (values.items ?? []).map((item) => ({
          ...emptyLine,
          ...item,
        })),
      }),
    [values],
  );

  const documentTotalAmount = totals.total.toFixed(2);

  const selectedPartnerDebt = useMemo(() => {
    const fromList = partners.data?.data.find(
      (partner) => partner.id === values.partnerId,
    )?.currentDebtBalance;
    if (fromList) return fromList;
    const purchaseData = purchase.data;
    if (
      purchaseData !== undefined &&
      purchaseData.partner.id === values.partnerId
    ) {
      return purchaseData.partner.currentDebtBalance;
    }
    return '0';
  }, [partners.data?.data, values.partnerId, purchase.data?.partner]);

  useEffect(() => {
    if (!immediatePayment.enabled) return;
    setImmediatePayment((previous) =>
      previous.amount === documentTotalAmount
        ? previous
        : { ...previous, amount: documentTotalAmount },
    );
  }, [documentTotalAmount, immediatePayment.enabled]);

  const paymentValid = isPurchaseImmediatePaymentValid(
    immediatePayment,
    false,
  );

  const draftBlocked =
    isEdit && purchase.data && purchase.data.status !== 'DRAFT';
  const displayError = draftBlocked
    ? PURCHASE_LABELS.messages.draftOnly
    : submitError;
  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    postMutation.isPending;

  async function save(formValues: PurchaseFormValues, shouldPost: boolean) {
    setSubmitError(undefined);
    try {
      const saved = isEdit
        ? await updateMutation.mutateAsync({
            id: purchaseId!,
            input: toInput(formValues),
          })
        : await createMutation.mutateAsync(toInput(formValues));
      message.success(
        isEdit
          ? PURCHASE_LABELS.messages.updateSuccess
          : PURCHASE_LABELS.messages.createSuccess,
      );

      if (!shouldPost) {
        onSaved(saved);
        return;
      }

      setPendingPostPurchase(saved);
      setPostConfirmOpen(true);
    } catch (error) {
      setSubmitError(mapApiError(error).userMessage);
    }
  }

  async function handlePostConfirm(payload: {
    immediatePayment?: {
      cashAccountId: string;
      amount: string;
      notes?: string;
      negativeBalanceOverrideReason?: string;
    };
  }) {
    if (!pendingPostPurchase) return;
    try {
      const posted = await postMutation.mutateAsync({
        id: pendingPostPurchase.id,
        input: payload,
      });
      message.success(PURCHASE_LABELS.post.success);
      setPostConfirmOpen(false);
      setPendingPostPurchase(undefined);
      onSaved(posted);
    } catch (error) {
      message.error(mapApiError(error).userMessage);
      throw error;
    }
  }

  const loadingEdit = isEdit && purchase.isLoading;
  const loadError = isEdit && purchase.isError;

  return (
    <>
      <Modal
        title={
          <Space>
            {phIcon(ShoppingCart, { size: ICON_SIZE.lg, weight: 'duotone' })}
            {isEdit ? PURCHASE_LABELS.edit : PURCHASE_LABELS.create}
          </Space>
        }
      open={open && !postConfirmOpen}
      onCancel={onCancel}
      width={960}
      destroyOnHidden
      forceRender
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingTop: 12 } }}
      footer={
        <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>{PURCHASE_LABELS.actions.back}</Button>
          <Button
            loading={submitting}
            disabled={loadingEdit || Boolean(loadError) || !paymentValid}
            icon={phIcon(CheckCircle, { size: ICON_SIZE.sm })}
            onClick={() =>
              void handleSubmit((formValues) => save(formValues, true))()
            }
          >
            {PURCHASE_LABELS.actions.saveAndPost}
          </Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={loadingEdit || Boolean(loadError)}
            onClick={() =>
              void handleSubmit((formValues) => save(formValues, false))()
            }
          >
            {PURCHASE_LABELS.actions.save}
          </Button>
        </Space>
      }
    >
      {loadingEdit ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin tip={PURCHASE_LABELS.messages.loading} />
        </div>
      ) : null}

      {loadError ? (
        <Alert
          type="error"
          showIcon
          message={mapApiError(purchase.error).userMessage}
          action={
            <Button size="small" onClick={() => void purchase.refetch()}>
              {PURCHASE_LABELS.actions.retry}
            </Button>
          }
        />
      ) : null}

      {!loadingEdit && !loadError ? (
        <Form layout="vertical" requiredMark size="small">
          {displayError ? (
            <Alert
              type="error"
              showIcon
              message={displayError}
              style={{ marginBottom: 12 }}
            />
          ) : null}

          <Row gutter={[12, 0]}>
            <Col xs={24} sm={12} md={8}>
              <Controller
                control={control}
                name="partnerId"
                render={({ field }) => (
                  <Form.Item
                    label={PURCHASE_LABELS.fields.partner}
                    required
                    validateStatus={errors.partnerId ? 'error' : undefined}
                    help={errors.partnerId?.message}
                    style={{ marginBottom: 12 }}
                  >
                    <Select
                      {...field}
                      value={field.value || undefined}
                      showSearch
                      optionFilterProp="label"
                      options={partnerOptions}
                      placeholder={PURCHASE_LABELS.fields.partnerPlaceholder}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Controller
                control={control}
                name="businessDate"
                render={({ field }) => (
                  <Form.Item
                    label={PURCHASE_LABELS.fields.businessDate}
                    required
                    validateStatus={errors.businessDate ? 'error' : undefined}
                    help={errors.businessDate?.message}
                    style={{ marginBottom: 12 }}
                  >
                    <DatePicker
                      value={dateOnlyPickerValue(field.value)}
                      format={DATE_DISPLAY_FORMAT}
                      style={{ width: '100%' }}
                      onChange={(date) =>
                        field.onChange(dateOnlyPickerToApi(date))
                      }
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Controller
                control={control}
                name="supplierInvoiceNumber"
                render={({ field }) => (
                  <Form.Item
                    label={PURCHASE_LABELS.fields.supplierInvoiceNumber}
                    validateStatus={
                      errors.supplierInvoiceNumber ? 'error' : undefined
                    }
                    help={errors.supplierInvoiceNumber?.message}
                    style={{ marginBottom: 12 }}
                  >
                    <Input
                      {...field}
                      placeholder={
                        PURCHASE_LABELS.fields.supplierInvoicePlaceholder
                      }
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Controller
                control={control}
                name="discountAmount"
                render={({ field }) => (
                  <Form.Item
                    label={PURCHASE_LABELS.fields.documentDiscount}
                    validateStatus={
                      errors.discountAmount ? 'error' : undefined
                    }
                    help={errors.discountAmount?.message}
                    style={{ marginBottom: 12 }}
                  >
                    <DecimalInput {...field} placeholder="0.00" />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24}>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <Form.Item
                    label={PURCHASE_LABELS.fields.notes}
                    validateStatus={errors.notes ? 'error' : undefined}
                    help={errors.notes?.message}
                    style={{ marginBottom: 8 }}
                  >
                    <Input
                      {...field}
                      placeholder={PURCHASE_LABELS.fields.notesPlaceholder}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0 12px' }} />

          <Space
            style={{
              width: '100%',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text strong>{PURCHASE_LABELS.fields.items}</Text>
            <Button
              type="dashed"
              size="small"
              icon={phIcon(Plus, { size: ICON_SIZE.sm, weight: 'bold' })}
              onClick={() => append(emptyLine)}
            >
              {PURCHASE_LABELS.actions.addLine}
            </Button>
          </Space>

          {errors.items?.root?.message ||
          (typeof errors.items?.message === 'string'
            ? errors.items.message
            : null) ? (
            <Alert
              type="error"
              message={
                errors.items?.root?.message ??
                (typeof errors.items?.message === 'string'
                  ? errors.items.message
                  : undefined)
              }
              style={{ marginBottom: 8 }}
            />
          ) : null}

          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {fields.map((field, index) => {
              const watchedLine = values.items?.[index];
              const line = {
                productId: watchedLine?.productId ?? '',
                quantity: watchedLine?.quantity ?? '',
                unitPrice: watchedLine?.unitPrice ?? '',
                discountAmount: watchedLine?.discountAmount ?? '',
                notes: watchedLine?.notes ?? '',
              };
              const lineErrors = errors.items?.[index];
              return (
                <div
                  key={field.id}
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: '#fafafa',
                  }}
                >
                  <Row gutter={[8, 0]} align="top">
                    <Col xs={24} md={8}>
                      <Controller
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field: itemField }) => (
                          <Form.Item
                            label={PURCHASE_LABELS.fields.product}
                            required
                            validateStatus={
                              lineErrors?.productId ? 'error' : undefined
                            }
                            help={lineErrors?.productId?.message}
                            style={{ marginBottom: 4 }}
                          >
                            <Select
                              {...itemField}
                              value={itemField.value || undefined}
                              showSearch
                              optionFilterProp="label"
                              options={productOptions}
                              placeholder={
                                PURCHASE_LABELS.fields.productPlaceholder
                              }
                              onChange={(value) => {
                                itemField.onChange(value);
                                const selected = products.data?.data.find(
                                  (product) => product.id === value,
                                );
                                if (
                                  selected?.latestPurchasePrice &&
                                  !values.items?.[index]?.unitPrice
                                ) {
                                  setValue(
                                    `items.${index}.unitPrice`,
                                    selected.latestPurchasePrice,
                                  );
                                }
                              }}
                            />
                          </Form.Item>
                        )}
                      />
                    </Col>
                    <Col xs={8} md={3}>
                      <Controller
                        control={control}
                        name={`items.${index}.quantity`}
                        render={({ field: itemField }) => (
                          <Form.Item
                            label={PURCHASE_LABELS.fields.quantity}
                            required
                            validateStatus={
                              lineErrors?.quantity ? 'error' : undefined
                            }
                            help={lineErrors?.quantity?.message}
                            style={{ marginBottom: 4 }}
                          >
                            <DecimalInput {...itemField} placeholder="0" />
                          </Form.Item>
                        )}
                      />
                    </Col>
                    <Col xs={8} md={3}>
                      <Controller
                        control={control}
                        name={`items.${index}.unitPrice`}
                        render={({ field: itemField }) => (
                          <Form.Item
                            label={PURCHASE_LABELS.fields.unitPrice}
                            required
                            validateStatus={
                              lineErrors?.unitPrice ? 'error' : undefined
                            }
                            help={lineErrors?.unitPrice?.message}
                            style={{ marginBottom: 4 }}
                          >
                            <DecimalInput {...itemField} placeholder="0.00" />
                          </Form.Item>
                        )}
                      />
                    </Col>
                    <Col xs={8} md={3}>
                      <Controller
                        control={control}
                        name={`items.${index}.discountAmount`}
                        render={({ field: itemField }) => (
                          <Form.Item
                            label={PURCHASE_LABELS.fields.lineDiscount}
                            validateStatus={
                              lineErrors?.discountAmount ? 'error' : undefined
                            }
                            help={lineErrors?.discountAmount?.message}
                            style={{ marginBottom: 4 }}
                          >
                            <DecimalInput {...itemField} placeholder="0.00" />
                          </Form.Item>
                        )}
                      />
                    </Col>
                    <Col xs={16} md={4}>
                      <Form.Item
                        label={PURCHASE_LABELS.fields.lineTotal}
                        style={{ marginBottom: 4 }}
                      >
                        <Input
                          readOnly
                          value={formatMoney(
                            calculateLineTotal({
                              quantity: line.quantity,
                              unitPrice: line.unitPrice,
                              discountAmount: line.discountAmount,
                            }),
                          )}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={8} md={3}>
                      <Form.Item
                        label=" "
                        colon={false}
                        style={{ marginBottom: 4 }}
                      >
                        <Button
                          danger
                          type="text"
                          icon={phIcon(Trash, { size: ICON_SIZE.sm })}
                          disabled={fields.length === 1}
                          aria-label={PURCHASE_LABELS.actions.removeLine}
                          onClick={() => remove(index)}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={24}>
                      <Controller
                        control={control}
                        name={`items.${index}.notes`}
                        render={({ field: itemField }) => (
                          <Form.Item
                            validateStatus={
                              lineErrors?.notes ? 'error' : undefined
                            }
                            help={lineErrors?.notes?.message}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              {...itemField}
                              size="small"
                              placeholder={
                                PURCHASE_LABELS.fields.lineNotesPlaceholder
                              }
                            />
                          </Form.Item>
                        )}
                      />
                    </Col>
                  </Row>
                </div>
              );
            })}
          </Space>

          <div style={{ marginTop: 16 }}>
            <PurchaseImmediatePaymentSection
              value={immediatePayment}
              onChange={setImmediatePayment}
              documentTotal={documentTotalAmount}
              partnerDebtBalance={selectedPartnerDebt}
            />
          </div>

          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#f5f5f5',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              justifyContent: 'flex-end',
            }}
          >
            <Text>
              {PURCHASE_LABELS.columns.subtotal}: {formatMoney(totals.subtotal)}
            </Text>
            <Text>
              {PURCHASE_LABELS.columns.discount}: {formatMoney(totals.discount)}
            </Text>
            <Text strong>
              {PURCHASE_LABELS.columns.total}: {formatMoney(totals.total)}
            </Text>
          </div>
        </Form>
      ) : null}
    </Modal>

      <PurchasePostConfirmModal
        open={postConfirmOpen}
        confirmLoading={postMutation.isPending}
        documentTotal={pendingPostPurchase?.totalAmount}
        partnerDebtBalance={pendingPostPurchase?.partner.currentDebtBalance}
        initialPayment={immediatePayment}
        onCancel={() => {
          setPostConfirmOpen(false);
          if (pendingPostPurchase) {
            onSaved(pendingPostPurchase);
          }
          setPendingPostPurchase(undefined);
        }}
        onConfirm={handlePostConfirm}
      />
    </>
  );
}
