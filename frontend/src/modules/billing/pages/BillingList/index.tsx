import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Dropdown, MenuProps } from 'antd';
import { EyeOutlined, EditOutlined, DownOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { BillingFilters } from '../../components/BillingFilters';
import { BillingItemsModal } from '../../components/BillingItemsModal';

const { Title, Text } = Typography;

export const BillingListPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [itemsModal, setItemsModal] = useState({ visible: false, guide: null });

  const fetchGuides = useCallback(async (page = 1, pageSize = 10, currentFilters = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/billing-guides', {
        params: {
          page,
          limit: pageSize,
          ...currentFilters,
        },
      });
      setData(response.data.data || []);
      setPagination({
        current: page,
        pageSize,
        total: response.data.total || 0,
      });
    } catch (error) {
      message.error('Erro ao carregar guias de faturamento');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const handleTableChange = (newPagination: any) => {
    fetchGuides(newPagination.current, newPagination.pageSize, filters);
  };

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    fetchGuides(1, pagination.pageSize, newFilters);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/billing-guides/${id}`, { status });
      message.success(`Status atualizado para ${status}`);
      fetchGuides(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RASCUNHO': return 'default';
      case 'ENVIADA': return 'processing';
      case 'AUTORIZADA': return 'success';
      case 'NEGADA': return 'error';
      case 'PAGA': return 'purple';
      case 'GLOSADA': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Data Emissão',
      dataIndex: 'dataEmissao',
      key: 'dataEmissao',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY'),
    },
    {
      title: 'Nº Guia',
      dataIndex: 'numeroGuia',
      key: 'numeroGuia',
      render: (val: string) => <Text strong>{val || 'N/A'}</Text>,
    },
    {
      title: 'Paciente / Convênio',
      key: 'patientInfo',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.patient?.nomeCompleto}</Text>
          <Text type="secondary" size="small">{record.insurance?.nome || 'Particular'}</Text>
        </Space>
      ),
    },
    {
      title: 'Valor Total',
      dataIndex: 'valorTotal',
      key: 'valorTotal',
      render: (val: number) => <Text style={{ color: '#1890ff' }}>R$ {val?.toFixed(2) || '0.00'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={getStatusColor(val)}>{val}</Tag>,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (record: any) => {
        const items: MenuProps['items'] = [
          { key: 'ENVIADA', label: 'Marcar como Enviada', icon: <CheckCircleOutlined /> },
          { key: 'AUTORIZADA', label: 'Autorizar', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
          { key: 'PAGA', label: 'Registrar Pagamento', icon: <DollarOutlined style={{ color: '#722ed1' }} /> },
          { key: 'GLOSADA', label: 'Registrar Glosa', icon: <CloseCircleOutlined style={{ color: '#faad14' }} /> },
          { key: 'NEGADA', label: 'Negar Guia', icon: <CloseCircleOutlined style={{ color: '#f5222d' }} /> },
        ];

        return (
          <Space>
            <Button 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => setItemsModal({ visible: true, guide: record })}
            >
              Ver Itens
            </Button>
            
            <Can module="faturamento" action="editar">
              <Dropdown menu={{ items, onClick: (e) => updateStatus(record.id, e.key) }}>
                <Button size="small">
                  Status <DownOutlined />
                </Button>
              </Dropdown>
            </Can>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Painel de Faturamento (TISS)</Title>
      </div>

      <BillingFilters onSearch={handleSearch} onClear={() => handleSearch({})} loading={loading} />

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      <BillingItemsModal 
        visible={itemsModal.visible}
        guide={itemsModal.guide}
        onCancel={() => setItemsModal({ visible: false, guide: null })}
      />
    </div>
  );
};