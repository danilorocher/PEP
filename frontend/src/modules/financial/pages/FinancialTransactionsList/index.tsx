import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Dropdown, Typography } from 'antd';
import { PlusOutlined, MoreOutlined, CheckCircleOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { financialService } from '../../services/financial.service';
import { TransactionFormModal } from '../../components/TransactionFormModal';
import { StatusTag } from '../../../../shared/components/StatusTag'; // Nosso novo Badge Premium!

const { Text } = Typography;

export const FinancialTransactionsList: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    setCurrentPage(page);
    try {
      const response = await financialService.getTransactions({ page, limit: 15 }); // Alta densidade: 15 itens por página
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

  const handleAction = async (actionFn: Promise<any>, successMsg: string) => {
    try {
      await actionFn;
      message.success(successMsg);
      fetchTransactions(currentPage);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Ação não permitida pelas regras de negócio.');
    }
  };

  const columns = [
    { 
      title: 'COMPETÊNCIA', 
      dataIndex: 'dataCompetencia', 
      key: 'dataCompetencia',
      width: 120,
      render: (v: string) => <Text style={{ color: '#475569', fontSize: '13px' }}>{dayjs(v).format('DD/MM/YYYY')}</Text>
    },
    { 
      title: 'DESCRIÇÃO DO LANÇAMENTO', 
      dataIndex: 'descricao', 
      key: 'descricao',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ color: '#1E293B', fontSize: '13px' }}>{text}</Text>
          <Text style={{ color: '#94A3B8', fontSize: '11px' }}>{record.natureza}</Text>
        </div>
      )
    },
    { 
      title: 'TIPO', 
      dataIndex: 'tipo',
      key: 'tipo',
      width: 100,
      render: (tipo: string) => (
        <Text strong style={{ color: tipo === 'RECEITA' ? '#059669' : '#DC2626', fontSize: '12px' }}>
          {tipo === 'RECEITA' ? 'ENTRADA' : 'SAÍDA'}
        </Text>
      )
    },
    { 
      title: 'VALOR (R$)', 
      dataIndex: 'valor',
      key: 'valor',
      align: 'right' as const, // Regra de Ouro: Dinheiro alinha-se sempre à direita!
      width: 140,
      render: (v: number) => (
        <span className="tabular-nums" style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>
          {v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    { 
      title: 'STATUS', 
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (status: string) => <StatusTag status={status} />
    },
    {
      title: '',
      key: 'acoes',
      width: 50,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const items = [];
        if (record.status === 'PENDENTE') items.push({ key: '1', icon: <CheckCircleOutlined style={{ color: '#0284C7' }}/>, label: 'Aprovar', onClick: () => handleAction(financialService.approveTransaction(record.id), 'Aprovado!') });
        if (record.status === 'APROVADO') items.push({ key: '2', icon: <DollarOutlined style={{ color: '#059669' }}/>, label: 'Liquidar / Pagar', onClick: () => handleAction(financialService.payTransaction(record.id, { dataPagamento: new Date().toISOString(), formaPagamento: 'PIX' }), 'Liquidado!') });
        if (!['PAGO', 'CANCELADO'].includes(record.status)) items.push({ key: '3', icon: <StopOutlined />, danger: true, label: 'Cancelar', onClick: () => handleAction(financialService.cancelTransaction(record.id), 'Cancelado!') });

        return (
          <Dropdown menu={{ items }} disabled={items.length === 0} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined style={{ color: '#94A3B8', fontSize: '16px' }} />} />
          </Dropdown>
        );
      }
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Text style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>Lançamentos Financeiros</Text>
          <br />
          <Text style={{ color: '#64748B', fontSize: '13px' }}>Gestão de contas a pagar, receber e tesouraria.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ background: '#0F766E', borderColor: '#0F766E' }}>
          Novo Lançamento
        </Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          size="middle" // 🔥 ALTA DENSIDADE: Reduz o padding das linhas drásticamente
          pagination={{ 
            total, 
            current: currentPage, 
            pageSize: 15, 
            onChange: fetchTransactions,
            style: { padding: '16px 24px', margin: 0, borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }
          }}
        />
      </Card>
      
      <TransactionFormModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} onSuccess={() => { setIsModalVisible(false); fetchTransactions(currentPage); }} />
    </>
  );
};