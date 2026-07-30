import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Form, Input, Modal, Select } from 'antd';
import {
  warehouseFormSchema,
  type WarehouseFormValues,
} from '../forms/warehouse.schemas';
import type { WarehouseKind } from '../api/warehouses.api';
import { MASTER_DATA_LABELS, warehouseKindLabel } from './labels';

type WarehouseFormModalProps = {
  open: boolean;
  title: string;
  mode: 'create' | 'edit';
  readOnlyCode?: string;
  initialValues?: WarehouseFormValues;
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (values: WarehouseFormValues) => Promise<void> | void;
};

const emptyValues: WarehouseFormValues = {
  name: '',
  kind: 'GENERAL',
};

export function WarehouseFormModal({
  open,
  title,
  mode,
  readOnlyCode,
  initialValues,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: WarehouseFormModalProps) {
  const labels = MASTER_DATA_LABELS.warehouses;
  const common = MASTER_DATA_LABELS.common;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: initialValues ?? emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? emptyValues);
    }
  }, [open, initialValues, reset]);

  const kindOptions = (Object.keys(labels.kinds) as WarehouseKind[]).map(
    (kind) => ({
      value: kind,
      label: warehouseKindLabel(kind),
    }),
  );

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
          label={labels.kind}
          required
          validateStatus={errors.kind ? 'error' : undefined}
          help={errors.kind?.message}
        >
          <Controller
            name="kind"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={kindOptions}
                style={{ width: '100%' }}
                placeholder={labels.kindPlaceholder}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
