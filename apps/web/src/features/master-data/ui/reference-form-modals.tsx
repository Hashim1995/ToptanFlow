import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Form, Input, Modal, Switch } from 'antd';
import {
  productCategoryFormSchema,
  unitFormSchema,
  type ProductCategoryFormValues,
  type UnitFormValues,
} from '../forms/reference-data.schemas';
import { MASTER_DATA_LABELS } from './labels';

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
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      okText={labels.save}
      cancelText={labels.cancel}
      confirmLoading={submitting}
      destroyOnHidden
      forceRender
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
        <Form.Item label={labels.fractional}>
          <Controller
            name="allowsFractionalQuantity"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
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
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      okText={common.save}
      cancelText={common.cancel}
      confirmLoading={submitting}
      destroyOnHidden
      forceRender
    >
      {errorMessage ? (
        <Alert
          type="error"
          showIcon
          message={errorMessage}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form layout="vertical">
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
