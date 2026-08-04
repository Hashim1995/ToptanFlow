import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Space,
  Typography,
  message,
} from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key } from '@phosphor-icons/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { mapApiError } from '../../../api/map-api-error';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { appRequiredMark } from '../../../shared/ui/form-required-mark';
import { changePasswordRequest } from '../api/auth.api';
import { useAuth } from '../use-auth';
import { AUTH_LABELS } from '../ui/labels';

const { Title, Paragraph } = Typography;

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: `${AUTH_LABELS.currentPassword} boş ola bilməz.` }),
    newPassword: z
      .string()
      .min(8, { message: AUTH_LABELS.passwordTooShort })
      .max(255, { message: 'Şifrə çox uzundur.' }),
    newPasswordConfirmation: z
      .string()
      .min(1, {
        message: `${AUTH_LABELS.newPasswordConfirmation} boş ola bilməz.`,
      }),
  })
  .refine((values) => values.newPassword === values.newPasswordConfirmation, {
    message: AUTH_LABELS.passwordMismatch,
    path: ['newPasswordConfirmation'],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: AUTH_LABELS.passwordUnchanged,
    path: ['newPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function AccountSettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: '',
    },
  });

  useEffect(() => {
    document.title = `${AUTH_LABELS.accountTitle} · TOPTANFLOW`;
  }, []);

  async function onSubmit(values: ChangePasswordFormValues) {
    setSubmitError(null);
    try {
      await changePasswordRequest(values);
      reset();
      message.success(AUTH_LABELS.changePasswordSuccess);
      await auth.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      const mapped = mapApiError(error);
      setSubmitError(
        mapped.kind === 'unauthorized'
          ? AUTH_LABELS.wrongCurrentPassword
          : mapped.userMessage,
      );
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          {AUTH_LABELS.accountTitle}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {AUTH_LABELS.accountDescription}
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Profil">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Ad Soyad">
                {auth.user?.fullName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label={AUTH_LABELS.username}>
                {auth.user?.username ?? '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title={AUTH_LABELS.changePasswordTitle}>
            {submitError ? (
              <Alert
                type="error"
                showIcon
                message={submitError}
                style={{ marginBottom: 16 }}
              />
            ) : null}

            <Form
              layout="vertical"
              requiredMark={appRequiredMark}
              onFinish={() => void handleSubmit(onSubmit)()}
            >
              <Form.Item
                label={AUTH_LABELS.currentPassword}
                required
                validateStatus={errors.currentPassword ? 'error' : undefined}
                help={errors.currentPassword?.message}
              >
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      autoComplete="current-password"
                      placeholder={AUTH_LABELS.currentPasswordPlaceholder}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label={AUTH_LABELS.newPassword}
                required
                validateStatus={errors.newPassword ? 'error' : undefined}
                help={errors.newPassword?.message}
              >
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      autoComplete="new-password"
                      placeholder={AUTH_LABELS.newPasswordPlaceholder}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label={AUTH_LABELS.newPasswordConfirmation}
                required
                validateStatus={
                  errors.newPasswordConfirmation ? 'error' : undefined
                }
                help={errors.newPasswordConfirmation?.message}
              >
                <Controller
                  name="newPasswordConfirmation"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      autoComplete="new-password"
                      placeholder={
                        AUTH_LABELS.newPasswordConfirmationPlaceholder
                      }
                    />
                  )}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                icon={phIcon(Key, { size: ICON_SIZE.md })}
              >
                {AUTH_LABELS.changePasswordSubmit}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
