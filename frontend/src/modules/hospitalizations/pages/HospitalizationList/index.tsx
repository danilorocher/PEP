import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Card, Select } from 'antd';
import { PlusOutlined, ExportOutlined, SolutionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { AdmitModal } from '../../components/AdmitModal';
import { DischargeModal } from '../../components/DischargeModal';

const { Title, Text } = Typography;

export const HospitalizationListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('ATIVA');

  const [admitVisible, setAdmitVisible] = useState(false);
  const [dischargeData, setDischargeData] = useState<{ visible: boolean, id: string | null }>({ visible: false, id: null });

  const fetchHospitalizations = useCallback(async (page = 1, pageSize = 10, status = 'ATIVA') => {
    setLoading(true);
    try {
      const response = await api.get('/hospitalizations', {
        params: { page, limit: pageSize, status },
      });
      setData(response.data.data);
      setPagination({ current: page, pageSize, total: response.data.total });
    } catch (error) {
      message.error('Erro ao carregar internações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitalizations(1, pagination.pageSize, statusFilter);
  }, [fetchHospitalizations, statusFilter]);

  const handleTableChange = (newPagination: any) => {
    fetchHospitalizations(newPagination.current, newPagination.pageSize, statusFilter);
  };

  const columns = [
    {
      title: 'Paciente',
      key: 'patient',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.patient?.nomeCompleto}</Text>
          <Text type="secondary" size="small">CPF: {rec.patient?.cpf}</Text>
        </Space>
      )
    },
    {
      title: 'Localização',
      key: 'location',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text>{rec.ward?.nome}</Text>
          <Text type="secondary" size="small">Leito {rec.bed?.numero} ({rec.tipoAcomodacao})</Text>
        </Space>
      )
    },
    {
      title: 'Entrada',
      dataIndex: 'dataEntrada',
      key: 'dataEntrada',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Médico Responsável',
      key: 'medico',
      render: (rec: any) => rec.medicoResponsavel?.nomeCompleto
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={val === 'ATIVA' ? 'blue' : val === 'ALTA' ? 'green' : 'default'}>{val}</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (rec: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<SolutionOutlined />} 
            onClick={() => navigate(`/medical-records/${rec.patientId}`)}
            title="Acessar Prontuário"
          />
          {rec.status === 'ATIVA' && (
            <Can module="internacao" action="alta">
              <Button 
                size="small" 
                type="primary" 
                danger
                icon={<ExportOutlined />} 
                onClick={() => setDischargeData({ visible: true, id: rec.id })}
                title="Registrar Alta"
              >
                Alta
              </Button>
            </Can>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Gestão de Internações</Title>
        <Space>
          <Select 
            value={statusFilter} 
            onChange={setStatusFilter} 
            style={{ width: 150 }}
            options={[
              { value: '', label: 'Todos os Status' },
              { value: 'ATIVA', label: 'Ativas' },
              { value: 'ALTA', label: 'Alta Concedida' },
            ]}
          />
          <Can module="internacao" action="admitir">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAdmitVisible(true)}>
              Admitir Paciente
            </Button>
          </Can>
        </Space>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Table 
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <AdmitModal 
        visible={admitVisible} 
        onCancel={() => setAdmitVisible(false)} 
        onSuccess={() => { setAdmitVisible(false); fetchHospitalizations(1, pagination.pageSize, statusFilter); }} 
      />

      <DischargeModal 
        visible={dischargeData.visible}
        hospitalizationId={dischargeData.id}
        onCancel={() => setDischargeData({ visible: false, id: null })}
        onSuccess={() => { setDischargeData({ visible: false, id: null }); fetchHospitalizations(pagination.current, pagination.pageSize, statusFilter); }}
      />
    </div>
  );
};