import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Switch, Space, message, Card, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { financialService } from '../../services/financial.service';
import { CostCenterFormModal } from '../../components/CostCenterFormModal';

export const CostCentersList: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Controle do Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const fetchCostCenters = async (page = 1) => {
    setLoading(true);
    setCurrentPage(page);
    try {
      const response = await financialService.getCostCenters({ page, limit: 10 });
      setData(response.data);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      message.error('Erro ao carregar centros de custo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const handleOpenModal = (record?: any) => {
    setEditingRecord(record || null);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Tem certeza que deseja excluir?',
      icon: <ExclamationCircleOutlined />,
      content: 'Este centro de custo será inativado do sistema.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await financialService.deleteCostCenter(id);
          message.success('Centro de custo excluído com sucesso.');
          fetchCostCenters(currentPage);
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Erro ao excluir.');
        }
      }
    });
  };

  const columns = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 100 },
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { 
      title: 'Tipo', 
      dataIndex: 'tipo', 
      key: 'tipo',
      render: (tipo: string) => {
        const colors: Record<string, string> = { CLINICO: 'blue', ADMINISTRATIVO: 'orange', APOIO: 'purple' };
        return <Tag color={colors[tipo]}>{tipo}</Tag>;
      }
    },
    { 
      title: 'Status', 
      dataIndex: 'ativo', 
      key: 'ativo',
      render: (ativo: boolean) => <Switch checked={ativo} disabled />
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          {/* 🔥 Botão de Editar ligado */}
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          {/* 🔥 Botão de Excluir ligado */}
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <Card 
      title="Centros de Custo" 
      extra={
        // 🔥 Botão "Novo Centro" ligado
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Novo Centro
        </Button>
      }
    >
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        pagination={{ total, current: currentPage, pageSize: 10, onChange: fetchCostCenters }}
      />

      {/* 🔥 Injeção do Modal na tela */}
      <CostCenterFormModal 
        visible={isModalVisible}
        initialData={editingRecord}
        onClose={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchCostCenters(currentPage);
        }}
      />
    </Card>
  );
};