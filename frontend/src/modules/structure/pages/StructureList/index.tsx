import { useEffect, useState, useCallback } from 'react';
import { Table, Button, message, Space, Typography, Tag, Card, Tabs, Badge, Row, Col, Statistic, Tooltip } from 'antd';
import { PlusOutlined, ApartmentOutlined, LayoutOutlined, MedicineBoxOutlined, ToolOutlined, RestOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';
// 🔥 MÁGICA 1: Importamos os Modais verdadeiros!
import { WardFormModal } from '../../components/WardFormModal';
import { BedFormModal } from '../../components/BedFormModal';

const { Title, Text } = Typography;

export const StructureListPage = () => {
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState<any[]>([]); 
  const [beds, setBeds] = useState<any[]>([]);   
  const [activeTab, setActiveTab] = useState('1');

  // Controle de estado dos Modais verdadeiros
  const [wardModal, setWardModal] = useState({ visible: false, data: null });
  const [bedModal, setBedModal] = useState({ visible: false, data: null });

  const fetchStructure = useCallback(async () => {
    setLoading(true);
    try {
      // Pedimos até 500 registros para garantir que o mapa fica completo sem paginação forçada na tela
      const [wardsRes, bedsRes] = await Promise.all([
        api.get('/wards', { params: { limit: 500 } }).catch(() => ({ data: { data: [] } })),
        api.get('/beds', { params: { limit: 500 } }).catch(() => ({ data: { data: [] } }))
      ]);
      
      // 🔥 MÁGICA 2: Lemos os dados corretamente, mesmo se vierem embrulhados na paginação!
      const wardsList = wardsRes.data?.data || wardsRes.data || [];
      const bedsList = bedsRes.data?.data || bedsRes.data || [];

      setWards(Array.isArray(wardsList) ? wardsList : []);
      setBeds(Array.isArray(bedsList) ? bedsList : []);
    } catch (error) {
      console.error('Erro ao carregar estrutura');
      message.error('Erro ao carregar dados da estrutura.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  // 🔥 MÁGICA 3: CÁLCULO DINÂMICO DE OCUPAÇÃO!
  const totalLeitos = beds.length;
  const leitosLivres = beds.filter((b: any) => ['LIVRE', 'DISPONIVEL'].includes(b.status)).length;
  const leitosLimpeza = beds.filter((b: any) => ['LIMPEZA', 'MANUTENCAO'].includes(b.status)).length;
  const leitosOcupados = beds.filter((b: any) => b.status === 'OCUPADO').length;
  
  // Calcula a taxa percentual de ocupação
  const taxaOcupacao = totalLeitos > 0 ? ((leitosOcupados / totalLeitos) * 100).toFixed(1) : '0.0';

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
      render: (rec: any) => `${rec.capacidade || 0} Leitos`
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
      render: (rec: any) => <Button size="small" onClick={() => setWardModal({ visible: true, data: rec })}>Editar</Button>
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
          LIVRE: { color: 'green', label: 'Livre', icon: <CheckCircleOutlined /> },
          DISPONIVEL: { color: 'green', label: 'Livre', icon: <CheckCircleOutlined /> },
          OCUPADO: { color: 'red', label: 'Ocupado', icon: <UserOutlined /> },
          LIMPEZA: { color: 'orange', label: 'Limpeza', icon: <RestOutlined /> },
          MANUTENCAO: { color: 'volcano', label: 'Manutenção', icon: <ToolOutlined /> },
        };
        const config = colors[status] || { color: 'default', label: status };
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
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
      render: (rec: any) => (
        <Space>
           <Tooltip title="Mudar Status (Limpeza/Manutenção)">
            <Button size="small" icon={<ToolOutlined />} onClick={() => setBedModal({ visible: true, data: rec })} />
          </Tooltip>
          <Button size="small" onClick={() => setBedModal({ visible: true, data: rec })}>Editar</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Estrutura Hospitalar</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          if (activeTab === '1') setWardModal({ visible: true, data: null });
          else setBedModal({ visible: true, data: null });
        }}>
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
            <Statistic title="Leitos Livres" value={leitosLivres} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Em Manutenção/Limpeza" value={leitosLimpeza} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            {/* Exibe o percentual calculado em tempo real! */}
            <Statistic title="Taxa de Ocupação" value={taxaOcupacao} suffix="%" valueStyle={{ color: Number(taxaOcupacao) > 80 ? '#cf1322' : '#1890ff' }} />
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
                pagination={{ pageSize: 15 }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span><MedicineBoxOutlined /> Mapa de Leitos</span>} key="2">
            <Table 
                columns={bedColumns} 
                dataSource={beds} 
                rowKey="id" 
                loading={loading}
                locale={{ emptyText: 'Nenhum leito cadastrado' }}
                pagination={{ pageSize: 15 }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* 🔥 MÁGICA 4: O esqueleto de teste foi trocado pelos modais reais! */}
      <WardFormModal 
        visible={wardModal.visible}
        initialValues={wardModal.data}
        onCancel={() => setWardModal({ visible: false, data: null })}
        onSuccess={() => { setWardModal({ visible: false, data: null }); fetchStructure(); }}
      />

      <BedFormModal 
        visible={bedModal.visible}
        initialValues={bedModal.data}
        wards={wards} // Passamos as alas para dentro do modal do leito!
        onCancel={() => setBedModal({ visible: false, data: null })}
        onSuccess={() => { setBedModal({ visible: false, data: null }); fetchStructure(); }}
      />
    </div>
  );
};