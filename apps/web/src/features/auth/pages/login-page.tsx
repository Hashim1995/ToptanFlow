import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { mapApiError } from '../../../api/map-api-error';
import { useAuth } from '../use-auth';
import { AUTH_LABELS } from '../ui/labels';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          {AUTH_LABELS.loginTitle}
        </Title>
        <Paragraph type="secondary">{AUTH_LABELS.loginDescription}</Paragraph>

        {submitError ? (
          <Alert
            type="error"
            showIcon
            message={submitError}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Form layout="vertical" onFinish={() => void handleSubmit(onSubmit)()}>
          <Form.Item
            label={AUTH_LABELS.username}
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
          >
            {AUTH_LABELS.submit}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
