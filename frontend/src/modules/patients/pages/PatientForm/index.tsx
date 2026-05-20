import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Space, Typography, message, DatePicker, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UserOutlined, EnvironmentOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../../../../shared/services/api';

const { Text, Title } = Typography;

export const PatientFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  
  // Lista de convênios vindos da tabela real do banco
  const [insurances, setInsurances] = useState<any[]>([]);

  // 1. Carrega os convênios disponíveis no sistema
  useEffect(() => {
    const loadInsurances = async () => {
      try {
        const response = await api.get('/insurances');
        setInsurances(response.data);
      } catch (error) {
        console.error('Erro ao buscar convênios:', error);
        message.error('Não foi possível carregar a lista de convênios atualizada.');
      }
    };
    loadInsurances();
  }, []);

  // 2. 🔥 BUSCA REAL NO BANCO DE DADOS: Se houver ID na URL, busca o paciente legítimo da API
  useEffect(() => {
    const loadPatientData = async () => {
      if (!id) return;
      
      setPageLoading(true);
      try {
        const response = await api.get(`/patients/${id}`);
        const patient = response.data;

        // Desestrutura o objeto de endereço salvo no formato JSON do Postgres
        const endereco = patient.enderecoCompleto || {};

        // Alimenta o formulário dinamicamente com os dados reais gravados no banco
        form.setFieldsValue({
          nome: patient.nomeCompleto,
          cpf: patient.cpf,
          dataNascimento: patient.dataNascimento ? dayjs(patient.dataNascimento) : undefined,
          genero: patient.sexo === 'OUTRO' ? 'NÃO_INFORMADO' : patient.sexo,
          telefone: patient.telefone,
          email: patient.email,
          
          // Dados de Endereço Dinâmicos
          cep: endereco.cep,
          logradouro: endereco.logradouro,
          numero: endereco.numero,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.uf,
          
          // Dados do Convênio Dinâmicos
          convenioId: patient.convenioId || undefined,
          numeroCarteirinha: patient.numeroCarteirinha,
          validadeCarteirinha: patient.dataValidadeCarteirinha ? dayjs(patient.dataValidadeCarteirinha) : undefined,
        });
      } catch (error) {
        console.error('Erro ao buscar paciente do banco:', error);
        message.error('Erro ao carregar os dados reais do paciente do servidor.');
      } finally {
        setPageLoading(false);
      }
    };

    loadPatientData();
  }, [id, form]);

  // 3. ENVIO / SALVAMENTO REAL NO BANCO
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: any = {
        nomeCompleto: values.nome,
        cpf: values.cpf ? values.cpf.replace(/\D/g, '') : '', 
        dataNascimento: values.dataNascimento ? values.dataNascimento.toISOString() : undefined,
        sexo: values.genero === 'NÃO_INFORMADO' ? 'OUTRO' : values.genero,
      };

      if (values.telefone) payload.telefone = values.telefone;
      if (values.email) payload.email = values.email;
      if (values.numeroCarteirinha) payload.numeroCarteirinha = values.numeroCarteirinha;
      if (values.validadeCarteirinha) payload.dataValidadeCarteirinha = values.validadeCarteirinha.toISOString();

      // Estrutura o JSON de endereço conforme especificado no schema.prisma
      if (values.logradouro || values.numero || values.bairro || values.cidade || values.estado || values.cep) {
        payload.enderecoCompleto = {
          logradouro: values.logradouro || '',
          numero: values.numero || '',
          bairro: values.bairro || '',
          cidade: values.cidade || '',
          uf: values.estado ? values.estado.toUpperCase() : '',
          cep: values.cep || ''
        };
      }
      
      // Vincula o UUID do convênio criado na base
      payload.convenioId = values.convenioId || null;

      if (id) {
        await api.patch(`/patients/${id}`, payload);
        message.success('Prontuário atualizado com sucesso no banco de dados!');
      } else {
        await api.post('/patients', payload);
        message.success('Paciente admitido e salvo com sucesso no banco de dados!');
      }
      
      navigate('/patients');
    } catch (error: any) {
      console.error('Erro ao salvar no banco:', error);
      const errorMessage = error.response?.data?.message;
      message.error(
        Array.isArray(errorMessage) 
          ? errorMessage.join(' | ') 
          : errorMessage || 'Erro ao processar gravação no banco de dados.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderSectionTitle = (title: string, icon: React.ReactNode) => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      borderLeft: '4px solid #0F766E', 
      paddingLeft: '12px',
      marginBottom: '20px',
      marginTop: '8px'
    }}>
      <span style={{ color: '#0F766E', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <Text strong style={{ color: '#1E293B', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </Text>
    </div>
  );

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Spin size="large" />
        <Text type="secondary">Consultando prontuário eletrônico no PostgreSQL...</Text>
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
      {/* BARRA SUPERIOR DE OPERAÇÃO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontWeight: 700 }}>
            {id ? 'Editar Registro de Paciente' : 'Admissão de Novo Paciente'}
          </Title>
          <Text style={{ color: '#64748B', fontSize: '13px' }}>
            Preencha os campos obrigatórios para gerar ou atualizar o número de Prontuário Geral (PEP).
          </Text>
        </div>
        <Space size={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} style={{ color: '#475569' }}>
            Voltar
          </Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} style={{ background: '#0F766E', borderColor: '#0F766E' }}>
            {id ? 'Atualizar Prontuário' : 'Efetivar Admissão'}
          </Button>
        </Space>
      </div>

      {/* ÁREA CENTRAL DO WORKSPACE */}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        
        {/* SEÇÃO 1: IDENTIFICAÇÃO DO PACIENTE */}
        <Card bordered={false} style={{ border: '1px solid #E2E8F0', borderRadius: '6px' }}>
          {renderSectionTitle('Dados Identificadores', <UserOutlined style={{ fontSize: '16px' }} />)}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="nome" label="Nome Completo do Paciente" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="Digite o nome completo..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="cpf" label="CPF" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="000.000.000-00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="dataNascimento" label="Data de Nascimento" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Selecione..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="genero" label="Gênero Biológico" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Select placeholder="Selecione..." options={[
                  { value: 'MASCULINO', label: 'Masculino' },
                  { value: 'FEMININO', label: 'Feminino' },
                  { value: 'NÃO_INFORMADO', label: 'Não Informado / Outro' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="telefone" label="Telefone de Contato" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Endereço de E-mail (Opcional)">
                <Input type="email" placeholder="exemplo@hospital.com" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SEÇÃO 2: LOCALIZAÇÃO E ENDEREÇO */}
        <Card bordered={false} style={{ border: '1px solid #E2E8F0', borderRadius: '6px' }}>
          {renderSectionTitle('Endereço Residencial', <EnvironmentOutlined style={{ fontSize: '16px' }} />)}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={4}>
              <Form.Item name="cep" label="CEP">
                <Input placeholder="00000-000" />
              </Form.Item>
            </Col>
            <Col xs={24} md={14}>
              <Form.Item name="logradouro" label="Logradouro (Rua/Avenida)" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="Ex: Rua das Flores" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="numero" label="Número" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="Ex: 123" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="bairro" label="Bairro" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="Ex: Centro" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="cidade" label="Cidade" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="Ex: São Paulo" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="estado" label="UF" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input maxLength={2} placeholder="Ex: SP" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SEÇÃO 3: COBERTURA SAÚDE / CONVÊNIO */}
        <Card bordered={false} style={{ border: '1px solid #E2E8F0', borderRadius: '6px' }}>
          {renderSectionTitle('Plano de Saúde / Cobertura', <SafetyCertificateOutlined style={{ fontSize: '16px' }} />)}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name="convenioId" label="Convênio Ativo" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Select placeholder="Selecione o plano..." allowClear>
                  {insurances.map((ins: any) => (
                    <Select.Option key={ins.id} value={ins.id}>
                      {ins.nome} ({ins.tipo.replace('_', ' ')})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item name="numeroCarteirinha" label="Número da Carteirinha">
                <Input placeholder="Digite o número do cartão..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="validadeCarteirinha" label="Validade da Carteirinha">
                <DatePicker style={{ width: '100%' }} format="MM/YYYY" picker="month" placeholder="Selecione..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

      </Space>
    </Form>
  );
};