import { useEffect, useState, useCallback } from 'react';
import { Table, Button, message, Space, Typography, Tag, Card, Tabs, Modal, Form, Input, Select, Badge, Row, Col, Statistic, Tooltip } from 'antd';
import { PlusOutlined, ApartmentOutlined, LayoutOutlined, MedicineBoxOutlined, ToolOutlined, RestOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;
const { Option } = Select;

export const StructureListPage = () => {
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState<any[]>([]); // Alas
  const [beds, setBeds] = useState<any[]>([]);   // Leitos
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

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
      render: (tipo: string) => <Tag color="blue">{tipo || 'INTERNAÇÃO'}</Tag>
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
      title: 'Ações',
      key: 'actions',
      render: () => <Button size="small">Editar</Button>
    }
  ];

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
          LIMPEZA: { color: 'orange', label: 'Higienização', icon: <RestOutlined /> },
          MANUTENCAO: { color: 'volcano', label: 'Manutenção', icon: <ToolOutlined /> },
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
      title: 'Ações',
      key: 'actions',
      render: () => (
        <Space>
           <Tooltip title="Mudar Status (Limpeza/Manutenção)">
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

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Total de Alas" value={wards.length} prefix={<ApartmentOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Leitos Livres" value={beds.filter((b: any) => b.status === 'DISPONIVEL').length} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Em Higienização" value={beds.filter((b: any) => b.status === 'LIMPEZA').length} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Taxa de Ocupação" value="78%" suffix="%" />
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

      <Modal 
        title={activeTab === '1' ? "Cadastrar Nova Ala" : "Cadastrar Novo Leito"} 
        open={isModalVisible} 
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={() => { message.success('Salvo com sucesso'); setIsModalVisible(false); }}>
          <Form.Item label="Nome / Número" name="nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {activeTab === '2' && (
            <Form.Item label="Ala Pertencente" name="wardId" rules={[{ required: true }]}>
              <Select placeholder="Selecione a ala">
                {wards.map((w: any) => <Option key={w.id} value={w.id}>{w.nome}</Option>)}
              </Select>
            </Form.Item>
          )}
          <Button type="primary" block htmlType="submit">Salvar Estrutura</Button>
        </Form>
      </Modal>
    </div>
  );
};