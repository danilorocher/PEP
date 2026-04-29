import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, message, Modal, Calendar, Badge, Divider, List, Avatar } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, PlayCircleOutlined, EditOutlined, UserDeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { AppointmentFormModal } from '../../components/AppointmentFormModal';

const { Title, Text } = Typography;

export const SchedulingPage = () => {
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
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
      }).catch(err => {
        console.error('Rota de agendamentos falhou ou estÃ¡ vazia:', err.message);
        return { data: { data: [] } }; // Fallback seguro
      });
      
      // Lida tanto com paginaÃ§Ã£o quanto com array direto do backend
      const agendamentos = response.data?.data || response.data || [];
      setAppointments(Array.isArray(agendamentos) ? agendamentos : []);
    } catch (error) {
      console.error(error);
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
      console.error(error);
      message.error('Erro ao processar aÃ§Ã£o ou rota inexistente');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      AGENDADO: 'blue',
      CONFIRMADO: 'cyan',
      AGUARDANDO_ATENDIMENTO: 'magenta',
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
      render: (val: string) => val ? dayjs(val).format('HH:mm') : '--:--',
      width: 100,
    },
    {
      title: 'Paciente',
      key: 'patient',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.patient?.nomeCompleto || 'Paciente nÃ£o identificado'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{rec.tipo || 'Consulta'}</Text>
        </Space>
      )
    },
    {
      title: 'Profissional',
      key: 'doctor',
      render: (rec: any) => rec.doctor?.nomeCompleto || 'NÃ£o atribuÃ­do'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={getStatusColor(val)}>{val || 'AGENDADO'}</Tag>
    },
    {
      title: 'AÃ§Ãµes',
      key: 'actions',
      render: (rec: any) => (
        <Space wrap>
          {/* Status Iniciais */}
          {(!rec.status || rec.status === 'AGENDADO') && (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleAction(rec.id, 'confirm')}>Confirmar</Button>
          )}
          
          {/* ConfirmaÃ§Ã£o e RecepÃ§Ã£o */}
          {rec.status === 'CONFIRMADO' && (
            <Button size="small" type="default" onClick={() => handleAction(rec.id, 'arrive')}>Chegou</Button>
          )}
          
          {/* Atendimento */}
          {(rec.status === 'CONFIRMADO' || rec.status === 'AGUARDANDO_ATENDIMENTO') && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleAction(rec.id, 'start')}>Atender</Button>
          )}
          
          {/* AÃ§Ãµes de Cancelamento / Falta (DisponÃ­veis em status iniciais) */}
          {!['REALIZADO', 'CANCELADO', 'FALTOU'].includes(rec.status) && (
            <>
              <Button size="small" danger onClick={() => {
                  Modal.confirm({
                      title: 'Registrar Falta',
                      content: 'Deseja registrar que o paciente faltou Ã  consulta?',
                      onOk: () => handleAction(rec.id, 'miss')
                  });
              }}>Faltou</Button>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => {
                  Modal.confirm({
                      title: 'Cancelar Agendamento',
                      content: 'Deseja realmente cancelar esta consulta?',
                      onOk: () => handleAction(rec.id, 'cancel')
                  });
              }}>Cancelar</Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Agendamento e RecepÃ§Ã£o</Title>
        {/* BotÃ£o de Novo Agendamento liberado */}
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedAppt(null); setModalVisible(true); }}>
          Novo Agendamento
        </Button>
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
        selectedDate={selectedDate}
      />
    </div>
  );
};
