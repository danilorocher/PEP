import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined, ClockCircleOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { ExamRequestModal } from '../ExamRequestModal';

const { Text } = Typography;

interface PatientExamListProps {
  patientId: string;
  recordId: string;
  hospitalizationId?: string;
}

export const PatientExamList = ({ patientId, recordId, hospitalizationId }: PatientExamListProps) => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams/requests', { params: { patientId, limit: 100 } });
      setRequests(response.data?.data || response.data || []);
    } catch (error) {
      message.error('Erro ao carregar exames solicitados.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusTag = (status: string) => {
    const configs: any = {
      SOLICITADO: { color: 'blue', text: 'SOLICITADO', icon: <ClockCircleOutlined /> },
      COLETADO: { color: 'orange', text: 'COLETADO', icon: <ClockCircleOutlined /> },
      EM_ANALISE: { color: 'processing', text: 'EM ANÁLISE', icon: <ReloadOutlined spin /> },
      CONCLUIDO: { color: 'success', text: 'CONCLUÍDO', icon: <CheckCircleOutlined /> },
      LAUDO_LIBERADO: { color: 'success', text: 'LAUDO LIBERADO', icon: <CheckCircleOutlined /> },
      CANCELADO: { color: 'error', text: 'CANCELADO' },
    };
    const config = configs[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'dataHoraSolicitacao',
      key: 'date',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Exame',
      key: 'exam',
      render: (rec: any) => <Text strong>{rec.exam?.nome}</Text>,
    },
    {
      title: 'Urgência',
      dataIndex: 'urgencia',
      key: 'urgencia',
      render: (val: string) => <Tag color={val === 'EMERGENCIA' ? 'red' : val === 'URGENTE' ? 'orange' : 'default'}>{val}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => getStatusTag(val),
    },
    {
      title: 'Solicitante',
      dataIndex: ['doctor', 'nomeCompleto'],
      key: 'doctor',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Can module="exames" action="solicitar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Solicitar Exame
          </Button>
        </Can>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={requests}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
      />

      {modalVisible && (
        <ExamRequestModal
          visible={modalVisible}
          patientId={patientId}
          recordId={recordId}
          hospitalizationId={hospitalizationId}
          onCancel={() => setModalVisible(false)}
          onSuccess={() => { setModalVisible(false); fetchRequests(); }}
        />
      )}
    </div>
  );
};