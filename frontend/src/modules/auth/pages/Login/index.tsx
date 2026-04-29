import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal, List, Avatar } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined, BankOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [unitSelectionModal, setUnitSelectionModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [tempToken, setTempToken] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Ajustado para enviar 'email' em vez de 'username'
      const response = await api.post('/auth/login', {
        email: values.email, 
        password: values.password
      });

      const { token, units } = response.data;

      // Se o usuário só trabalha em UMA unidade, entra direto!
      if (units && units.length === 1) {
        handleSelectUnit(units[0], token);
      } 
      // Se ele trabalha em MAIS DE UMA
      else if (units && units.length > 1) {
        setAvailableUnits(units);
        setTempToken(token);
        setUnitSelectionModal(true);
      } 
      else {
        // Fallback caso o backend já mande o usuário direto
        localStorage.setItem('@PEP:token', token);
        localStorage.setItem('@PEP:user', JSON.stringify(response.data.user || {}));
        message.success('Bem-vindo ao sistema!');
        
        // CORREÇÃO AQUI: Forçar reload para atualizar o useAuthStore
        window.location.href = '/dashboard';
      }

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message;
      // Tratamento para caso o backend retorne um array de erros (comum em validações DTO)
      if (Array.isArray(errorMsg)) {
        message.error(errorMsg[0]);
      } else {
        message.error(errorMsg || 'Usuário ou senha incorretos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUnit = (unit: any, token: string) => {
    localStorage.setItem('@PEP:token', token);
    localStorage.setItem('@PEP:unit', JSON.stringify(unit));
    setUnitSelectionModal(false);
    message.success(`Acessando: ${unit.nomeFantasia}`);
    
    // CORREÇÃO AQUI TAMBÉM: Forçar reload para atualizar o useAuthStore
    window.location.href = '/dashboard';
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
          {/* Ajustado o name para 'email' e adicionada a validação visual do Ant Design */}
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
              onClick={() => handleSelectUnit(unit, tempToken as string)}
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