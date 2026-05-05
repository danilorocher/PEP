import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal, List, Avatar } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined, BankOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/api';
import { useAuthStore } from '../../../../store/useAuthStore';

const { Title, Text } = Typography;

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [unitSelectionModal, setUnitSelectionModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  
  // 🔥 MÁGICA: Guardar as credenciais digitadas para o "Duplo Check-in"
  const [formValues, setFormValues] = useState<any>(null);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 1. Limpa o cache antigo para garantir que a busca inicial seja GLOBAL
      localStorage.removeItem('@PEP:unit');

      const response = await api.post('/auth/login', {
        email: values.email, 
        password: values.password
      });

      const token = response.data.accessToken || response.data.token;
      const { units, user, permissions } = response.data;

      if (units && units.length > 1) {
        // Se trabalha em mais de 1 unidade, guarda os dados do formulário e abre o Modal
        setAvailableUnits(units);
        setFormValues(values); // 👈 Guardamos o e-mail e senha aqui!
        setUnitSelectionModal(true);
      } else {
        if (units && units.length === 1) {
          localStorage.setItem('@PEP:unit', JSON.stringify(units[0]));
        }
        setAuth(user || {}, token, permissions || {});
        message.success('Bem-vindo ao sistema!');
        navigate('/dashboard');
      }

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message;
      message.error(Array.isArray(errorMsg) ? errorMsg[0] : (errorMsg || 'Usuário ou senha incorretos.'));
    } finally {
      setLoading(false);
    }
  };

// 🔥 MÁGICA: O Duplo Check-in Silencioso para buscar o Token correto da Unidade
  const handleSelectUnit = async (unit: any) => {
    try {
      // 1. Dizemos ao navegador qual é o hospital (o api.ts vai ler isto)
      localStorage.setItem('@PEP:unit', JSON.stringify(unit));
      
      // 2. Refazemos o login silenciosamente usando os dados guardados.
      const response = await api.post('/auth/login', formValues);
      
      const newToken = response.data.accessToken || response.data.token;
      const { user, permissions } = response.data;
      
      // 3. Salvamos a sessão correta (com o Crachá novo) e entramos!
      setAuth(user || {}, newToken, permissions || {});
      
      setUnitSelectionModal(false);
      message.success(`Acessando: ${unit.nomeFantasia || 'Unidade'}`);
      navigate('/dashboard');
    } catch (error: any) {
      // 🔥 CORREÇÃO: Em vez de mensagem genérica, exibimos a real (Ex: "Muitas tentativas. Conta bloqueada temporariamente")
      message.error(error.response?.data?.message || 'Erro ao gerar credencial para a unidade selecionada. Tente novamente.');
      localStorage.removeItem('@PEP:unit');
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)' 
    }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#1890ff', margin: 0 }}>PEP+</Title>
          <Text type="secondary">Prontuário Eletrônico Profissional</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item 
            name="email" 
            rules={[
              { required: true, message: 'Informe seu e-mail' },
              { type: 'email', message: 'Formato de e-mail inválido' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="E-mail de acesso" 
              size="large" 
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[{ required: true, message: 'Informe sua senha' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="Senha" 
              size="large" 
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              icon={<LoginOutlined />}
              loading={loading}
            >
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="Selecione o Local de Atendimento"
        open={unitSelectionModal}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <Text type="secondary">Você possui acesso a múltiplas unidades. Escolha onde vai atuar neste plantão/sessão:</Text>
        <List
          style={{ marginTop: 16 }}
          dataSource={availableUnits}
          renderItem={(unit) => (
            <List.Item 
              style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 8 }}
              className="unit-list-item"
              // 🔥 AQUI chamamos a função inteligente que refaz o login
              onClick={() => handleSelectUnit(unit)}
              actions={[<RightOutlined style={{ color: '#1890ff' }} />]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<BankOutlined />} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />}
                title={<b>{unit.nomeFantasia}</b>}
                description={`CNPJ: ${unit.cnpj}`}
              />
            </List.Item>
          )}
        />
        <Button block onClick={() => setUnitSelectionModal(false)} style={{ marginTop: 8 }}>
          Cancelar e Voltar
        </Button>
      </Modal>

      <style>{`
        .unit-list-item:hover { background-color: #f5f5f5; border-color: #1890ff !important; }
      `}</style>
    </div>
  );
};