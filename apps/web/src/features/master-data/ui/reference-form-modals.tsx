import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Form, Input, Modal, Switch } from 'antd';
import { appRequiredMark } from '../../../shared/ui/form-required-mark';
import {
  productCategoryFormSchema,
  unitFormSchema,
  type ProductCategoryFormValues,
  type UnitFormValues,
} from '../forms/reference-data.schemas';
import { MASTER_DATA_LABELS } from './labels';
import './reference-form-modals.css';

type UnitFormModalProps = {
  open: boolean;
  title: string;
  initialValues?: UnitFormValues;
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (values: UnitFormValues) => Promise<void> | void;
};

export function UnitFormModal({
  open,
  title,
  initialValues,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: UnitFormModalProps) {
  const labels = MASTER_DATA_LABELS.common;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormValues>({
    shouldFocusError: false,
    resolver: zodResolver(unitFormSchema),
    defaultValues: initialValues ?? {
      code: '',
      name: '',
      allowsFractionalQuantity: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        initialValues ?? {
          code: '',
          name: '',
          allowsFractionalQuantity: true,
        },
      );
    }
  }, [open, initialValues, reset]);

  return (
    <Modal
      className="ui-form-modal ui-master-data-form-modal reference-form-modal unit-form-modal"
      wrapClassName="reference-form-modal-wrap"
      title={title}
      open={open}
      centered
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      okText={labels.save}
      cancelText={labels.cancel}
      confirmLoading={submitting}
      destroyOnHidden
      forceRender
      width={560}
    >
      {errorMessage ? (
        <Alert
          className="reference-form-alert"
          type="error"
          showIcon
          message={errorMessage}
        />
      ) : null}
      <Form
        className="reference-form"
        layout="vertical"
        requiredMark={appRequiredMark}
      >
        <div className="reference-form-grid">
          <Form.Item
            label={labels.code}
            required
            validateStatus={errors.code ? 'error' : undefined}
            help={errors.code?.message}
          >
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  autoComplete="off"
                  placeholder="Məsələn: KG"
                />
              )}
            />
          </Form.Item>
          <Form.Item
            label={labels.name}
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
                  placeholder={labels.namePlaceholder}
                />
              )}
            />
          </Form.Item>
        </div>
        <Form.Item
          className="reference-switch-field"
          label={labels.fractional}
          required
        >
          <Controller
            name="allowsFractionalQuantity"
            control={control}
            render={({ field }) => (
              <div className="reference-switch-control">
                <Switch checked={field.value} onChange={field.onChange} />
                <span>{field.value ? labels.yes : labels.no}</span>
              </div>
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type ProductCategoryFormModalProps = {
  open: boolean;
  title: string;
  initialValues?: ProductCategoryFormValues;
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (values: ProductCategoryFormValues) => Promise<void> | void;
};

export function ProductCategoryFormModal({
  open,
  title,
  initialValues,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: ProductCategoryFormModalProps) {
  const common = MASTER_DATA_LABELS.common;
  const categoryLabels = MASTER_DATA_LABELS.categories;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductCategoryFormValues>({
    shouldFocusError: false,
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: initialValues ?? { name: '' },
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? { name: '' });
    }
  }, [open, initialValues, reset]);

  return (
    <Modal
      className="ui-form-modal ui-master-data-form-modal reference-form-modal category-form-modal"
      wrapClassName="reference-form-modal-wrap"
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
      width={560}
    >
      {errorMessage ? (
        <Alert
          className="reference-form-alert"
          type="error"
          showIcon
          message={errorMessage}
        />
      ) : null}
      <Form
        className="reference-form"
        layout="vertical"
        requiredMark={appRequiredMark}
      >
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
                placeholder={categoryLabels.namePlaceholder}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
