import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Layout, Space, theme } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../../shared/services/api';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useTenantStore } from '../../../../store/useTenantStore';

const { Content } = Layout;
const { Title, Text } = Typography;

const loginSchema = z.object({
  tenant: z.string().min(1, 'Identificador da clínica é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const { setTenant, subdomain } = useTenantStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const from = location.state?.from?.pathname || '/dashboard';

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenant: subdomain || '',
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      // Atualiza o tenant no store antes da requisição
      setTenant(data.tenant, null);

      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      });

      const { user, accessToken, permissions } = response.data;

      setAuth(user, accessToken, permissions);

      if (user.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: token.colorPrimary, margin: 0 }}>PEP+</Title>
            <Text type="secondary">Prontuário Eletrônico de Pacientes</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Clínica / Unidade"
              validateStatus={errors.tenant ? 'error' : ''}
              help={errors.tenant?.message}
            >
              <Controller
                name="tenant"
                control={control}
                render={({ field }) => (
                  <Input {...field} prefix={<GlobalOutlined />} placeholder="Ex: clinica-alpha" disabled={!!subdomain && subdomain !== 'localhost'} />
                )}
              />
            </Form.Item>

            <Form.Item
              label="E-mail"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input {...field} prefix={<UserOutlined />} placeholder="seu@email.com" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Senha"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} prefix={<LockOutlined />} placeholder="********" />
                )}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} size="large">
                Entrar no Sistema
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Acesso restrito a colaboradores autorizados.
            </Text>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};