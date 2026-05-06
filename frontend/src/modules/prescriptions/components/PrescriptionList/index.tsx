import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Empty } from 'antd';
import { PlusOutlined, StopOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { PrescriptionFormModal } from '../PrescriptionFormModal';

interface PrescriptionListProps {
  recordId: string;
}

export const PrescriptionList = ({ recordId }: PrescriptionListProps) => {
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]); // 🔥 BUG 2 CORRIGIDO: Tipagem correta
  const [modalVisible, setModalVisible] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const response = await api.get(`/medical-records/${recordId}/prescriptions`);
      // 🔥 BUG 2 CORRIGIDO: Extrair o array do objeto paginado
      setPrescriptions(response.data?.data || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.warning('Você não tem permissão para visualizar as prescrições.');
      } else {
        message.error('Erro ao carregar prescrições');
      }
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleSuspend = async (prescriptionId: string) => {
    try {
      await api.patch(`/prescriptions/${prescriptionId}/suspend`, {
        observacao: 'Suspensa pelo prescritor'
      });
      message.success('Prescrição suspensa com sucesso');
      fetchPrescriptions();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao suspender prescrição');
    }
  };

  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'dataHora',
      key: 'dataHora',
      width: 140,
      render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Prescritor',
      key: 'prescritor',
      render: (rec: any) => rec.prescritor?.nomeCompleto || '—',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoPrescrito',
      key: 'tipo',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'MEDICO' ? 'blue' : 'cyan'}>
          {val === 'MEDICO' ? 'Médica' : 'Enfermagem'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val: string) => (
        <Tag color={val === 'ATIVA' ? 'green' : val === 'SUSPENSA' ? 'red' : 'default'}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (rec: any) => (
        <Space>
          <Button size="small" icon={<PrinterOutlined />}>PDF</Button>
          {rec.status === 'ATIVA' && (
            <Can module="prescricao" action="editar">
              <Popconfirm
                title="Suspender esta prescrição?"
                description="Todas as administrações pendentes serão canceladas."
                onConfirm={() => handleSuspend(rec.id)}
                okText="Suspender"
                cancelText="Cancelar"
              >
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
      {
        title: 'Medicamento',
        key: 'med',
        render: (rec: any) => <strong>{rec.medication?.nome || rec.medicationId}</strong>
      },
      { title: 'Dosagem', dataIndex: 'dosagem', key: 'dosagem' },
      { title: 'Via', dataIndex: 'viaAdministracao', key: 'via' },
      { title: 'Frequência', dataIndex: 'frequencia', key: 'freq' },
      { title: 'Início', dataIndex: 'dataInicio', key: 'inicio', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
      { title: 'Dias', dataIndex: 'duracaoDias', key: 'dias', render: (v: number) => v ? `${v}d` : '—' },
      {
        title: 'Horários',
        key: 'hours',
        render: (rec: any) => rec.horariosProgramados?.map((h: string) => (
          <Tag key={h} style={{ marginBottom: 2 }}>{h}</Tag>
        )) || '—'
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (val: string) => (
          <Tag color={val === 'ATIVO' ? 'blue' : val === 'CANCELADO' ? 'red' : 'default'}>
            {val}
          </Tag>
        )
      },
    ];

    return (
      <Table
        columns={itemColumns}
        dataSource={record.items || []}
        pagination={false}
        rowKey="id"
        size="small"
        locale={{ emptyText: 'Nenhum item nesta prescrição' }}
      />
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Can module="prescricao" action="criar">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
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
        locale={{ emptyText: <Empty description="Nenhuma prescrição registrada" /> }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />

      <PrescriptionFormModal
        visible={modalVisible}
        recordId={recordId}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          fetchPrescriptions();
        }}
      />
    </div>
  );
};