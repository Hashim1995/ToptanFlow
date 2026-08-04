import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignIn } from '@phosphor-icons/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { mapApiError } from '../../../api/map-api-error';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { appRequiredMark } from '../../../shared/ui/form-required-mark';
import { BrandLogo } from '../../../shared/ui/brand-logo';
import { useAuth } from '../use-auth';
import { AUTH_LABELS } from '../ui/labels';
import './login-page.css';

const { Title, Paragraph } = Typography;

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, { message: `${AUTH_LABELS.username} boş ola bilməz.` }),
  password: z
    .string()
    .min(1, { message: `${AUTH_LABELS.password} boş ola bilməz.` }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const auth = useAuth();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    shouldFocusError: false,
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  if (auth.authenticated) {
    const redirectTo =
      (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);
    try {
      await auth.login(values.username, values.password);
    } catch (error) {
      const mapped = mapApiError(error);
      setSubmitError(
        mapped.kind === 'unauthorized'
          ? AUTH_LABELS.invalidCredentials
          : mapped.userMessage,
      );
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-heading">
          <BrandLogo className="login-brand-logo" />
          <Title level={3}>{AUTH_LABELS.loginTitle}</Title>
        </div>
        <Paragraph type="secondary">{AUTH_LABELS.loginDescription}</Paragraph>

        {submitError ? (
          <Alert
            type="error"
            showIcon
            message={submitError}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Form
          className="login-form"
          layout="vertical"
          requiredMark={appRequiredMark}
          onFinish={() => void handleSubmit(onSubmit)()}
        >
          <Form.Item
            label={AUTH_LABELS.username}
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
                  autoComplete="username"
                  placeholder={AUTH_LABELS.usernamePlaceholder}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={AUTH_LABELS.password}
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
                  autoComplete="current-password"
                  placeholder={AUTH_LABELS.passwordPlaceholder}
                />
              )}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isSubmitting}
            icon={phIcon(SignIn, { size: ICON_SIZE.md })}
          >
            {AUTH_LABELS.submit}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
