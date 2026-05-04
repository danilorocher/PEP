import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Select, DatePicker, message, Typography, Space, Tabs, Divider, Modal } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, IdcardOutlined, UserOutlined, ContactsOutlined, CopyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { AccessPermissionsPanel } from '../../components/AccessPermissionsPanel';

const { Title, Text } = Typography;
const { Option, OptGroup } = Select;
const { TabPane } = Tabs;

export const ProfessionalFormPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  
  const tipoProfissional = Form.useWatch('tipo', form);
  const nomeCompleto = Form.useWatch('nomeCompleto', form);
  const cpf = Form.useWatch('cpf', form);

  useEffect(() => {
    if (id) loadProfessional();
    else form.setFieldsValue({ status: 'ATIVO', acesso: { criarAcesso: false, permissoes: {} } });
  }, [id]);

  const loadProfessional = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/professionals/${id}`);
      const data = res.data;
      form.setFieldsValue({
        ...data,
        dataNascimento: data.dataNascimento ? dayjs(data.dataNascimento) : null,
        dataExpedicaoConselho: data.dataExpedicaoConselho ? dayjs(data.dataExpedicaoConselho) : null,
        acesso: {
          criarAcesso: !!data.userId,
          loginEmail: data.user?.email,
          roleId: data.user?.roleId,
          permissoes: data.user?.role?.permissoes || {},
          perfilBase: 'PERSONALIZADO'
        }
      });
    } catch (err) {
      message.error('Erro ao carregar dados do colaborador.');
      navigate('/professionals');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNÇÃO PARA EXIBIR A SENHA PROVISÓRIA (Igual ao fluxo de RH do MV)
  const showAccessCreatedModal = (username: string, tempPass: string) => {
    Modal.success({
      title: 'Acesso ao Sistema Gerado!',
      width: 500,
      content: (
        <div style={{ marginTop: 16 }}>
          <Text>O login do colaborador foi criado. **Copie e entregue ao funcionário:**</Text>
          <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginTop: 12, border: '1px dashed #d9d9d9' }}>
            <p style={{ marginBottom: 8 }}><strong>Usuário:</strong> <Text code>{username}</Text></p>
            <p style={{ margin: 0 }}>
              <strong>Senha Provisória:</strong> <Text copyable={{ text: tempPass }} style={{ fontSize: 18, color: '#1890ff', fontWeight: 'bold' }}>{tempPass}</Text>
            </p>
          </div>
          <Alert 
            style={{ marginTop: 16 }}
            message="Troca Obrigatória" 
            description="O colaborador será forçado a criar uma senha definitiva no primeiro acesso." 
            type="warning" 
            showIcon 
          />
        </div>
      ),
      onOk: () => navigate('/professionals')
    });
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        dataNascimento: values.dataNascimento ? values.dataNascimento.toISOString() : null,
        dataExpedicaoConselho: values.dataExpedicaoConselho ? values.dataExpedicaoConselho.toISOString() : null,
      };

      if (id) {
        await api.put(`/professionals/${id}`, payload);
        message.success('Colaborador atualizado com sucesso!');
        navigate('/professionals');
      } else {
        const res = await api.post('/professionals', payload);
        
        // Se o checkbox de criar acesso foi marcado, mostramos o modal de senha
        if (values.acesso?.criarAcesso) {
           const tempPassword = res.data?.tempPassword || "PEP@2026Prov"; // Fallback caso o backend não envie
           showAccessCreatedModal(values.acesso.loginEmail, tempPassword);
        } else {
           message.success('Colaborador cadastrado com sucesso!');
           navigate('/professionals');
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao salvar colaborador.');
    } finally {
      setLoading(false);
    }
  };

  const exigeConselho = [
    'MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'AUXILIAR_ENFERMAGEM', 
    'FARMACEUTICO', 'FISIOTERAPEUTA', 'NUTRICIONISTA', 'BIOMEDICO', 
    'FONOAUDIOLOGO', 'PSICOLOGO', 'ASSISTENTE_SOCIAL', 'TECNICO_RADIOLOGIA'
  ].includes(tipoProfissional);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 0' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/professionals')} />
        <Title level={2} style={{ margin: 0 }}>Ficha de Registro do Colaborador</Title>
      </Space>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Tabs type="card" defaultActiveKey="1">
          
          {/* --- ABA 1: DADOS PESSOAIS --- */}
          <TabPane tab={<span><UserOutlined /> Dados Pessoais</span>} key="1">
            <Card bordered={false}>
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item name="nomeCompleto" label="Nome Completo" rules={[{required: true, message: 'Obrigatório'}]}>
                    <Input size="large" placeholder="Nome completo sem abreviações" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="cpf" label="CPF" rules={[{required: true, message: 'Obrigatório'}]}>
                    <Input size="large" placeholder="000.000.000-00" />
                  </Form.Item>
                </Col>
                
                <Col span={8}><Form.Item name="rg" label="RG / Órgão Emissor"><Input size="large" /></Form.Item></Col>
                <Col span={8}><Form.Item name="dataNascimento" label="Data de Nascimento"><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} size="large" /></Form.Item></Col>
                <Col span={8}>
                  <Form.Item name="sexo" label="Gênero">
                    <Select size="large">
                      <Option value="MASCULINO">Masculino</Option>
                      <Option value="FEMININO">Feminino</Option>
                      <Option value="OUTRO">Outro</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Divider orientation="left" plain>Endereço e Contato</Divider>
                <Col span={10}><Form.Item name="emailPessoal" label="E-mail Pessoal"><Input size="large" placeholder="Para comunicações do RH" /></Form.Item></Col>
                <Col span={7}><Form.Item name="telefonePrincipal" label="Telefone Principal"><Input size="large" /></Form.Item></Col>
                <Col span={7}><Form.Item name="telefoneEmergencia" label="Contato de Emergência"><Input size="large" /></Form.Item></Col>
                
                <Col span={5}><Form.Item name="cep" label="CEP"><Input size="large" /></Form.Item></Col>
                <Col span={15}><Form.Item name="logradouro" label="Logradouro"><Input size="large" /></Form.Item></Col>
                <Col span={4}><Form.Item name="numero" label="Nº"><Input size="large" /></Form.Item></Col>
              </Row>
            </Card>
          </TabPane>

          {/* --- ABA 2: ATUAÇÃO PROFISSIONAL --- */}
          <TabPane tab={<span><IdcardOutlined /> Atuação e Departamentos</span>} key="2">
            <Card bordered={false}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="tipo" label="Cargo / Função (CBO)" rules={[{required: true, message: 'Selecione a função'}]}>
                    <Select size="large" showSearch placeholder="Pesquisar cargo...">
                      <OptGroup label="Corpo Clínico e Assistencial">
                        <Option value="MEDICO">Médico(a)</Option>
                        <Option value="ENFERMEIRO">Enfermeiro(a) Padrão</Option>
                        <Option value="TECNICO_ENFERMAGEM">Técnico(a) de Enfermagem</Option>
                        <Option value="AUXILIAR_ENFERMAGEM">Auxiliar de Enfermagem</Option>
                        <Option value="FISIOTERAPEUTA">Fisioterapeuta</Option>
                        <Option value="NUTRICIONISTA">Nutricionista</Option>
                        <Option value="PSICOLOGO">Psicólogo(a)</Option>
                        <Option value="ASSISTENTE_SOCIAL">Assistente Social</Option>
                        <Option value="FONOAUDIOLOGO">Fonoaudiólogo(a)</Option>
                      </OptGroup>
                      <OptGroup label="Diagnóstico e Terapia">
                        <Option value="FARMACEUTICO">Farmacêutico(a)</Option>
                        <Option value="BIOMEDICO">Biomédico(a) / Analista Lab</Option>
                        <Option value="TECNICO_LABORATORIO">Técnico de Laboratório</Option>
                        <Option value="TECNICO_RADIOLOGIA">Técnico de Radiologia</Option>
                      </OptGroup>
                      <OptGroup label="Administrativo e Jurídico">
                        <Option value="RECEPCIONISTA">Recepcionista / Atendimento</Option>
                        <Option value="FATURAMENTO">Analista de Faturamento</Option>
                        <Option value="AUDITORIA">Auditor de Contas</Option>
                        <Option value="ADMINISTRATIVO">Auxiliar Administrativo</Option>
                        <Option value="RH">Analista de RH</Option>
                        <Option value="TI">Analista de TI / Sistemas</Option>
                        <Option value="JURIDICO">Advogado(a) / Jurídico</Option>
                        <Option value="FINANCEIRO">Analista Financeiro</Option>
                      </OptGroup>
                      <OptGroup label="Operacional e Apoio">
                        <Option value="MAQUEIRO">Maqueiro(a)</Option>
                        <Option value="HIGIENIZACAO">Higienização / Limpeza</Option>
                        <Option value="MANUTENCAO">Manutenção Predial</Option>
                        <Option value="COPA_COZINHA">Copa / Cozinha</Option>
                        <Option value="SEGURANCA">Segurança / Vigilância</Option>
                      </OptGroup>
                      <OptGroup label="Gestão">
                        <Option value="DIRETORIA">Diretoria Executiva</Option>
                        <Option value="GERENTE">Gerente de Unidade</Option>
                      </OptGroup>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="cns" label="Cartão Nacional de Saúde (CNS)">
                    <Input size="large" placeholder="700.0000.0000.0000" />
                  </Form.Item>
                </Col>

                {exigeConselho && (
                  <>
                    <Divider orientation="left" plain>Conselho de Classe</Divider>
                    <Col span={8}>
                      <Form.Item name="registroConselho" label="Número do Registro" rules={[{required: true, message: 'Informe o registro'}]}>
                        <Input size="large" placeholder="Ex: 123456" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="ufConselho" label="UF" rules={[{required: true, message: 'UF'}]}>
                        <Input size="large" maxLength={2} style={{ textTransform: 'uppercase' }} placeholder="SP" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="dataExpedicaoConselho" label="Data de Expedição do Registro">
                        <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          </TabPane>

          {/* --- ABA 3: PERMISSÕES E LOGIN --- */}
          <TabPane tab={<span><ContactsOutlined /> Acessos ao Sistema</span>} key="3">
             <Form.Item name="acesso">
                <AccessPermissionsPanel 
                  nomeProfissional={nomeCompleto} 
                  cpfProfissional={cpf} 
                />
             </Form.Item>
          </TabPane>
        </Tabs>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
          <Button size="large" onClick={() => navigate('/professionals')}>Cancelar</Button>
          <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={loading}>
            Efetivar Cadastro no PEP+
          </Button>
        </div>
      </Form>
    </div>
  );
};