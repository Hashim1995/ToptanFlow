import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Checkbox, Form, Input, Modal, Select, Space } from 'antd';
import { useCurrenciesList } from '../api/currencies.hooks';
import {
  businessPartnerFormSchema,
  type BusinessPartnerFormValues,
} from '../forms/business-partner.schemas';
import { MASTER_DATA_LABELS } from './labels';

const { TextArea } = Input;

type BusinessPartnerFormModalProps = {
  open: boolean;
  title: string;
  mode: 'create' | 'edit';
  readOnlyCode?: string;
  fallbackCurrencyOption?: { value: string; label: string };
  initialValues?: BusinessPartnerFormValues;
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (values: BusinessPartnerFormValues) => Promise<void> | void;
};

const emptyValues: BusinessPartnerFormValues = {
  name: '',
  isCustomer: true,
  isSupplier: false,
  defaultCurrencyId: '',
  phone: '',
  email: '',
  taxNumber: '',
  address: '',
  notes: '',
};

export function BusinessPartnerFormModal({
  open,
  title,
  mode,
  readOnlyCode,
  fallbackCurrencyOption,
  initialValues,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: BusinessPartnerFormModalProps) {
  const labels = MASTER_DATA_LABELS.partners;
  const common = MASTER_DATA_LABELS.common;

  const currenciesQuery = useCurrenciesList({
    isActive: true,
    pageSize: 100,
    sortBy: 'code',
    sortOrder: 'asc',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessPartnerFormValues>({
    resolver: zodResolver(businessPartnerFormSchema),
    defaultValues: initialValues ?? emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? emptyValues);
    }
  }, [open, initialValues, reset]);

  const currencyOptions = useMemo(() => {
    const currencies = currenciesQuery.data?.data ?? [];
    const options = currencies.map((currency) => ({
      value: currency.id,
      label: `${currency.code} — ${currency.name}`,
    }));

    if (
      fallbackCurrencyOption &&
      !options.some((option) => option.value === fallbackCurrencyOption.value)
    ) {
      options.unshift(fallbackCurrencyOption);
    }

    return options;
  }, [currenciesQuery.data?.data, fallbackCurrencyOption]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      okText={common.save}
      cancelText={common.cancel}
      confirmLoading={submitting}
      destroyOnHidden
      forceRender
      width={640}
    >
      {errorMessage ? (
        <Alert
          type="error"
          showIcon
          message={errorMessage}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form layout="vertical" requiredMark>
        {mode === 'edit' && readOnlyCode ? (
          <Form.Item label={common.code} help={labels.codeReadonlyHint}>
            <Input value={readOnlyCode} disabled readOnly />
          </Form.Item>
        ) : null}

        <Form.Item
          label={common.name}
          required
          validateStatus={errors.name ? 'error' : undefined}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                autoComplete="off"
                placeholder={common.namePlaceholder}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={labels.role}
          required
          validateStatus={errors.isCustomer ? 'error' : undefined}
          help={errors.isCustomer?.message}
        >
          <Space wrap>
            <Controller
              name="isCustomer"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                >
                  {labels.customer}
                </Checkbox>
              )}
            />
            <Controller
              name="isSupplier"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                >
                  {labels.supplier}
                </Checkbox>
              )}
            />
          </Space>
        </Form.Item>

        <Form.Item
          label={labels.defaultCurrency}
          required
          validateStatus={errors.defaultCurrencyId ? 'error' : undefined}
          help={errors.defaultCurrencyId?.message}
        >
          <Controller
            name="defaultCurrencyId"
            control={control}
            render={({ field }) => (
              <Select
                showSearch
                optionFilterProp="label"
                loading={currenciesQuery.isLoading}
                options={currencyOptions}
                style={{ width: '100%' }}
                placeholder={labels.defaultCurrencyPlaceholder}
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? '')}
                onBlur={field.onBlur}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={labels.phone}
          validateStatus={errors.phone ? 'error' : undefined}
          help={errors.phone?.message}
        >
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                autoComplete="tel"
                inputMode="tel"
                placeholder={labels.phonePlaceholder}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={labels.email}
          validateStatus={errors.email ? 'error' : undefined}
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                autoComplete="email"
                type="email"
                placeholder={labels.emailPlaceholder}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={labels.taxNumber}
          validateStatus={errors.taxNumber ? 'error' : undefined}
          help={errors.taxNumber?.message}
        >
          <Controller
            name="taxNumber"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                autoComplete="off"
                placeholder={labels.taxNumberPlaceholder}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={labels.address}
          validateStatus={errors.address ? 'error' : undefined}
          help={errors.address?.message}
        >
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={2}
                placeholder={labels.addressPlaceholder}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={labels.notes}
          validateStatus={errors.notes ? 'error' : undefined}
          help={errors.notes?.message}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={3}
                placeholder={labels.notesPlaceholder}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
