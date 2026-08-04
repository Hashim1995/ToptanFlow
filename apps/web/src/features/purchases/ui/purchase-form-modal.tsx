import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Col,
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
import { appRequiredMark } from '../../../shared/ui/form-required-mark';
import { CheckCircle, Plus, ShoppingCart, Trash } from '@phosphor-icons/react';
import {
  DATE_DISPLAY_FORMAT,
  bakuTodayDateOnly,
  dateOnlyPickerToApi,
  dateOnlyPickerValue,
  toDateOnlyApi,
} from '../../../shared/datetime';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { mapApiError } from '../../../api/map-api-error';
import { formatMoney } from '../../../shared/money/format-money';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { ResponsiveDatePicker } from '../../../shared/ui/responsive-date-pickers';
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
  type PurchaseImmediatePaymentState,
} from './purchase-immediate-payment';
import { PurchaseImmediatePaymentSection } from './purchase-immediate-payment-section';

const { Text } = Typography;

const emptyLine = {
  productId: '',
  quantity: '',
  unitPrice: '',
  discountAmount: '',
};

const emptyForm: PurchaseFormValues = {
  partnerId: '',
  businessDate: bakuTodayDateOnly(),
  discountAmount: '',
  items: [emptyLine],
};

function toInput(values: PurchaseFormValues): PurchaseInput {
  const optional = (value: string) => value.trim() || undefined;
  return {
    partnerId: values.partnerId,
    businessDate: values.businessDate,
    // CHANGE-030: notes + supplierInvoiceNumber omitted (preserve existing on update).
    discountAmount: optional(values.discountAmount),
    items: values.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: optional(item.discountAmount),
    })),
  };
}

