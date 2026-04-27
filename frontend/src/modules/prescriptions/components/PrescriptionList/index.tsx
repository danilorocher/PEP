import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, StopOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { PrescriptionFormModal } from '../PrescriptionFormModal';

const { Text } = Typography;

interface PrescriptionListProps {
  recordId: string;
}

export const PrescriptionList = ({ recordId }: PrescriptionListProps) => {
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/medical-records/${recordId}/prescriptions`);
      setPrescriptions(response.data);
    } catch (error) {
      message.error('Erro ao carregar prescrições');
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    if (recordId) {
      fetchPrescriptions();
    }
  }, [recordId, fetchPrescriptions]);

  const handleSuspend = async (prescriptionId: string) => {
    try {
      await api.patch(`/prescriptions/${prescriptionId}/suspend`);
      message.success('Prescrição suspensa');
      fetchPrescriptions();
    } catch (error) {
      message.error('Erro ao suspender prescrição');
    }
  };

  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'dataHora',
      key: 'dataHora',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Prescritor',
      key: 'prescritor',
      render: (rec: any) => rec.prescritor?.nomeCompleto,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => (
        <Tag color={val === 'ATIVA' ? 'green' : val === 'SUSPENSA' ? 'red' : 'default'}>{val}</Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (rec: any) => (
        <Space>
          <Button size="small" icon={<PrinterOutlined />}>Imprimir</Button>
          {rec.status === 'ATIVA' && (
            <Can module="prescricao" action="editar">
              <Popconfirm title="Suspender esta prescrição?" onConfirm={() => handleSuspend(rec.id)}>
                <Button size="small" danger icon={<StopOutlined />}>Suspender</Button>
              </Popconfirm>
            </Can>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: any) => {
    const itemColumns = [
      { title: 'Medicamento', key: 'med', render: (rec: any) => <Text strong>{rec.medication?.nome}</Text> },
      { title: 'Dosagem', dataIndex: 'dosagem', key: 'dosagem' },
      { title: 'Via', dataIndex: 'viaAdministracao', key: 'via' },
      { title: 'Frequência', dataIndex: 'frequencia', key: 'freq' },
      { title: 'Horários', key: 'hours', render: (rec: any) => rec.horariosProgramados?.map((h: string) => <Tag key={h}>{h}</Tag>) },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (val: string) => <Tag color={val === 'ATIVO' ? 'blue' : 'default'}>{val}</Tag> },
    ];
    return <Table columns={itemColumns} dataSource={record.items} pagination={false} rowKey="id" size="small" />;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Can module="prescricao" action="criar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Nova Prescrição
          </Button>
        </Can>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={prescriptions}
        rowKey="id"
        expandable={{ expandedRowRender }}
      />

      <PrescriptionFormModal
        visible={modalVisible}
        recordId={recordId}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => { setModalVisible(false); fetchPrescriptions(); }}
      />
    </div>
  );
};