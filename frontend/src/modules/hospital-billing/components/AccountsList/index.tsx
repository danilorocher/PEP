import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Modal, Tooltip } from 'antd';
import { FileDoneOutlined, DollarOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons';
import { hospitalBillingService } from '../../services/hospital-billing.service';
import dayjs from 'dayjs';

const { Text } = Typography;

export const AccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hospitalBillingService.listAccounts();
      setAccounts(res.data?.data || res.data || []);
    } catch (err) {
      message.error('Erro ao carregar as contas hospitalares.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCloseAccount = (id: string) => {
    Modal.confirm({
      title: 'Fechar Conta Hospitalar',
      content: 'Tem a certeza que deseja fechar esta conta? Não será possível adicionar novos consumos (medicamentos, OPME, taxas) a uma conta fechada.',
      okText: 'Sim, Fechar Conta',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await hospitalBillingService.closeAccount(id);
          message.success('Conta fechada com sucesso! Pronta para faturação.');
          fetchAccounts();
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Erro ao fechar conta.');
        }
      }
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap: any = {
      OPEN: { color: 'blue', label: 'ABERTA (Em Consumo)' },
      CLOSED: { color: 'orange', label: 'FECHADA (Aguardando Faturação)' },
      BILLED: { color: 'purple', label: 'FATURADA (SUS/Convênio)' },
      DENIED: { color: 'red', label: 'GLOSADA' },
      PAID: { color: 'green', label: 'PAGA' }
    };
    const config = statusMap[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns = [
    {
      title: 'Abertura',
      dataIndex: 'openedAt',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Paciente',
      key: 'paciente',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.patient?.nomeCompleto}</Text>
          <Text type="secondary" style={{fontSize: 12}}>CPF: {rec.patient?.cpf}</Text>
        </Space>
      )
    },
    {
      title: 'Itens',
      key: 'itens',
      render: (rec: any) => <Tag>{rec._count?.items || 0} lançamentos</Tag>
    },
    {
      title: 'Valor Acumulado',
      dataIndex: 'totalAmount',
      render: (val: number) => <Text strong style={{ color: '#1890ff' }}>R$ {Number(val || 0).toFixed(2)}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (val: string) => getStatusTag(val)
    },
    {
      title: 'DRG',
      key: 'drg',
      render: (rec: any) => rec.drgGroup ? <Tooltip title={rec.drgGroup.description}><Tag color="geekblue">{rec.drgGroup.code}</Tag></Tooltip> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (rec: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => message.info('Visualização de Itens (Extrato) em desenvolvimento.')}>Extrato</Button>
          
          {rec.status === 'OPEN' && (
            <Button size="small" type="primary" danger icon={<FileDoneOutlined />} onClick={() => handleCloseAccount(rec.id)}>
              Fechar
            </Button>
          )}

          {rec.status === 'CLOSED' && (
            <Button size="small" style={{ backgroundColor: '#722ed1', color: '#fff' }} icon={<DollarOutlined />} onClick={() => message.info('Modal de Emissão AIH/BPA em desenvolvimento.')}>
              Faturar SUS
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card title="Gestão de Contas de Pacientes" extra={<Button icon={<SyncOutlined />} onClick={fetchAccounts}>Atualizar</Button>}>
      <Table 
        columns={columns} 
        dataSource={accounts} 
        rowKey="id" 
        loading={loading} 
        size="small"
      />
    </Card>
  );
};