function toFormValues(purchase: Purchase): PurchaseFormValues {
  return {
    partnerId: purchase.partner.id,
    businessDate: toDateOnlyApi(purchase.businessDate) ?? '',
    discountAmount: purchase.discountAmount ?? '',
    items: purchase.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount ?? '',
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
  const [paymentDocumentTotal, setPaymentDocumentTotal] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    shouldFocusError: false,
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
      return;
    }
    if (!isEdit) {
      reset({
        ...emptyForm,
        businessDate: bakuTodayDateOnly(),
        items: [emptyLine],
      });
      return;
    }
    if (!purchase.data || initializedId.current === purchase.data.id) return;
    if (purchase.data.status !== 'DRAFT') {
      return;
    }
    initializedId.current = purchase.data.id;
    reset(toFormValues(purchase.data));
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
  }, [partners.data?.data, values.partnerId, purchase.data]);

  if (paymentDocumentTotal !== documentTotalAmount) {
    setPaymentDocumentTotal(documentTotalAmount);
    if (immediatePayment.enabled) {
      setImmediatePayment((previous) => ({
        ...previous,
        amount: documentTotalAmount,
      }));
    }
  }

  const paymentValid = isPurchaseImmediatePaymentValid(immediatePayment, false);

  const draftBlocked =
    isEdit && purchase.data && purchase.data.status !== 'DRAFT';
  const displayError = draftBlocked
    ? PURCHASE_LABELS.messages.draftOnly
    : submitError;
  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    postMutation.isPending;

  function resetImmediatePayment() {
    setImmediatePayment(emptyPurchaseImmediatePayment());
    setPaymentDocumentTotal('');
  }

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
        resetImmediatePayment();
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
      resetImmediatePayment();
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
        className="ui-form-modal ui-document-form-modal commercial-document-modal purchase-form-modal"
        wrapClassName="commercial-modal-wrap"
        centered
        title={
          <Space>
            {phIcon(ShoppingCart, { size: ICON_SIZE.lg, weight: 'duotone' })}
            {isEdit ? PURCHASE_LABELS.edit : PURCHASE_LABELS.create}
          </Space>
        }
        open={open && !postConfirmOpen}
        afterOpenChange={(visible) => {
          if (!visible && !open) resetImmediatePayment();
        }}
        onCancel={() => {
          resetImmediatePayment();
          onCancel();
        }}
        width={960}
        destroyOnHidden
        forceRender
        footer={
          <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                resetImmediatePayment();
                onCancel();
              }}
            >
              {PURCHASE_LABELS.actions.back}
            </Button>
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
          <Form
            className="ui-document-form commercial-document-form"
            layout="vertical"
            requiredMark={appRequiredMark}
          >
            {displayError ? (
              <Alert
                type="error"
                showIcon
                message={displayError}
                style={{ marginBottom: 12 }}
              />
            ) : null}

            <Row className="commercial-document-meta-grid" gutter={[12, 8]}>
              <Col xs={24} sm={14} md={16}>
                <Controller
                  control={control}
                  name="partnerId"
                  render={({ field }) => (
                    <Form.Item
                      label={PURCHASE_LABELS.fields.partner}
                      required
                      validateStatus={errors.partnerId ? 'error' : undefined}
                      help={errors.partnerId?.message}
                      style={{ marginBottom: 0 }}
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
              <Col xs={24} sm={10} md={8}>
                <Controller
                  control={control}
                  name="businessDate"
                  render={({ field }) => (
                    <Form.Item
                      label={PURCHASE_LABELS.fields.businessDate}
                      required
                      validateStatus={errors.businessDate ? 'error' : undefined}
                      help={errors.businessDate?.message}
                      style={{ marginBottom: 0 }}
                    >
                      <ResponsiveDatePicker
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
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <div className="commercial-lines-heading">
              <Text strong>{PURCHASE_LABELS.fields.items}</Text>
              <Text type="secondary">{fields.length}</Text>
            </div>

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

            <Space className="ui-document-lines" direction="vertical" size={8}>
              {fields.map((field, index) => {
                const watchedLine = values.items?.[index];
                const line = {
                  productId: watchedLine?.productId ?? '',
                  quantity: watchedLine?.quantity ?? '',
                  unitPrice: watchedLine?.unitPrice ?? '',
                  discountAmount: watchedLine?.discountAmount ?? '',
                };
                const lineErrors = errors.items?.[index];
                return (
                  <div
                    className="ui-document-line-card commercial-line-card"
                    key={field.id}
                  >
                    <Button
                      className="commercial-line-remove-icon"
                      danger
                      type="text"
                      icon={phIcon(Trash, { size: ICON_SIZE.sm })}
                      disabled={fields.length === 1}
                      aria-label={PURCHASE_LABELS.actions.removeLine}
                      onClick={() => remove(index)}
                    />
                    <div className="commercial-line-grid">
                      <div className="commercial-line-product">
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
                              style={{ marginBottom: 0 }}
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
                      </div>
                      <div className="commercial-line-quantity">
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
                              style={{ marginBottom: 0 }}
                            >
                              <DecimalInput {...itemField} placeholder="0" />
                            </Form.Item>
                          )}
                        />
                      </div>
                      <div className="commercial-line-price">
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
                              style={{ marginBottom: 0 }}
                            >
                              <DecimalInput
                                {...itemField}
                                maxFractionDigits={2}
                                placeholder="0.00"
                              />
                            </Form.Item>
                          )}
                        />
                      </div>
                      <div className="commercial-line-total">
                        <Form.Item
                          className="ui-form-field-readonly"
                          label={PURCHASE_LABELS.fields.lineTotal}
                          style={{ marginBottom: 0 }}
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </Space>

            <Button
              className="commercial-add-line-button"
              type="dashed"
              icon={phIcon(Plus, { size: ICON_SIZE.sm, weight: 'bold' })}
              onClick={(event) => {
                append(emptyLine);
                // CHANGE-029: do not move focus into newly mounted inputs.
                event.currentTarget.blur();
              }}
            >
              {PURCHASE_LABELS.actions.addLine}
            </Button>

            <div className="commercial-payment-section">
              <PurchaseImmediatePaymentSection
                value={immediatePayment}
                onChange={setImmediatePayment}
                documentTotal={documentTotalAmount}
                partnerDebtBalance={selectedPartnerDebt}
              />
            </div>

            <div className="commercial-form-totals">
              <Text>
                {PURCHASE_LABELS.columns.subtotal}:{' '}
                {formatMoney(totals.subtotal)}
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
          resetImmediatePayment();
          setPendingPostPurchase(undefined);
        }}
        onConfirm={handlePostConfirm}
      />
    </>
  );
}
