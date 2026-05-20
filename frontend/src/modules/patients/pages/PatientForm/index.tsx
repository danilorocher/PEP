import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Space, Typography, message, DatePicker } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UserOutlined, EnvironmentOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
// 🔥 AQUI ESTAVA O ERRO! Faltava importar a nossa 'api' para enviar os dados
import { api } from '../../../../shared/services/api';

const { Text, Title } = Typography;

export const PatientFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // Cenário de Edição
      form.setFieldsValue({
        nome: 'Danilo Tavares',
        cpf: '123.456.789-00',
        dataNascimento: dayjs('1990-05-18'),
        genero: 'MASCULINO',
        telefone: '(11) 99999-9999',
        email: 'danilo@email.com',
        cep: '01001-000',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        convenio: 'AMIL_MEDICIAL',
        numeroCarteirinha: '9876543210002',
      });
    }
  }, [id, form]);

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
      if (values.numeroCarteirinha) payload.numeroCarteirinha = values.numeroCarteirinha;
      if (values.validadeCarteirinha) payload.dataValidadeCarteirinha = values.validadeCarteirinha.toISOString();

      if (values.logradouro && values.numero && values.bairro && values.cidade && values.estado && values.cep) {
        payload.enderecoCompleto = {
          logradouro: values.logradouro,
          numero: values.numero,
          bairro: values.bairro,
          cidade: values.cidade,
          uf: values.estado.toUpperCase(),
          cep: values.cep
        };
      }
      
      console.log('📦 PAYLOAD DEFENSIVO ENVIADO:', payload);

      if (id) {
        await api.patch(`/patients/${id}`, payload);
        message.success('Prontuário do paciente atualizado com sucesso!');
      } else {
        await api.post('/patients', payload);
        message.success('Paciente admitido e cadastrado com sucesso!');
      }
      
      navigate('/patients');
    } catch (error: any) {
      console.error('🚨 ERRO COMPLETO DA API:', error);
      console.error('🚨 RESPOSTA DO SERVIDOR:', error.response?.data);
      
      const errorMessage = error.response?.data?.message;
      message.error(
        Array.isArray(errorMessage) 
          ? errorMessage.join(' | ') 
          : errorMessage || 'Erro ao salvar no banco de dados. Verifique os dados.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderSectionTitle = (title: string, icon: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '4px solid #0F766E', paddingLeft: '12px', marginBottom: '20px', marginTop: '8px' }}>
      <span style={{ color: '#0F766E', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <Text strong style={{ color: '#1E293B', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</Text>
    </div>
  );

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
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

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card bordered={false} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.02)' }}>
          {renderSectionTitle('Dados Identificadores', <UserOutlined style={{ fontSize: '16px' }} />)}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="nome" label="Nome Completo do Paciente" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Input placeholder="Iniciais em maiúsculo..." />
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

        <Card bordered={false} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.02)' }}>
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

        <Card bordered={false} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.02)' }}>
          {renderSectionTitle('Plano de Saúde / Cobertura', <SafetyCertificateOutlined style={{ fontSize: '16px' }} />)}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name="convenio" label="Convênio Ativo" rules={[{ required: true, message: 'Campo obrigatório' }]}>
                <Select placeholder="Selecione o plano..." options={[
                  { value: 'PARTICULAR', label: 'Atendimento Particular (Sem Convênio)' },
                  { value: 'SUS', label: 'Sistema Único de Saúde (SUS)' },
                  { value: 'AMIL_MEDICIAL', label: 'Amil Assistência Médica' },
                  { value: 'UNIMED_BR', label: 'Central Nacional Unimed' },
                  { value: 'SULAMERICA_SAUDE', label: 'SulAmérica Saúde' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item name="numeroCarteirinha" label="Número da Carteirinha / Código do Beneficiário">
                <Input className="tabular-nums" placeholder="Digite apenas os números..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="validadeCarteirinha" label="Validade da Guia/Carteirinha">
                <DatePicker style={{ width: '100%' }} format="MM/YYYY" picker="month" placeholder="Selecione..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Space>
    </Form>
  );
};