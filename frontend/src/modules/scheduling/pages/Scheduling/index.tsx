import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, message, Modal, Calendar, Badge, Divider, List, Avatar } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, PlayCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { AppointmentFormModal } from '../../components/AppointmentFormModal';
import { Can } from '../../../../shared/hooks/usePermission';

const { Title, Text } = Typography;

export const SchedulingPage = () => {
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await api.get('/appointments', {
        params: {
          dataInicial: selectedDate.startOf('day').toISOString(),
          dataFinal: selectedDate.endOf('day').toISOString()
        }
      });
      setAppointments(response.data);
    } catch (error) {
      message.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  const handleAction = async (id: string, action: string) => {
    try {
      await api.patch(`/appointments/${id}/${action}`);
      message.success(`Agendamento atualizado: ${action}`);
      fetchSchedule();
    } catch (error) {
      message.error('Erro ao processar ação');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      AGENDADO: 'blue',
      CONFIRMADO: 'cyan',
      EM_ATENDIMENTO: 'orange',
      REALIZADO: 'green',
      CANCELADO: 'red',
      FALTOU: 'purple'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Hora',
      dataIndex: 'dataHora',
      key: 'time',
      render: (val: string) => dayjs(val).format('HH:mm'),
      width: 100,
    },
    {
      title: 'Paciente',
      key: 'patient',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.patient?.nomeCompleto}</Text>
          <Text type="secondary" size="small">{rec.tipo}</Text>
        </Space>
      )
    },
    {
      title: 'Profissional',
      key: 'doctor',
      render: (rec: any) => rec.doctor?.nomeCompleto
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={getStatusColor(val)}>{val}</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (rec: any) => (
        <Space>
          {rec.status === 'AGENDADO' && (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleAction(rec.id, 'confirm')}>Confirmar</Button>
          )}
          {rec.status === 'CONFIRMADO' && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleAction(rec.id, 'start')}>Atender</Button>
          )}
          {!['REALIZADO', 'CANCELADO'].includes(rec.status) && (
            <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => {
                Modal.confirm({
                    title: 'Cancelar Agendamento',
                    content: 'Deseja realmente cancelar esta consulta?',
                    onOk: () => handleAction(rec.id, 'cancel')
                });
            }}>Cancelar</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Agendamento e Recepção</Title>
        <Can module="agendamento" action="criar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedAppt(null); setModalVisible(true); }}>
            Novo Agendamento
          </Button>
        </Can>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
            <Calendar 
                fullscreen={false} 
                onSelect={(val) => setSelectedDate(val)} 
                value={selectedDate}
            />
        </Card>

        <Card title={`Agenda do dia ${selectedDate.format('DD/MM/YYYY')}`}>
          <Table 
            loading={loading}
            dataSource={appointments}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </Space>

      <AppointmentFormModal 
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => { setModalVisible(false); fetchSchedule(); }}
        initialValues={selectedAppt}
      />
    </div>
  );
};