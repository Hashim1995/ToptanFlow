import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Form, Input, Modal } from 'antd';
import {
  createUserFormSchema,
  editUserFormSchema,
  type CreateUserFormValues,
  type EditUserFormValues,
} from '../forms/users.schemas';
import { USERS_LABELS } from './labels';

type CreateUserFormModalProps = {
  open: boolean;
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (values: CreateUserFormValues) => Promise<void> | void;
};

export function CreateUserFormModal({
  open,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: CreateUserFormModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { fullName: '', username: '', password: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ fullName: '', username: '', password: '' });
    }
  }, [open, reset]);

  return (
    <Modal
      title={USERS_LABELS.create}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      okText={USERS_LABELS.save}
      cancelText={USERS_LABELS.cancel}
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
          label={USERS_LABELS.fullName}
          required
          validateStatus={errors.fullName ? 'error' : undefined}
          help={errors.fullName?.message}
        >
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={USERS_LABELS.fullNamePlaceholder}
                autoComplete="off"
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={USERS_LABELS.username}
          required
          validateStatus={errors.username ? 'error' : undefined}
          help={errors.username?.message}
        >
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={USERS_LABELS.usernamePlaceholder}
                autoComplete="off"
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={USERS_LABELS.password}
          required
          validateStatus={errors.password ? 'error' : undefined}
          help={errors.password?.message}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                placeholder={USERS_LABELS.passwordPlaceholder}
                autoComplete="new-password"
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type EditUserFormModalProps = {
  open: boolean;
  submitting: boolean;
  errorMessage?: string;
  initialValues: EditUserFormValues;
  onCancel: () => void;
  onSubmit: (values: EditUserFormValues) => Promise<void> | void;
};

export function EditUserFormModal({
  open,
  submitting,
  errorMessage,
  initialValues,
  onCancel,
  onSubmit,
}: EditUserFormModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [open, initialValues, reset]);

  return (
    <Modal
      title={USERS_LABELS.edit}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      okText={USERS_LABELS.save}
      cancelText={USERS_LABELS.cancel}
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
          label={USERS_LABELS.fullName}
          required
          validateStatus={errors.fullName ? 'error' : undefined}
          help={errors.fullName?.message}
        >
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={USERS_LABELS.fullNamePlaceholder}
                autoComplete="off"
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={USERS_LABELS.username}
          required
          validateStatus={errors.username ? 'error' : undefined}
          help={errors.username?.message}
        >
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={USERS_LABELS.usernamePlaceholder}
                autoComplete="off"
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={USERS_LABELS.newPassword}
          validateStatus={errors.password ? 'error' : undefined}
          help={errors.password?.message ?? USERS_LABELS.passwordOptionalHint}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                value={field.value ?? ''}
                placeholder={USERS_LABELS.passwordPlaceholder}
                autoComplete="new-password"
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
