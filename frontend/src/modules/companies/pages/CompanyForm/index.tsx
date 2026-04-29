import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Typography, message, Upload, Divider, Tabs, ColorPicker, DatePicker, Switch, Select } from 'antd';
import { 
  SaveOutlined, BankOutlined, MedicineBoxOutlined, GlobalOutlined, 
  PictureOutlined, SafetyCertificateOutlined, DollarOutlined, SettingOutlined, PlusOutlined 
} from '@ant-design/icons';
import api from '../../../../shared/services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const CompanyFormPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Simulação de carregamento de dados (No seu backend: GET /my-company)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/my-company').catch(() => ({ data: {} }));
        form.setFieldsValue({
          ...res.data,
          vencimentoAlvara: res.data.vencimentoAlvara ? dayjs(res.data.vencimentoAlvara) : null,
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Aqui o payload envia as regras de isolamento para o Backend
      await api.put('/my-company', values);
      message.success('Configurações da Unidade salvos com sucesso! As alterações refletirão em todo o ambiente isolado.');
    } catch (error) {
      message.error('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Configurações da Unidade</Title>
        <Text type="secondary">Esta unidade opera de forma <b>totalmente independente</b>. Dados, estoque e faturamento são isolados de outras unidades.</Text>
      </div>
      
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Tabs defaultActiveKey="1" type="card" className="company-tabs">
          
          {/* JURÍDICO E FISCAL */}
          <TabPane tab={<span><BankOutlined /> Jurídico & Fiscal</span>} key="1">
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={12}><Form.Item name="razaoSocial" label="Razão Social" rules={[{required: true}]}><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="nomeFantasia" label="Nome Fantasia" rules={[{required: true}]}><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={6}><Form.Item name="cnpj" label="CNPJ" rules={[{required: true}]}><Input placeholder="00.000.000/0000-00" size="large" /></Form.Item></Col>
                <Col xs={24} md={6}><Form.Item name="cnes" label="CNES" rules={[{required: true}]}><Input placeholder="Cadastro Nacional de Estabel. de Saúde" size="large" /></Form.Item></Col>
                <Col xs={24} md={6}><Form.Item name="inscricaoEstadual" label="Inscrição Estadual"><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={6}><Form.Item name="alvaraSanitario" label="Alvará Sanitário"><Input size="large" /></Form.Item></Col>
              </Row>
            </Card>
          </TabPane>

          {/* CORPO TÉCNICO RESPONSÁVEL */}
          <TabPane tab={<span><MedicineBoxOutlined /> Responsáveis Técnicos</span>} key="2">
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={12}><Form.Item name="rtMedico" label="Diretor Técnico Médico" rules={[{required: true}]}><Input placeholder="Nome completo" size="large" /></Form.Item></Col>
                <Col xs={24} md={4}><Form.Item name="rtMedicoCrm" label="CRM-UF" rules={[{required: true}]}><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={8}><Form.Item name="especialidadeRT" label="Especialidade do RT"><Input size="large" /></Form.Item></Col>
                
                <Divider />
                
                <Col xs={24} md={12}><Form.Item name="rtEnfermagem" label="Responsável Técnico Enfermagem"><Input placeholder="Nome completo" size="large" /></Form.Item></Col>
                <Col xs={24} md={4}><Form.Item name="rtEnfermagemCoren" label="COREN-UF"><Input size="large" /></Form.Item></Col>
              </Row>
            </Card>
          </TabPane>

          {/* CONFIGURAÇÕES DE ISOLAMENTO E ESTOQUE */}
          <TabPane tab={<span><SettingOutlined /> Regras de Negócio</span>} key="3">
            <Card bordered={false} title="Parâmetros de Independência Operacional">
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Card size="small" type="inner" title="Gestão de Estoque">
                    <Form.Item name="estoqueIndependente" label="Isolamento de Almoxarifado" valuePropName="checked" initialValue={true}>
                      <Switch checkedChildren="Independente" unCheckedChildren="Compartilhado" disabled /> 
                    </Form.Item>
                    <Text type="secondary">Esta unidade não visualiza nem consome itens de outras unidades da rede.</Text>
                    <Form.Item name="permiteEstoqueNegativo" label="Permitir Estoque Negativo?" style={{marginTop: 16}}>
                      <Switch />
                    </Form.Item>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" type="inner" title="Agendamento">
                    <Form.Item name="intervaloAgenda" label="Intervalo Padrão entre Consultas (min)">
                      <Select defaultValue="15">
                        <Select.Option value="10">10 min</Select.Option>
                        <Select.Option value="15">15 min</Select.Option>
                        <Select.Option value="30">30 min</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="bloquearAgendamentoConflito" label="Bloquear horários duplicados?">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Card>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* FATURAMENTO E CONVÊNIOS */}
          <TabPane tab={<span><DollarOutlined /> Faturamento TISS</span>} key="4">
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={8}><Form.Item name="registroAns" label="Registro na ANS"><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={8}><Form.Item name="versaoTiss" label="Versão TISS Vigente"><Input placeholder="Ex: 4.01.00" size="large" /></Form.Item></Col>
                <Col xs={24} md={8}><Form.Item name="codigoPrestador" label="Código Prestador (Principal)"><Input size="large" /></Form.Item></Col>
              </Row>
            </Card>
          </TabPane>

          {/* LOGO E CORES */}
          <TabPane tab={<span><PictureOutlined /> Identidade Visual</span>} key="5">
            <Card bordered={false}>
              <Row gutter={24} align="middle">
                <Col xs={24} md={6}>
                  <Form.Item label="Logotipo da Unidade">
                    <Upload listType="picture-card" maxCount={1}>
                      <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload Logo</div></div>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="primaryColor" label="Cor Principal da Unidade">
                    <ColorPicker showText />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Text type="secondary">O logotipo e a cor selecionada serão aplicados automaticamente em:</Text>
                  <ul>
                    <li>Cabeçalho de Prontuários</li>
                    <li>Receituários e Atestados</li>
                    <li>Guia de Encaminhamento</li>
                    <li>Relatórios de Faturamento</li>
                  </ul>
                </Col>
              </Row>
            </Card>
          </TabPane>

        </Tabs>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <Button type="primary" size="large" icon={<SaveOutlined />} htmlType="submit" loading={loading}>
            Salvar Configurações da Unidade
          </Button>
        </div>
      </Form>
    </div>
  );
};