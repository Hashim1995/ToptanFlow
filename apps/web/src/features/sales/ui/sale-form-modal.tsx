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
  ShoppingBag,
  Trash,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { mapApiError } from '../../../api/map-api-error';
import { formatMoney } from '../../../shared/money/format-money';
import { formatQuantity } from '../../../shared/ui/format';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { useBusinessPartnersList } from '../../master-data/api/business-partners.hooks';
import { useProductsList } from '../../master-data/api/products.hooks';
import { DecimalInput } from '../../master-data/ui/decimal-input';
import type { Sale, SaleInput } from '../api/sales.api';
import {
  useCreateSale,
  usePostSale,
  useSale,
  useUpdateSale,
} from '../api/sales.hooks';
import {
  calculateLineTotal,
  calculateSaleTotals,
  saleFormSchema,
  type SaleFormValues,
} from '../forms/sale.schemas';
import { SALES_LABELS } from './labels';
import { computeQuantityShortages } from './quantity-shortage';
import { SalePostConfirmModal } from './sale-post-confirm-modal';

const { Text } = Typography;

const emptyLine = {
  productId: '',
  quantity: '',
  unitPrice: '',
  discountAmount: '',
  notes: '',
};

const emptyForm: SaleFormValues = {
  partnerId: '',
  businessDate: dayjs().format('YYYY-MM-DD'),
  notes: '',
  discountAmount: '',
  items: [emptyLine],
};

function toInput(values: SaleFormValues): SaleInput {
  const optional = (value: string) => value.trim() || undefined;
  return {
    partnerId: values.partnerId,
    businessDate: values.businessDate,
    notes: optional(values.notes),
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

function toFormValues(sale: Sale): SaleFormValues {
  return {
    partnerId: sale.partner.id,
    businessDate: sale.businessDate.slice(0, 10),
    notes: sale.notes ?? '',
    discountAmount: sale.discountAmount ?? '',
    items: sale.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount ?? '',
      notes: item.notes ?? '',
    })),
  };
}

type SaleFormModalProps = {
  open: boolean;
  saleId?: string;
  onCancel: () => void;
  onSaved: (sale: Sale) => void;
};

