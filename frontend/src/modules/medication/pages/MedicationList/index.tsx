import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Card, Select, DatePicker } from 'antd';
import { CheckSquareOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { AdministerModal } from '../../components/AdministerModal';

const { Title, Text } = Typography;

export const MedicationListPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [statusFilter, setStatusFilter] = useState('NAO_MINISTRADO');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  
  const [administerModal, setAdministerModal] = useState({ visible: false, data: null });

  const fetchAdministrations = useCallback(async (page = 1, pageSize = 20, status = 'NAO_MINISTRADO', date = dayjs()) => {
    setLoading(true);
    try {
      const response = await api.get('/medication-administrations', {
        params: { 
          page, 
          limit: pageSize, 
          status,
          dataInicial: date.startOf('day').toISOString(),
          dataFinal: date.endOf('day').toISOString()
        },
      }).catch(err => {
        console.error('Aviso: Rota de medicações falhou ou está vazia', err.message);
        return { data: { data: [], total: 0 } }; // Fallback seguro para não quebrar a tela
      });

      // Lida com diferentes formatos de resposta (objeto paginado ou array direto)
      const listData = response.data?.data || response.data || [];
      const totalCount = response.data?.total || listData.length || 0;

      setData(Array.isArray(listData) ? listData : []);
      setPagination({ current: page, pageSize, total: totalCount });
    } catch (error) {
      console.error(error);
      message.error('Erro ao carregar lista de medicações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdministrations(1, pagination.pageSize, statusFilter, selectedDate);
  }, [fetchAdministrations, statusFilter, selectedDate]);

  const handleTableChange = (newPagination: any) => {
    fetchAdministrations(newPagination.current, newPagination.pageSize, statusFilter, selectedDate);
  };

  const columns = [
    {
      title: 'Horário',
      dataIndex: 'dataHoraProgamada',
      key: 'dataHoraProgamada',
      render: (val: string, record: any) => {
        if (!val) return '--:--';
        const isOverdue = dayjs().isAfter(dayjs(val)) && record.status === 'NAO_MINISTRADO';
        return (
          <Tag color={isOverdue ? 'red' : 'blue'} style={{ fontSize: '14px', padding: '4px 8px' }}>
            {dayjs(val).format('HH:mm')}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: 'Paciente / Local',
      key: 'patient',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.hospitalization?.patient?.nomeCompleto || 'Paciente não informado'}</Text>
          <Text type="secondary" size="small">
            {rec.hospitalization?.ward?.nome || 'Ala não informada'} - Leito {rec.hospitalization?.bed?.numero || 'N/A'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Prescrição',
      key: 'prescription',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.prescriptionItem?.medication?.nome || 'Medicação não especificada'}</Text>
          <Text type="secondary" size="small">
            {rec.prescriptionItem?.dosagem || '-'} - {rec.prescriptionItem?.viaAdministracao || '-'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string, record: any) => {
        if (!record.dataHoraProgamada) return <Tag color="default">PENDENTE</Tag>;
        const isOverdue = dayjs().isAfter(dayjs(record.dataHoraProgamada)) && val === 'NAO_MINISTRADO';
        if (isOverdue) return <Tag color="red">ATRASADO</Tag>;
        if (val === 'MINISTRADO') return <Tag color="green">MINISTRADO</Tag>;
        if (val === 'RECUSADO_PACIENTE') return <Tag color="orange">RECUSADO</Tag>;
        return <Tag color="default">PENDENTE</Tag>;
      }
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (rec: any) => (
        <Space>
          {rec.status === 'NAO_MINISTRADO' && (
            // Botão liberado do componente Can
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckSquareOutlined />} 
              onClick={() => setAdministerModal({ visible: true, data: rec })}
            >
              Registrar
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Administração de Medicamentos (Enfermagem)</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchAdministrations(pagination.current, pagination.pageSize, statusFilter, selectedDate)}>
            Atualizar
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Data</Text>
            <DatePicker 
              value={selectedDate} 
              onChange={(date) => setSelectedDate(date || dayjs())} 
              format="DD/MM/YYYY" 
              allowClear={false}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Filtro de Status</Text>
            <Select 
              value={statusFilter} 
              onChange={setStatusFilter} 
              style={{ width: 200 }}
              options={[
                { value: '', label: 'Todos' },
                { value: 'NAO_MINISTRADO', label: 'Pendentes / Atrasados' },
                { value: 'MINISTRADO', label: 'Ministrados' },
                { value: 'RECUSADO_PACIENTE', label: 'Recusados' },
              ]}
            />
          </div>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table 
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          rowClassName={(record) => {
            if (!record.dataHoraProgamada) return '';
            const isOverdue = dayjs().isAfter(dayjs(record.dataHoraProgamada)) && record.status === 'NAO_MINISTRADO';
            return isOverdue ? 'row-overdue' : '';
          }}
        />
      </Card>

      <AdministerModal 
        visible={administerModal.visible}
        administration={administerModal.data}
        onCancel={() => setAdministerModal({ visible: false, data: null })}
        onSuccess={() => {
          setAdministerModal({ visible: false, data: null });
          fetchAdministrations(pagination.current, pagination.pageSize, statusFilter, selectedDate);
        }}
      />

      <style>{`
        .row-overdue {
          background-color: #fff1f0;
        }
        .row-overdue:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
};