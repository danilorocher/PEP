import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Typography, message, Tag } from 'antd';
import { ExperimentOutlined, FileSearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { labService } from '../../services/lab.service';
import { SampleCollectionModal } from '../../components/SampleCollectionModal';
import { ResultEntryModal } from '../../components/ResultEntryModal';
import { SignReportModal } from '../../components/SignReportModal';
import dayjs from 'dayjs';

const { Title } = Typography;

export const LabDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modals, setModals] = useState({ collection: false, result: false, sign: false, order: null as any });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await labService.getOrders();
      setOrders(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Erro LIS:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const columns = [
    {
      title: 'Data',
      dataIndex: 'requestedAt',
      render: (val: string) => val ? dayjs(val).format('DD/MM/YY HH:mm') : '-',
    },
    {
      title: 'Paciente',
      dataIndex: ['patient', 'nomeCompleto'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => {
        const colors: any = { REQUESTED: 'blue', COLLECTED: 'orange', PROCESSING: 'purple', COMPLETED: 'green' };
        return <Tag color={colors[status] || 'default'}>{status || 'PENDENTE'}</Tag>;
      },
    },
    {
      title: 'Ações',
      render: (record: any) => (
        <Space>
          {record.status === 'REQUESTED' && <Button size="small" onClick={() => setModals({ ...modals, collection: true, order: record })}>Coletar</Button>}
          {record.status === 'COLLECTED' && <Button size="small" type="primary" onClick={() => setModals({ ...modals, result: true, order: record })}>Resultados</Button>}
          {record.status === 'PROCESSING' && <Button size="small" danger onClick={() => setModals({ ...modals, sign: true, order: record })}>Laudar</Button>}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}><ExperimentOutlined /> Laboratório (LIS)</Title>
      <Card><Table dataSource={orders} columns={columns} rowKey="id" loading={loading} /></Card>

      <SampleCollectionModal visible={modals.collection} order={modals.order} onCancel={() => setModals({ ...modals, collection: false, order: null })} onSuccess={fetchOrders} />
      <ResultEntryModal visible={modals.result} order={modals.order} onCancel={() => setModals({ ...modals, result: false, order: null })} onSuccess={fetchOrders} />
      <SignReportModal visible={modals.sign} order={modals.order} onCancel={() => setModals({ ...modals, sign: false, order: null })} onSuccess={fetchOrders} />
    </div>
  );
};