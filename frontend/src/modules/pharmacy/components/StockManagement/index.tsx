import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Typography, Tag, Modal, Form, Input, Select, InputNumber, DatePicker, message, Row, Col } from 'antd';
import { PlusOutlined, ReloadOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const StockManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [medications, setMedications] = useState([]);
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [newMedModalVisible, setNewMedModalVisible] = useState(false);
  const [formEntry] = Form.useForm();
  const [formMed] = Form.useForm();

  useEffect(() => {
    fetchStock();
    fetchMedications();
  }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pharmacy/stock');
      setStockData(response.data || []);
    } catch (error) {
      message.error('Erro ao carregar estoque. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const response = await api.get('/pharmacy/medications/catalog');
      setMedications(response.data || []);
    } catch (error) {
      message.error('Erro ao carregar catálogo de medicamentos.');
    }
  };

  const handleCreateMedication = async (values: any) => {
    try {
      await api.post('/pharmacy/medications/catalog', values);
      message.success('Medicamento cadastrado no catálogo com sucesso!');
      setNewMedModalVisible(false);
      formMed.resetFields();
      fetchMedications(); 
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao cadastrar medicamento.');
    }
  };

  const handleStockEntry = async (values: any) => {
    try {
      const payload = {
        medicationId: values.medicationId,
        lote: values.lote,
        quantidade: Number(values.quantidade),
        dataFabricacao: values.dataFabricacao ? dayjs(values.dataFabricacao).toISOString() : undefined,
        validade: dayjs(values.validade).toISOString(),
        localizacao: values.localizacao || 'Almoxarifado Central'
      };
      
      await api.post('/pharmacy/stock', payload);
      message.success('Entrada de estoque realizada!');
      setEntryModalVisible(false);
      formEntry.resetFields();
      fetchStock();
    } catch (error: any) {
      console.error('Erro de API:', error.response?.data);
      message.error(error.response?.data?.message || 'Erro ao realizar entrada de estoque.');
    }
  };

  const columns = [
    {
      title: 'Medicamento',
      key: 'medication',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.medication?.nome}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{rec.medication?.principioAtivo} - {rec.medication?.formaFarmaceutica}</Text>
        </Space>
      )
    },
    { title: 'Lote', dataIndex: 'lote', key: 'lote' },
    { 
      title: 'Validade', 
      dataIndex: 'validade', 
      key: 'validade',
      render: (date: string) => {
        const isExpired = dayjs().isAfter(dayjs(date));
        return <Tag color={isExpired ? 'red' : 'green'}>{dayjs(date).format('DD/MM/YYYY')}</Tag>;
      }
    },
    { title: 'Quantidade', dataIndex: 'quantidade', key: 'quantidade', render: (val: number) => <Text strong>{val}</Text> },
    { title: 'Localização', dataIndex: 'localizacao', key: 'localizacao' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, marginTop: 16 }}>
        <Title level={4}><MedicineBoxOutlined /> Gerenciamento de Estoque</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchStock}>Atualizar</Button>
          
          <Button onClick={() => setNewMedModalVisible(true)}>
            + Cadastrar Novo Medicamento
          </Button>

          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEntryModalVisible(true)}>
            Nova Entrada de Estoque
          </Button>
        </Space>
      </div>

      <Table dataSource={stockData} columns={columns} rowKey="id" loading={loading} />

      {/* --- MODAL DE CADASTRO DE MEDICAMENTO (CATÁLOGO) --- */}
      <Modal
        title="Cadastrar Medicamento no Catálogo do Hospital"
        open={newMedModalVisible}
        onCancel={() => setNewMedModalVisible(false)}
        onOk={() => formMed.submit()}
        width={700}
      >
        <Form form={formMed} layout="vertical" onFinish={handleCreateMedication}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="nome" label="Nome do Medicamento (Ex: Dipirona 500mg)" rules={[{required: true}]}>
                <Input placeholder="Nome comercial ou genérico" />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item name="principioAtivo" label="Princípio Ativo">
                <Input placeholder="Ex: Dipirona Monoidratada" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="formaFarmaceutica" label="Forma Farmacêutica" rules={[{required: true}]}>
                <Select options={[
                  { value: 'COMPRIMIDO', label: 'Comprimido' }, { value: 'CAPSULA', label: 'Cápsula' },
                  { value: 'INJETAVEL', label: 'Injetável' }, { value: 'SOLUCAO', label: 'Solução' },
                  { value: 'XAROPE', label: 'Xarope' }, { value: 'CREME', label: 'Creme' },
                  { value: 'SUPOSITORIO', label: 'Supositório' }, { value: 'OUTRO', label: 'Outro' }
                ]} />
              </Form.Item>
            </Col>

            {/* 🔥 NOVO: Campo adicionado para cumprir a regra obrigatória do Prisma */}
            <Col span={12}>
              <Form.Item name="viaAdministracaoPadrao" label="Via de Administração Padrão" rules={[{required: true}]}>
                <Select options={[
                  { value: 'ORAL', label: 'Oral' },
                  { value: 'INTRAVENOSA', label: 'Intravenosa (IV)' },
                  { value: 'INTRAMUSCULAR', label: 'Intramuscular (IM)' },
                  { value: 'SUBCUTANEA', label: 'Subcutânea (SC)' },
                  { value: 'TOPICA', label: 'Tópica' },
                  { value: 'INALATORIA', label: 'Inalatória' },
                  { value: 'OUTRO', label: 'Outro' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* --- MODAL DE ENTRADA DE ESTOQUE (LOTE/VALIDADE) --- */}
      <Modal
        title="Nova Entrada de Estoque (Lote/Validade)"
        open={entryModalVisible}
        onCancel={() => setEntryModalVisible(false)}
        onOk={() => formEntry.submit()}
        width={700}
      >
        <Form form={formEntry} layout="vertical" onFinish={handleStockEntry}>
          <Form.Item name="medicationId" label="Medicamento (Selecione do Catálogo)" rules={[{required: true}]}>
            <Select showSearch optionFilterProp="children">
              {medications.map((m: any) => <Select.Option key={m.id} value={m.id}>{m.nome} ({m.formaFarmaceutica})</Select.Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="lote" label="Número do Lote" rules={[{required: true}]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="quantidade" label="Quantidade de Entrada" rules={[{required: true}]}><InputNumber style={{width: '100%'}} min={1} /></Form.Item></Col>
            <Col span={12}><Form.Item name="dataFabricacao" label="Data de Fabricação"><DatePicker style={{width: '100%'}} format="DD/MM/YYYY" /></Form.Item></Col>
            <Col span={12}><Form.Item name="validade" label="Data de Validade" rules={[{required: true}]}><DatePicker style={{width: '100%'}} format="DD/MM/YYYY" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};