export function SaleFormModal({
  open,
  saleId,
  onCancel,
  onSaved,
}: SaleFormModalProps) {
  const isEdit = Boolean(saleId);
  const sale = useSale(open && saleId ? saleId : undefined);
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();
  const postMutation = usePostSale();
  const initializedId = useRef<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string>();
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [pendingPostSale, setPendingPostSale] = useState<Sale>();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: emptyForm,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const values = useWatch({ control });

  const partners = useBusinessPartnersList({
    pageSize: 100,
    isCustomer: true,
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
      setPostConfirmOpen(false);
      setPendingPostSale(undefined);
      return;
    }
    if (!isEdit) {
      reset({
        ...emptyForm,
        businessDate: dayjs().format('YYYY-MM-DD'),
        items: [emptyLine],
      });
      return;
    }
    if (!sale.data || initializedId.current === sale.data.id) return;
    if (sale.data.status !== 'DRAFT') {
      return;
    }
    initializedId.current = sale.data.id;
    reset(toFormValues(sale.data));
  }, [isEdit, open, sale.data, reset]);

  const partnerOptions = useMemo(() => {
    const options = (partners.data?.data ?? [])
      .filter((partner) => partner.isCustomer && partner.isActive)
      .map((partner) => ({
        value: partner.id,
        label: `${partner.code} — ${partner.name}`,
      }));
    if (
      sale.data &&
      !options.some((option) => option.value === sale.data?.partner.id)
    ) {
      options.push({
        value: sale.data.partner.id,
        label: `${sale.data.partner.code} — ${sale.data.partner.name}`,
      });
    }
    return options;
  }, [partners.data?.data, sale.data]);

  const productOptions = useMemo(() => {
    const options = (products.data?.data ?? []).map((product) => ({
      value: product.id,
      label: `${product.code} — ${product.name}`,
    }));
    sale.data?.items.forEach((item) => {
      if (!options.some((option) => option.value === item.productId)) {
        options.push({
          value: item.productId,
          label: `${item.productCodeSnapshot} — ${item.productNameSnapshot}`,
        });
      }
    });
    return options;
  }, [products.data?.data, sale.data?.items]);

  const productById = useMemo(() => {
    const map = new Map(
      (products.data?.data ?? []).map((product) => [product.id, product]),
    );
    return map;
  }, [products.data?.data]);

  const totals = useMemo(
    () =>
      calculateSaleTotals({
        partnerId: values.partnerId ?? '',
        businessDate: values.businessDate ?? '',
        notes: values.notes ?? '',
        discountAmount: values.discountAmount ?? '',
        items: (values.items ?? []).map((item) => ({
          ...emptyLine,
          ...item,
        })),
      }),
    [values],
  );

  const draftBlocked =
    isEdit && sale.data && sale.data.status !== 'DRAFT';
  const displayError = draftBlocked
    ? SALES_LABELS.messages.draftOnly
    : submitError;
  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    postMutation.isPending;

  async function save(formValues: SaleFormValues, shouldPost: boolean) {
    setSubmitError(undefined);
    try {
      const saved = isEdit
        ? await updateMutation.mutateAsync({
            id: saleId!,
            input: toInput(formValues),
          })
        : await createMutation.mutateAsync(toInput(formValues));
      message.success(
        isEdit
          ? SALES_LABELS.messages.updateSuccess
          : SALES_LABELS.messages.createSuccess,
      );

      if (!shouldPost) {
        onSaved(saved);
        return;
      }

      setPendingPostSale(saved);
      setPostConfirmOpen(true);
    } catch (error) {
      setSubmitError(mapApiError(error).userMessage);
    }
  }

  async function handlePostConfirm(negativeQuantityReason?: string) {
    if (!pendingPostSale) return;
    try {
      const posted = await postMutation.mutateAsync({
        id: pendingPostSale.id,
        input: negativeQuantityReason
          ? { negativeQuantityReason }
          : undefined,
      });
      message.success(SALES_LABELS.post.success);
      setPostConfirmOpen(false);
      setPendingPostSale(undefined);
      onSaved(posted);
    } catch (error) {
      message.error(mapApiError(error).userMessage);
      throw error;
    }
  }

  const loadingEdit = isEdit && sale.isLoading;
  const loadError = isEdit && sale.isError;

  return (
    <>
      <Modal
        title={
          <Space>
            {phIcon(ShoppingBag, { size: ICON_SIZE.lg, weight: 'duotone' })}
            {isEdit ? SALES_LABELS.edit : SALES_LABELS.create}
          </Space>
        }
        open={open}
        onCancel={onCancel}
        width={960}
        destroyOnHidden
        forceRender
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingTop: 12 } }}
        footer={
          <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>{SALES_LABELS.actions.back}</Button>
            <Button
              loading={submitting}
              disabled={loadingEdit || Boolean(loadError)}
              icon={phIcon(CheckCircle, { size: ICON_SIZE.sm })}
              onClick={() =>
                void handleSubmit((formValues) => save(formValues, true))()
              }
            >
              {SALES_LABELS.actions.saveAndPost}
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={loadingEdit || Boolean(loadError)}
              onClick={() =>
                void handleSubmit((formValues) => save(formValues, false))()
              }
            >
              {SALES_LABELS.actions.save}
            </Button>
          </Space>
        }
      >
        {loadingEdit ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin tip={SALES_LABELS.messages.loading} />
          </div>
        ) : null}

        {loadError ? (
          <Alert
            type="error"
            showIcon
            message={mapApiError(sale.error).userMessage}
            action={
              <Button size="small" onClick={() => void sale.refetch()}>
                {SALES_LABELS.actions.retry}
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
                      label={SALES_LABELS.fields.partner}
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
                        placeholder={SALES_LABELS.fields.partnerPlaceholder}
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
                      label={SALES_LABELS.fields.businessDate}
                      required
                      validateStatus={errors.businessDate ? 'error' : undefined}
                      help={errors.businessDate?.message}
                      style={{ marginBottom: 12 }}
                    >
                      <DatePicker
                        value={field.value ? dayjs(field.value) : null}
                        format="DD.MM.YYYY"
                        style={{ width: '100%' }}
                        onChange={(date) =>
                          field.onChange(date?.format('YYYY-MM-DD') ?? '')
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
                      label={SALES_LABELS.fields.documentDiscount}
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
                      label={SALES_LABELS.fields.notes}
                      validateStatus={errors.notes ? 'error' : undefined}
                      help={errors.notes?.message}
                      style={{ marginBottom: 8 }}
                    >
                      <Input
                        {...field}
                        placeholder={SALES_LABELS.fields.notesPlaceholder}
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
              <Text strong>{SALES_LABELS.fields.items}</Text>
              <Button
                type="dashed"
                size="small"
                icon={phIcon(Plus, { size: ICON_SIZE.sm, weight: 'bold' })}
                onClick={() => append(emptyLine)}
              >
                {SALES_LABELS.actions.addLine}
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
                const selectedProduct = line.productId
                  ? productById.get(line.productId)
                  : undefined;
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
                              label={SALES_LABELS.fields.product}
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
                                  SALES_LABELS.fields.productPlaceholder
                                }
                                onChange={(value) => {
                                  itemField.onChange(value);
                                  const selected = products.data?.data.find(
                                    (product) => product.id === value,
                                  );
                                  if (
                                    selected?.standardSalePrice &&
                                    !values.items?.[index]?.unitPrice
                                  ) {
                                    setValue(
                                      `items.${index}.unitPrice`,
                                      selected.standardSalePrice,
                                    );
                                  }
                                }}
                              />
                            </Form.Item>
                          )}
                        />
                        {selectedProduct ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {SALES_LABELS.fields.availableQuantity}:{' '}
                            {formatQuantity(selectedProduct.currentQuantity)}
                          </Text>
                        ) : null}
                      </Col>
                      <Col xs={8} md={3}>
                        <Controller
                          control={control}
                          name={`items.${index}.quantity`}
                          render={({ field: itemField }) => (
                            <Form.Item
                              label={SALES_LABELS.fields.quantity}
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
                              label={SALES_LABELS.fields.unitPrice}
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
                              label={SALES_LABELS.fields.lineDiscount}
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
                          label={SALES_LABELS.fields.lineTotal}
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
                            aria-label={SALES_LABELS.actions.removeLine}
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
                                  SALES_LABELS.fields.lineNotesPlaceholder
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
                {SALES_LABELS.columns.subtotal}: {formatMoney(totals.subtotal)}
              </Text>
              <Text>
                {SALES_LABELS.columns.discount}: {formatMoney(totals.discount)}
              </Text>
              <Text strong>
                {SALES_LABELS.columns.total}: {formatMoney(totals.total)}
              </Text>
            </div>
          </Form>
        ) : null}
      </Modal>

      <SalePostConfirmModal
        open={postConfirmOpen}
        confirmLoading={postMutation.isPending}
        shortages={
          pendingPostSale
            ? computeQuantityShortages(
                pendingPostSale.items,
                products.data?.data ?? [],
              )
            : []
        }
        onCancel={() => {
          setPostConfirmOpen(false);
          if (pendingPostSale) {
            onSaved(pendingPostSale);
          }
          setPendingPostSale(undefined);
        }}
        onConfirm={handlePostConfirm}
      />
    </>
  );
}
