import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Select, DatePicker, message, Typography, Space, Tabs, Divider, Modal, Alert } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, IdcardOutlined, UserOutlined, ContactsOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { AccessPermissionsPanel } from '../../components/AccessPermissionsPanel';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

export const ProfessionalFormPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  
  // 🔥 ESTADOS DINÂMICOS
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [occupations, setOccupations] = useState<any[]>([]);
  
  // Observadores de campos
  const selectedOccupationId = Form.useWatch('occupationId', form);
  const nomeCompleto = Form.useWatch('nomeCompleto', form);
  const cpf = Form.useWatch('cpf', form);

  // 🔥 LÓGICA PARA DESCOBRIR O TIPO BASE DO CARGO SELECIONADO
  const currentOccupation = occupations.find(occ => occ.id === selectedOccupationId);
  const tipoBase = currentOccupation?.tipoBase || ''; // MEDICO, ENFERMEIRO ou ADMINISTRATIVO

  useEffect(() => {
    fetchInitialData();
    if (id) loadProfessional();
    else form.setFieldsValue({ status: 'ATIVO', acesso: { criarAcesso: false, permissoes: {} } });
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [specRes, occRes] = await Promise.all([
        api.get('/specialties', { params: { limit: 100 } }),
        api.get('/occupations', { params: { limit: 100 } })
      ]);
      setSpecialties(specRes.data?.data || specRes.data || []);
      setOccupations(occRes.data?.data || occRes.data || []);
    } catch (error) {
      console.warn("Aviso: Falha ao carregar catálogos dinâmicos.");
    }
  };

  const loadProfessional = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`).catch(() => api.get(`/doctors/${id}`));
      const data = res.data?.data || res.data;
      form.setFieldsValue({
        ...data,
        dataNascimento: data.dataNascimento ? dayjs(data.dataNascimento) : null,
        dataExpedicaoConselho: data.dataExpedicaoConselho ? dayjs(data.dataExpedicaoConselho) : null,
        occupationId: data.occupationId,
        specialtyId: data.specialties?.[0]?.specialtyId || data.specialtyId,
        acesso: {
          criarAcesso: !!data.userId,
          loginEmail: data.user?.email || data.email,
          roleId: data.user?.roleId || data.roleId,
          permissoes: data.user?.role?.permissoes || {},
        }
      });
    } catch (err) {
      message.error('Erro ao carregar dados.');
      navigate('/professionals');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        tipo: tipoBase, // Envia o tipo base (MEDICO/ENFERMEIRO) para o roteamento do backend
        dataNascimento: values.dataNascimento?.toISOString(),
        dataExpedicaoConselho: values.dataExpedicaoConselho?.toISOString(),
        crm: tipoBase === 'MEDICO' ? values.registroConselho : undefined,
        ufCrm: tipoBase === 'MEDICO' ? values.ufConselho : undefined,
        coren: tipoBase === 'ENFERMEIRO' ? values.registroConselho : undefined,
        ufCoren: tipoBase === 'ENFERMEIRO' ? values.ufConselho : undefined,
      };

      // Define o endpoint baseado no tipo base do cargo dinâmico
      const endpoint = tipoBase === 'MEDICO' ? '/doctors' : (tipoBase === 'ENFERMEIRO' ? '/nurses' : '/users');

      if (id) {
        await api.patch(`${endpoint}/${id}`, payload);
        message.success('Atualizado com sucesso!');
      } else {
        await api.post(endpoint, payload);
        message.success('Cadastrado com sucesso!');
      }
      navigate('/professionals');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao salvar. Verifique se o cargo e especialidade existem.');
    } finally {
      setLoading(false);
    }
  };

  const exigeConselho = ['MEDICO', 'ENFERMEIRO'].includes(tipoBase);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 0' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/professionals')} />
        <Title level={2} style={{ margin: 0 }}>Registro de Colaborador</Title>
      </Space>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Tabs type="card">
          <TabPane tab="Dados Pessoais" key="1">
            <Card>
              <Row gutter={16}>
                <Col span={16}><Form.Item name="nomeCompleto" label="Nome Completo" rules={[{required: true}]}><Input size="large" /></Form.Item></Col>
                <Col span={8}><Form.Item name="cpf" label="CPF" rules={[{required: true}]}><Input size="large" /></Form.Item></Col>
                <Col span={8}><Form.Item name="dataNascimento" label="Data de Nascimento"><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} size="large" /></Form.Item></Col>
                <Col span={8}><Form.Item name="emailPessoal" label="E-mail Pessoal"><Input size="large" /></Form.Item></Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane tab="Atuação e Departamentos" key="2">
            <Card>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="occupationId" label="Cargo / Função (CBO)" rules={[{required: true, message: 'Selecione o cargo cadastrado'}]}>
                    <Select size="large" showSearch placeholder="Pesquisar cargo cadastrado...">
                      {occupations.map(occ => (
                        <Option key={occ.id} value={occ.id}>{occ.nome} ({occ.tipoBase})</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* 🔥 ESPECIALIDADE DINÂMICA: Aparece se o Cargo selecionado for tipoBase MEDICO */}
                {tipoBase === 'MEDICO' && (
                  <Col span={12}>
                    <Form.Item name="specialtyId" label="Especialidade Médica" rules={[{ required: true }]}>
                      <Select size="large" showSearch placeholder="Selecione a especialidade">
                        {specialties.map(s => <Option key={s.id} value={s.id}>{s.nome}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                )}

                {exigeConselho && (
                  <>
                    <Divider orientation="left">Conselho de Classe</Divider>
                    <Col span={8}><Form.Item name="registroConselho" label="Nº Registro" rules={[{required: true}]}><Input size="large" /></Form.Item></Col>
                    <Col span={4}><Form.Item name="ufConselho" label="UF" rules={[{required: true}]}><Input size="large" maxLength={2} /></Form.Item></Col>
                    <Col span={12}><Form.Item name="dataExpedicaoConselho" label="Data de Expedição"><DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" /></Form.Item></Col>
                  </>
                )}
              </Row>
            </Card>
          </TabPane>

          <TabPane tab="Acessos" key="3">
             <Form.Item name="acesso"><AccessPermissionsPanel nomeProfissional={nomeCompleto} cpfProfissional={cpf} /></Form.Item>
          </TabPane>
        </Tabs>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
          <Button size="large" onClick={() => navigate('/professionals')}>Cancelar</Button>
          <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={loading}>Efetivar Cadastro</Button>
        </div>
      </Form>
    </div>
  );
};