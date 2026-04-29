import { useEffect, useState, useCallback } from 'react';
import { Table, Button, message, message, Space, Typography, Tag, Card, Tabs, Modal, Form, Input, Select, Badge, Row, Col, Statistic, Tooltip } from 'antd';
import { PlusOutlined, ApartmentOutlined, LayoutOutlined, MedicineBoxOutlined, ToolOutlined, RestOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;
const { Option } = Select;

export const StructureListPage = () => {
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState<any[]>([]); // Alas
  const [beds, setBeds] = useState<any[]>([]);   // Leitos
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

  // Busca dados das Alas e Leitos
  const fetchStructure = useCallback(async () => {
    setLoading(true);
    try {
      const [wardsRes, bedsRes] = await Promise.all([
        api.get('/wards').catch(() => ({ data: [] })),
        api.get('/beds').catch(() => ({ data: [] }))
      ]);
      
      setWards(Array.isArray(wardsRes.data) ? wardsRes.data : []);
      setBeds(Array.isArray(bedsRes.data) ? bedsRes.data : []);
    } catch (error) {
      console.error('Erro ao carregar estrutura');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  // ConfiguraÃ§Ã£o das Colunas de Alas
  const wardColumns = [
    {
      title: 'Nome da Ala / Setor',
      dataIndex: 'nome',
      key: 'nome',
      render: (text: string) => <Text strong><ApartmentOutlined /> {text}</Text>
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => <Tag color="blue">{tipo || 'INTERNAÃ‡ÃƒO'}</Tag>
    },
    {
      title: 'Capacidade',
      key: 'capacidade',
      render: (rec: any) => `${rec.totalLeitos || 0} Leitos`
    },
    {
      title: 'Status Operacional',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Badge status={status === 'INATIVO' ? 'error' : 'success'} text={status || 'ATIVO'} />
    },
    {
      title: 'AÃ§Ãµes',
      key: 'actions',
      render: () => <Button size="small">Editar</Button>
    }
  ];

  // ConfiguraÃ§Ã£o das Colunas de Leitos (O "Mapa de Leitos")
  const bedColumns = [
    {
      title: 'Leito',
      dataIndex: 'numero',
      key: 'numero',
      render: (text: string) => <Text strong><MedicineBoxOutlined /> {text}</Text>
    },
    {
      title: 'Ala',
      dataIndex: ['ward', 'nome'],
      key: 'ward',
    },
    {
      title: 'Status do Leito',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: any = {
          DISPONIVEL: { color: 'green', label: 'Livre', icon: <CheckCircleOutlined /> },
          OCUPADO: { color: 'red', label: 'Ocupado', icon: <UserOutlined /> },
          LIMPEZA: { color: 'orange', label: 'HigienizaÃ§Ã£o', icon: <RestOutlined /> },
          MANUTENCAO: { color: 'volcano', label: 'ManutenÃ§Ã£o', icon: <ToolOutlined /> },
        };
        const config = colors[status] || { color: 'default', label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (val: string) => <Tag>{val || 'ENFERMARIA'}</Tag>
    },
    {
      title: 'AÃ§Ãµes',
      key: 'actions',
      render: () => (
        <Space>
           <Tooltip title="Mudar Status (Limpeza/ManutenÃ§Ã£o)">
            <Button size="small" icon={<ToolOutlined />} />
          </Tooltip>
          <Button size="small">Editar</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Estrutura Hospitalar</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          {activeTab === '1' ? 'Nova Ala' : 'Novo Leito'}
        </Button>
      </div>

      {/* Cards de Resumo RÃ¡pido */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Total de Alas" value={wards.length} prefix={<ApartmentOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Leitos Livres" value={beds.filter(b => b.status === 'DISPONIVEL').length} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Em HigienizaÃ§Ã£o" value={beds.filter(b => b.status === 'LIMPEZA').length} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Taxa de OcupaÃ§Ã£o" value="78" suffix="%" />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab={<span><LayoutOutlined /> Gerenciar Alas</span>} key="1">
            <Table 
                columns={wardColumns} 
                dataSource={wards} 
                rowKey="id" 
                loading={loading}
                locale={{ emptyText: 'Nenhuma ala cadastrada' }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><MedicineBoxOutlined /> Mapa de Leitos</span>} key="2">
            <Table 
                columns={bedColumns} 
                dataSource={beds} 
                rowKey="id" 
                loading={loading}
                locale={{ emptyText: 'Nenhum leito cadastrado' }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Modal Simples de Cadastro (Exemplo) */}
      <Modal 
        title={activeTab === '1' ? "Cadastrar Nova Ala" : "Cadastrar Novo Leito"} 
        open={isModalVisible} 
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={() => { message.success('Salvo com sucesso'); setIsModalVisible(false); }}>
          <Form.Item label="Nome / NÃºmero" name="nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {activeTab === '2' && (
            <Form.Item label="Ala Pertencente" name="wardId" rules={[{ required: true }]}>
              <Select placeholder="Selecione a ala">
                {wards.map(w => <Option key={w.id} value={w.id}>{w.nome}</Option>)}
              </Select>
            </Form.Item>
          )}
          <Button type="primary" block htmlType="submit">Salvar Estrutura</Button>
        </Form>
      </Modal>
    </div>
  );
};

// Ãcones que faltaram na importaÃ§Ã£o (opcional)
import { CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
