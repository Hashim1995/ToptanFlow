import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Checkbox, Form, Input, Modal } from 'antd';
import { appRequiredMark } from '../../../shared/ui/form-required-mark';
import {
  businessPartnerFormSchema,
  type BusinessPartnerFormValues,
} from '../forms/business-partner.schemas';
import { MASTER_DATA_LABELS } from './labels';
import './business-partner-modals.css';

type BusinessPartnerFormModalProps = {
  open: boolean;
  title: string;
  mode: 'create' | 'edit';
  readOnlyCode?: string;
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
  email: '',
};

export function BusinessPartnerFormModal({
  open,
  title,
  mode,
  readOnlyCode,
  initialValues,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: BusinessPartnerFormModalProps) {
  const labels = MASTER_DATA_LABELS.partners;
  const common = MASTER_DATA_LABELS.common;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessPartnerFormValues>({
    shouldFocusError: false,
    resolver: zodResolver(businessPartnerFormSchema),
    defaultValues: initialValues ?? emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? emptyValues);
    }
  }, [open, initialValues, reset]);

  return (
    <Modal
      className="ui-form-modal ui-master-data-form-modal business-partner-form-modal"
      wrapClassName="business-partner-modal-wrap"
      title={title}
      open={open}
      centered
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
          className="business-partner-form-alert"
          type="error"
          showIcon
          message={errorMessage}
        />
      ) : null}
      <Form
        className="business-partner-form"
        layout="vertical"
        requiredMark={appRequiredMark}
      >
        <section className="business-partner-form-section">
          <div className="business-partner-form-section-heading">
            Əsas məlumatlar
          </div>
          <div className="business-partner-form-grid">
            {mode === 'edit' && readOnlyCode ? (
              <Form.Item
                className="ui-form-field-readonly"
                label={labels.partnerCode}
                help={labels.codeReadonlyHint}
              >
                <Input value={readOnlyCode} disabled readOnly />
              </Form.Item>
            ) : null}

            <Form.Item
              className="business-partner-form-field-wide"
              label={labels.partnerName}
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
              className="business-partner-role-field business-partner-form-field-wide"
              label={labels.role}
              required
              validateStatus={errors.isCustomer ? 'error' : undefined}
              help={errors.isCustomer?.message}
            >
              <div className="business-partner-role-options">
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
              </div>
            </Form.Item>

            <Form.Item
              className="business-partner-form-field-wide"
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
          </div>
        </section>
      </Form>
    </Modal>
  );
}
