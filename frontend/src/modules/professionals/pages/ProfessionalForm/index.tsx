import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Select, DatePicker, message, Divider, Typography, Switch } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, IdcardOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Title } = Typography;
const { Option } = Select;

export const ProfessionalFormPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  
  // Observa os campos para mudar a tela dinamicamente
  const tipoProfissional = Form.useWatch('tipo', form);
  const criarAcesso = Form.useWatch('criarAcessoSistema', form);

  useEffect(() => {
    if (id) {
      loadProfessional();
    } else {
      form.setFieldsValue({ status: 'ATIVO', criarAcessoSistema: false });
    }
  }, [id]);

  const loadProfessional = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/professionals/${id}`).catch(() => {
        throw new Error('Erro ao buscar dados do profissional.');
      });
      const data = response.data;
      
      form.setFieldsValue({
        ...data,
        dataNascimento: data.dataNascimento ? dayjs(data.dataNascimento) : null,
      });
    } catch (error: any) {
      message.error(error.message || 'Erro ao carregar profissional');
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
        dataNascimento: values.dataNascimento ? values.dataNascimento.toISOString() : null,
      };

      if (id) {
        await api.put(`/professionals/${id}`, payload);
        message.success('Profissional atualizado com sucesso!');
      } else {
        await api.post('/professionals', payload);
        message.success('Profissional cadastrado com sucesso!');
      }
      navigate('/professionals');
    } catch (error: any) {
      console.error(error);
      message.error('Erro ao salvar os dados. Verifique a API.');
    } finally {
      setLoading(false);
    }
  };

  // Define a etiqueta do Conselho de Classe (CRM, COREN, etc)
  const getConselhoLabel = () => {
    switch (tipoProfissional) {
      case 'MEDICO': return 'CRM';
      case 'ENFERMEIRO': 
      case 'TECNICO_ENFERMAGEM': 
      case 'AUXILIAR_ENFERMAGEM': return 'COREN'; // Auxiliar de enfermagem também usa COREN
      case 'FARMACEUTICO': return 'CRF';
      case 'FISIOTERAPEUTA': return 'CREFITO';
      case 'PSICOLOGO': return 'CRP';
      case 'NUTRICIONISTA': return 'CRN';
      default: return 'Registro Profissional';
    }
  };

  // Verifica se a profissão escolhida exige número de conselho
  const exigeConselho = ['MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'AUXILIAR_ENFERMAGEM', 'FARMACEUTICO', 'FISIOTERAPEUTA', 'PSICOLOGO', 'NUTRICIONISTA'].includes(tipoProfissional);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/professionals')} />
        <Title level={2} style={{ margin: 0 }}>
          {id ? 'Editar Colaborador' : 'Novo Colaborador'}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <Card title={<><UserOutlined /> Dados Pessoais</>} style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="nomeCompleto" label="Nome Completo" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="Digite o nome completo" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="cpf" label="CPF" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="000.000.000-00" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="dataNascimento" label="Data de Nascimento">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="telefone" label="Telefone / Celular">
                <Input placeholder="(00) 00000-0000" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item name="email" label="E-mail Pessoal">
                <Input placeholder="email@exemplo.com" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="sexo" label="Gênero">
                <Select placeholder="Selecione" size="large">
                  <Option value="MASCULINO">Masculino</Option>
                  <Option value="FEMININO">Feminino</Option>
                  <Option value="OUTRO">Outro</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title={<><IdcardOutlined /> Atuação Profissional</>} style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="tipo" label="Cargo / Função" rules={[{ required: true, message: 'Selecione o cargo' }]}>
                <Select placeholder="Selecione o tipo" size="large" showSearch>
                  <Option value="MEDICO">Médico(a)</Option>
                  <Option value="ENFERMEIRO">Enfermeiro(a)</Option>
                  <Option value="TECNICO_ENFERMAGEM">Téc. de Enfermagem</Option>
                  <Option value="AUXILIAR_ENFERMAGEM">Auxiliar de Enfermagem</Option>
                  <Option value="FARMACEUTICO">Farmacêutico(a)</Option>
                  <Option value="FISIOTERAPEUTA">Fisioterapeuta</Option>
                  <Option value="PSICOLOGO">Psicólogo(a)</Option>
                  <Option value="NUTRICIONISTA">Nutricionista</Option>
                  <Option value="RECEPCIONISTA">Recepcionista</Option>
                  <Option value="ADMINISTRATIVO">Administrativo</Option>
                  <Option value="DIRETORIA">Diretoria</Option>
                  <Option value="SERVICOS_GERAIS">Serviços Gerais</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Sub-item DINÂMICO 1: Aparece apenas se for MÉDICO */}
            {tipoProfissional === 'MEDICO' && (
              <Col xs={24} md={16}>
                <Form.Item name="especialidade" label="Especialidade Principal" rules={[{ required: true, message: 'Informe a especialidade' }]}>
                  <Select placeholder="Selecione a especialidade médica" size="large" showSearch>
                    <Option value="CARDIOLOGIA">Cardiologia</Option>
                    <Option value="CLINICA_MEDICA">Clínica Médica / Geral</Option>
                    <Option value="DERMATOLOGIA">Dermatologia</Option>
                    <Option value="GINECOLOGIA">Ginecologia e Obstetrícia</Option>
                    <Option value="NEUROLOGIA">Neurologia</Option>
                    <Option value="ORTOPEDIA">Ortopedia e Traumatologia</Option>
                    <Option value="PEDIATRIA">Pediatria</Option>
                    <Option value="PSIQUIATRIA">Psiquiatria</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            {/* Sub-item DINÂMICO 2: Aparece apenas se for ADMINISTRATIVO */}
            {tipoProfissional === 'ADMINISTRATIVO' && (
              <Col xs={24} md={16}>
                <Form.Item name="setorAdministrativo" label="Setor / Departamento" rules={[{ required: true, message: 'Informe o setor' }]}>
                  <Select placeholder="Selecione o setor" size="large" showSearch>
                    <Option value="FINANCEIRO">Financeiro / Tesouraria</Option>
                    <Option value="FATURAMENTO">Faturamento (TISS/Convênios)</Option>
                    <Option value="RH">Recursos Humanos (RH)</Option>
                    <Option value="COMPRAS">Compras e Suprimentos</Option>
                    <Option value="TI">Tecnologia da Informação (TI)</Option>
                    <Option value="SAME">Arquivo Médico (SAME)</Option>
                    <Option value="OUVIDORIA">Ouvidoria / SAC</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            {/* Mostra Campos de Registro apenas para profissões que exigem (Médicos, Enfermeiros, etc) */}
            {exigeConselho && (
              <>
                <Col xs={24} md={6}>
                  <Form.Item name="registroConselho" label={getConselhoLabel()} rules={[{ required: true, message: `Informe o ${getConselhoLabel()}` }]}>
                    <Input placeholder="Número" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={4}>
                  <Form.Item name="ufConselho" label="UF" rules={[{ required: true, message: 'UF' }]}>
                    <Input placeholder="Ex: SP" maxLength={2} size="large" style={{ textTransform: 'uppercase' }} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Card>

        <Card title={<><SafetyCertificateOutlined /> Acesso ao Sistema PEP</>} style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} style={{ marginBottom: 16 }}>
              <Form.Item name="criarAcessoSistema" valuePropName="checked" style={{ margin: 0 }}>
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                Criar um usuário para este colaborador acessar o sistema?
              </Typography.Text>
            </Col>

            {criarAcesso && (
              <>
                <Divider style={{ marginTop: 0 }} />
                <Col xs={24} md={12}>
                  <Form.Item name="loginEmail" label="E-mail de Acesso (Login)" rules={[{ required: true, type: 'email', message: 'Informe um email válido' }]}>
                    <Input placeholder="email@pep.com" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="perfilAcesso" label="Perfil de Permissão" rules={[{ required: true, message: 'Selecione o perfil' }]}>
                    <Select placeholder="O que ele pode acessar?" size="large">
                      <Option value="MEDICO">Médico (Prontuário, Prescrição)</Option>
                      <Option value="ENFERMEIRO">Enfermagem (Medicação, Triagem)</Option>
                      <Option value="RECEPCAO">Recepção e Atendimento</Option>
                      <Option value="FINANCEIRO">Faturamento / Financeiro</Option>
                      <Option value="ADMIN">Administrador (Acesso Total)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          <Button size="large" onClick={() => navigate('/professionals')}>Cancelar</Button>
          <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={loading}>
            Salvar Colaborador
          </Button>
        </div>
      </Form>
    </div>
  );
};