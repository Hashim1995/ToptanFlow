import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Form, Input, Modal, Switch } from 'antd';
import {
  currencyFormSchema,
  unitFormSchema,
  type CurrencyFormValues,
  type UnitFormValues,
} from '../forms/reference-data.schemas';
import { MASTER_DATA_LABELS } from './labels';

type CurrencyFormModalProps = {
  open: boolean;
  title: string;
  initialValues?: CurrencyFormValues;
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (values: CurrencyFormValues) => Promise<void> | void;
};

export function CurrencyFormModal({
  open,
  title,
  initialValues,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: CurrencyFormModalProps) {
  const labels = MASTER_DATA_LABELS.common;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: initialValues ?? { code: '', name: '', symbol: '' },
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? { code: '', name: '', symbol: '' });
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
      <Form layout="vertical">
        <Form.Item
          label={labels.code}
          required
          validateStatus={errors.code ? 'error' : undefined}
          help={errors.code?.message}
        >
          <Controller
            name="code"
            control={control}
            render={({ field }) => <Input {...field} autoComplete="off" />}
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
            render={({ field }) => <Input {...field} autoComplete="off" />}
          />
        </Form.Item>
        <Form.Item
          label={labels.symbol}
          validateStatus={errors.symbol ? 'error' : undefined}
          help={errors.symbol?.message}
        >
          <Controller
            name="symbol"
            control={control}
            render={({ field }) => <Input {...field} autoComplete="off" />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

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
      <Form layout="vertical">
        <Form.Item
          label={labels.code}
          required
          validateStatus={errors.code ? 'error' : undefined}
          help={errors.code?.message}
        >
          <Controller
            name="code"
            control={control}
            render={({ field }) => <Input {...field} autoComplete="off" />}
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
            render={({ field }) => <Input {...field} autoComplete="off" />}
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
