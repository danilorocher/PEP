import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Card, Dropdown } from 'antd';
import { PlusOutlined, MoreOutlined, CheckCircleOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { financialService } from '../../services/financial.service';
import { TransactionFormModal } from '../../components/TransactionFormModal';

export const FinancialTransactionsList: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const response = await financialService.getTransactions({ page, limit: 10 });
      setData(response.data);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      message.error('Erro ao carregar as movimentações financeiras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await financialService.approveTransaction(id);
      message.success('Lançamento aprovado!');
      fetchTransactions();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao aprovar. Você tem permissão?');
    }
  };

  const handlePay = async (id: string) => {
    try {
      // Simplificado: Assumindo PIX e Data atual para registrar o pagamento rápido
      await financialService.payTransaction(id, { dataPagamento: new Date().toISOString(), formaPagamento: 'PIX' });
      message.success('Pagamento liquidado com sucesso!');
      fetchTransactions();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao registrar pagamento.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await financialService.cancelTransaction(id);
      message.success('Lançamento cancelado.');
      fetchTransactions();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao cancelar o lançamento.');
    }
  };

  const columns = [
    { 
      title: 'Competência', 
      dataIndex: 'dataCompetencia', 
      key: 'dataCompetencia',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY') 
    },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { 
      title: 'Tipo', 
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => (
        <Tag color={tipo === 'RECEITA' ? 'green' : 'red'}>{tipo}</Tag>
      )
    },
    { 
      title: 'Valor (R$)', 
      dataIndex: 'valor',
      key: 'valor',
      render: (v: number) => <strong>R$ {v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
    },
    { 
      title: 'Status', 
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = { PENDENTE: 'orange', APROVADO: 'blue', PAGO: 'green', CANCELADO: 'default' };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: any) => {
        const items = [];
        
        if (record.status === 'PENDENTE') {
          items.push({ key: '1', icon: <CheckCircleOutlined style={{ color: '#1890ff' }}/>, label: 'Aprovar', onClick: () => handleApprove(record.id) });
        }
        
        if (record.status === 'APROVADO') {
          items.push({ key: '2', icon: <DollarOutlined style={{ color: '#52c41a' }}/>, label: 'Liquidar / Pagar', onClick: () => handlePay(record.id) });
        }
        
        if (record.status !== 'PAGO' && record.status !== 'CANCELADO') {
          items.push({ key: '3', icon: <StopOutlined />, danger: true, label: 'Cancelar', onClick: () => handleCancel(record.id) });
        }

        return (
          <Dropdown menu={{ items }} disabled={items.length === 0} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      }
    }
  ];

  return (
    <Card 
      title="Lançamentos Financeiros" 
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Novo Lançamento</Button>}
    >
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        pagination={{ total, pageSize: 10, onChange: fetchTransactions }}
      />
      
      <TransactionFormModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onSuccess={() => {
          setIsModalVisible(false);
          fetchTransactions();
        }} 
      />
    </Card>
  );
};