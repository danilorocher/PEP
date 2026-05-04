import React, { useEffect, useState } from 'react';
import { Card, Switch, Typography, Row, Col, Input, Alert, Spin, message, Modal } from 'antd';
import { SafetyCertificateOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';
import { PermissionsMatrix } from '../PermissionsMatrix';
import { PermissionsPreview } from '../PermissionsPreview';

const { Text, Title } = Typography;

export interface AccessPermissionsValue {
  criarAcesso: boolean;
  loginEmail?: string;
  roleId?: string;
  permissoes: Record<string, Record<string, boolean>>;
  perfilBase?: string;
}

interface AccessPermissionsPanelProps {
  value?: AccessPermissionsValue;
  onChange?: (value: AccessPermissionsValue) => void;
  nomeProfissional?: string;
  cpfProfissional?: string;
}

export const AccessPermissionsPanel: React.FC<AccessPermissionsPanelProps> = ({ 
  value = { criarAcesso: false, permissoes: {} }, 
  onChange,
  nomeProfissional,
  cpfProfissional
}) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await api.get('/permissions/templates');
        setTemplates(response.data);
      } catch (error) {
        message.error('Erro ao carregar templates de permissão.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // 🔥 GERADOR AUTOMÁTICO DE LOGIN (Padrão MV/Tasy: primeiro_nome.3_digitos_cpf)
  useEffect(() => {
    if (value.criarAcesso && nomeProfissional && cpfProfissional && cpfProfissional.length >= 3) {
      // Só auto-preenche se o campo estiver vazio para não apagar se o RH já tiver editado
      if (!value.loginEmail) {
        const primeiroNome = nomeProfissional.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const iniciaisCpf = cpfProfissional.replace(/\D/g, '').substring(0, 3);
        const loginGerado = `${primeiroNome}.${iniciaisCpf}`;
        triggerChange({ loginEmail: loginGerado });
      }
    }
  }, [nomeProfissional, cpfProfissional, value.criarAcesso]);

  const triggerChange = (changedValue: Partial<AccessPermissionsValue>) => {
    onChange?.({ ...value, ...changedValue });
  };

  const handleTemplateSelect = (template: any) => {
    const hasExistingPerms = Object.keys(value.permissoes || {}).length > 0;
    if (hasExistingPerms && value.perfilBase !== template.key) {
      Modal.confirm({
        title: 'Alterar Template Base?',
        content: 'Isto substituirá TODAS as permissões configuradas atualmente. Deseja continuar?',
        okText: 'Sim, Substituir',
        cancelText: 'Cancelar',
        onOk: () => triggerChange({ perfilBase: template.key, permissoes: template.permissoes })
      });
    } else {
      triggerChange({ perfilBase: template.key, permissoes: template.permissoes });
    }
  };

  const isReadonlyAdmin = value.perfilBase === 'ADMINISTRADOR';

  return (
    <Card 
      title={<><SafetyCertificateOutlined /> Credenciais e Acesso ao Sistema</>} 
      style={{ marginBottom: 24, border: value.criarAcesso ? '1px solid #1890ff' : undefined }}
    >
      <Row align="middle" style={{ marginBottom: value.criarAcesso ? 24 : 0 }}>
        <Col span={24}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Switch checked={value.criarAcesso} onChange={(checked) => triggerChange({ criarAcesso: checked })} />
            <Text strong>Habilitar acesso ao sistema PEP+ para este colaborador</Text>
          </div>
        </Col>
      </Row>

      {value.criarAcesso && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          
          <Card type="inner" style={{ marginBottom: 24, backgroundColor: '#f0f5ff', borderColor: '#adc6ff' }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Text strong>Nome de Usuário (Login) *</Text>
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="ex: joao.123" 
                  value={value.loginEmail}
                  onChange={(e) => triggerChange({ loginEmail: e.target.value })}
                  style={{ marginTop: 8 }}
                  size="large"
                />
                <Text type="secondary" style={{ fontSize: 11 }}>Gerado automaticamente: Nome + 3 dígitos do CPF.</Text>
              </Col>
              <Col xs={24} md={12}>
                <Alert 
                  message="Senha Segura Automática" 
                  description="Ao salvar, o sistema exibirá na tela uma senha provisória aleatória. O funcionário deverá trocá-la no primeiro acesso." 
                  type="info" 
                  showIcon 
                />
              </Col>
            </Row>
          </Card>

          <Title level={5}>Perfil de Acesso (Matriz)</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Selecione o template que descreve a função do usuário.</Text>
          
          {loading ? <Spin /> : (
            <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
              {templates.map(tpl => (
                <Col xs={24} sm={12} md={8} lg={6} key={tpl.key}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => handleTemplateSelect(tpl)}
                    style={{ 
                      borderColor: value.perfilBase === tpl.key ? tpl.cor : undefined,
                      backgroundColor: value.perfilBase === tpl.key ? `${tpl.cor}15` : undefined,
                      borderWidth: value.perfilBase === tpl.key ? 2 : 1,
                    }}
                  >
                    <Title level={5} style={{ color: tpl.cor, margin: 0 }}>{tpl.label}</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>{tpl.descricao}</Text>
                  </Card>
                </Col>
              ))}
              <Col xs={24} sm={12} md={8} lg={6}>
                 <Card
                    hoverable
                    size="small"
                    onClick={() => handleTemplateSelect({ key: 'PERSONALIZADO', permissoes: {} })}
                    style={{ 
                      borderColor: value.perfilBase === 'PERSONALIZADO' ? '#1890ff' : undefined,
                      backgroundColor: value.perfilBase === 'PERSONALIZADO' ? '#e6f7ff' : undefined,
                    }}
                  >
                    <Title level={5} style={{ color: '#1890ff', margin: 0 }}>⚙️ Personalizado</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Matriz em branco.</Text>
                  </Card>
              </Col>
            </Row>
          )}

          {value.perfilBase && (
            <>
              <PermissionsMatrix value={value.permissoes} disabled={isReadonlyAdmin} onChange={(novasPermissoes) => triggerChange({ permissoes: novasPermissoes, perfilBase: 'PERSONALIZADO' })} />
              <PermissionsPreview permissoes={value.permissoes} />
            </>
          )}
        </div>
      )}
    </Card>
  );
};