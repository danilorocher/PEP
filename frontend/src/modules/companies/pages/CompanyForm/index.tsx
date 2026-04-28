import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Typography, message, Upload, Divider } from 'antd';
import { SaveOutlined, BankOutlined, MedicineBoxOutlined, GlobalOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;

export const CompanyFormPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Carrega os dados da unidade atual (No Multi-tenant, buscamos a empresa do usuário logado)
  useEffect(() => {
    const loadCompanyData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/my-company').catch(() => ({ data: {} }));
        form.setFieldsValue(response.data);
      } catch (error) {
        message.error('Erro ao carregar dados da unidade');
      } finally {
        setLoading(false);
      }
    };
    loadCompanyData();
  }, [form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await api.put('/my-company', values);
      message.success('Dados da Unidade atualizados com sucesso!');
    } catch (error) {
      message.error('Erro ao salvar dados. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2}>Configurações da Unidade</Title>
      <Text type="secondary">Gerencie as informações legais e a identidade visual da sua instituição.</Text>
      
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
        
        {/* SEÇÃO 1: IDENTIFICAÇÃO LEGAL */}
        <Card title={<><BankOutlined /> Identificação Legal</>} style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="nomeFantasia" label="Nome Fantasia (Como aparece no sistema)" rules={[{ required: true }]}>
                <Input placeholder="Ex: Hospital Albert Einstein" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="razaoSocial" label="Razão Social">
                <Input placeholder="Ex: Sociedade Beneficente Israelita Brasileira" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="cnpj" label="CNPJ" rules={[{ required: true }]}>
                <Input placeholder="00.000.000/0000-00" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="cnes" label="Registro CNES" rules={[{ required: true }]}>
                <Input placeholder="Número do CNES" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="inscricaoMunicipal" label="Inscrição Municipal">
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SEÇÃO 2: DIRETORIA TÉCNICA (Obrigatório por Lei) */}
        <Card title={<><MedicineBoxOutlined /> Responsabilidade Técnica</>} style={{ marginBottom: 24, borderLeft: '4px solid #1890ff' }}>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item name="diretorTecnico" label="Nome do Diretor Técnico Responsável" rules={[{ required: true }]}>
                <Input placeholder="Nome Completo do Médico" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="diretorCrm" label="CRM / Registro" rules={[{ required: true }]}>
                <Input placeholder="Ex: CRM-SP 123456" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            * Estas informações serão impressas no rodapé de todas as prescrições e laudos emitidos.
          </Text>
        </Card>

        {/* SEÇÃO 3: ENDEREÇO E CONTATO */}
        <Card title={<><GlobalOutlined /> Localização e Contato</>} style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={18}>
              <Form.Item name="logradouro" label="Endereço">
                <Input placeholder="Rua, Avenida..." size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="numero" label="Nº">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="telefone" label="Telefone de Atendimento">
                <Input placeholder="(00) 0000-0000" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="email" label="E-mail Institucional">
                <Input placeholder="contato@hospital.com.br" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="website" label="Website">
                <Input placeholder="www.hospital.com.br" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
          <Button type="primary" size="large" icon={<SaveOutlined />} htmlType="submit" loading={loading}>
            Salvar Configurações da Unidade
          </Button>
        </div>
      </Form>
    </div>
  );
};