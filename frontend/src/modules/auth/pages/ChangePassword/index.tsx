import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Layout, theme, notification } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/api';
import { useAuthStore } from '../../../../store/useAuthStore';

const { Content } = Layout;
const { Title, Text } = Typography;

const schema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof schema>;

export const ChangePasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const { control, handleSubmit, formState: { errors } } = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch('/users/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      notification.success({
        message: 'Senha alterada',
        description: 'Sua senha foi atualizada com sucesso. Você já pode acessar o sistema.'
      });

      // Atualiza o estado do usuário para remover a flag mustChangePassword
      if (user) {
        setAuth({ ...user, mustChangePassword: false }, useAuthStore.getState().accessToken!, useAuthStore.getState().permissions);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: 450 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3}>Troca de Senha Obrigatória</Title>
            <Text type="secondary">Para sua segurança, altere sua senha no primeiro acesso.</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item label="Senha Atual" validateStatus={errors.currentPassword ? 'error' : ''} help={errors.currentPassword?.message}>
              <Controller name="currentPassword" control={control} render={({ field }) => <Input.Password {...field} prefix={<LockOutlined />} />} />
            </Form.Item>

            <Form.Item label="Nova Senha" validateStatus={errors.newPassword ? 'error' : ''} help={errors.newPassword?.message}>
              <Controller name="newPassword" control={control} render={({ field }) => <Input.Password {...field} prefix={<LockOutlined />} />} />
            </Form.Item>

            <Form.Item label="Confirmar Nova Senha" validateStatus={errors.confirmPassword ? 'error' : ''} help={errors.confirmPassword?.message}>
              <Controller name="confirmPassword" control={control} render={({ field }) => <Input.Password {...field} prefix={<LockOutlined />} />} />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={loading} size="large">
              Atualizar Senha e Entrar
            </Button>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};