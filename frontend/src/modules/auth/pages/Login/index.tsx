import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal, List, Avatar } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined, BankOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/api';

// IMPORTAÇÃO DA FECHADURA CORRETA DO SEU SISTEMA
import { useAuthStore } from '../../../../store/useAuthStore';

const { Title, Text } = Typography;

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [unitSelectionModal, setUnitSelectionModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  
  // Guardando temporariamente os dados para caso ele tenha múltiplas unidades
  const [tempAuthData, setTempAuthData] = useState<{token: string, user: any, permissions: any} | null>(null);
  
  const navigate = useNavigate();
  
  // PEGANDO A FUNÇÃO DE SALVAR DO SEU STORE
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: values.email, 
        password: values.password
      });

      // O seu backend pode estar retornando 'token' ou 'accessToken' dependendo de como foi feito.
      // Vamos cobrir ambas as opções para garantir!
      const token = response.data.accessToken || response.data.token;
      const { units, user, permissions } = response.data;

      // Se o usuário só trabalha em UMA unidade, entra direto!
      if (units && units.length === 1) {
        handleSelectUnit(units[0], token, user, permissions);
      } 
      // Se ele trabalha em MAIS DE UMA unidade
      else if (units && units.length > 1) {
        setAvailableUnits(units);
        setTempAuthData({ token, user, permissions }); // Guarda para usar após o clique do modal
        setUnitSelectionModal(true);
      } 
      else {
        // Fallback: Entra normal (para o caso do backend não mandar units)
        // A MÁGICA ACONTECE AQUI: Usando o seu Store do Zustand!
        setAuth(user || {}, token, permissions || {});
        message.success('Bem-vindo ao sistema!');
        navigate('/dashboard'); // Agora o React Router te deixa passar suavemente!
      }

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message;
      if (Array.isArray(errorMsg)) {
        message.error(errorMsg[0]);
      } else {
        message.error(errorMsg || 'Usuário ou senha incorretos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUnit = (unit: any, token: string, user: any, permissions: any) => {
    // A unidade nós mantemos no localStorage para não bagunçar o seu store de autenticação
    localStorage.setItem('@PEP:unit', JSON.stringify(unit));
    
    // Passamos os dados para o Zustand fazer o trabalho dele
    setAuth(user || {}, token, permissions || {});
    
    setUnitSelectionModal(false);
    message.success(`Acessando: ${unit.nomeFantasia || 'Unidade'}`);
    navigate('/dashboard');
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
              onClick={() => handleSelectUnit(unit, tempAuthData?.token as string, tempAuthData?.user, tempAuthData?.permissions)}
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