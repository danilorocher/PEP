import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Card, Modal, Descriptions } from 'antd';
import { CheckSquareOutlined, ClockCircleOutlined, UserOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;

export const AttendanceListPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [checkInModal, setCheckInModal] = useState({ visible: false, appointment: null as any });

  // Busca apenas os agendamentos de HOJE
  const fetchTodayAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const todayStart = dayjs().startOf('day').toISOString();
      const todayEnd = dayjs().endOf('day').toISOString();

      const response = await api.get('/appointments', {
        params: { dataInicial: todayStart, dataFinal: todayEnd }
      }).catch(err => {
        console.error('Aviso: Rota de agendamentos falhou', err.message);
        return { data: { data: [] } }; 
      });

      const listData = response.data?.data || response.data || [];
      // Ordena a fila pelo horário mais cedo primeiro (UX Sênior)
      const sortedData = (Array.isArray(listData) ? listData : []).sort((a, b) => {
        const timeA = dayjs(a.dataHoraInicio || a.dataHora).valueOf();
        const timeB = dayjs(b.dataHoraInicio || b.dataHora).valueOf();
        return timeA - timeB;
      });

      setData(sortedData);
    } catch (error) {
      message.error('Erro ao carregar lista de atendimentos do dia');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  // Função para a Recepção confirmar a chegada do paciente
  const handleCheckIn = async () => {
    try {
      // Altera o status para AGUARDANDO_ATENDIMENTO (Envia para a fila do médico)
      await api.patch(`/appointments/${checkInModal.appointment.id}/arrive`);
      message.success('Check-in realizado! Paciente na sala de espera.');
      setCheckInModal({ visible: false, appointment: null });
      fetchTodayAttendance();
    } catch (error) {
      message.error('Erro ao registrar chegada. Verifique se a API suporta esta rota.');
    }
  };

  const getStatusTag = (status: string) => {
    if (!status || status === 'AGENDADO' || status === 'CONFIRMADO') {
      return <Tag color="blue" icon={<ClockCircleOutlined />}>Previsto</Tag>;
    }
    if (status === 'AGUARDANDO_ATENDIMENTO') {
      return <Tag color="magenta" icon={<UserOutlined />}>Na Recepção / Espera</Tag>;
    }
    if (status === 'EM_ATENDIMENTO') {
      return <Tag color="orange" icon={<SyncOutlined spin />}>Em Consultório</Tag>;
    }
    if (status === 'REALIZADO') {
      return <Tag color="green">Finalizado</Tag>;
    }
    return <Tag color="default">{status}</Tag>;
  };

  const columns = [
    {
      title: 'Horário',
      key: 'hora',
      render: (rec: any) => {
        // 🔥 Blindagem: Suporta tanto o modelo antigo quanto o novo da Agenda Visual
        const hora = rec.dataHoraInicio || rec.dataHora;
        return <Text strong>{hora ? dayjs(hora).format('HH:mm') : '--:--'}</Text>;
      },
      width: 100,
    },
    {
      title: 'Paciente',
      key: 'paciente',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.patient?.nomeCompleto || 'Não identificado'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>CPF: {rec.patient?.cpf || '---'}</Text>
        </Space>
      ),
    },
    {
      title: 'Procedimento / Profissional',
      key: 'procedimento',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          {/* 🔥 Lê o tipoConsulta (ex: RETORNO, CIRURGIA) que criamos hoje */}
          <Text strong>{(rec.tipoConsulta || rec.tipo || 'Consulta Médica').replace('_', ' ')}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{rec.doctor?.nomeCompleto || 'Profissional da Unidade'}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => getStatusTag(val),
    },
    {
      title: 'Ações da Recepção',
      key: 'acoes',
      render: (rec: any) => (
        <Space>
          {/* O Check-in só aparece se o paciente ainda não tiver chegado */}
          {(!rec.status || rec.status === 'AGENDADO' || rec.status === 'CONFIRMADO') && (
            <Button 
              type="primary" 
              icon={<CheckSquareOutlined />}
              onClick={() => setCheckInModal({ visible: true, appointment: rec })}
            >
              Dar Entrada (Check-in)
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Painel de Atendimento (Recepção)</Title>
        <Button icon={<SyncOutlined />} onClick={fetchTodayAttendance}>
          Atualizar Fila
        </Button>
      </div>

      <Card title={`Atendimentos Previstos para Hoje - ${dayjs().format('DD/MM/YYYY')}`}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* Modal de Confirmação de Check-in */}
      <Modal
        title="Confirmar Entrada de Paciente"
        open={checkInModal.visible}
        onOk={handleCheckIn}
        onCancel={() => setCheckInModal({ visible: false, appointment: null })}
        okText="Confirmar Entrada"
        cancelText="Cancelar"
      >
        {checkInModal.appointment && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Paciente">
              <Text strong>{checkInModal.appointment.patient?.nomeCompleto}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Horário Marcado">
              {dayjs(checkInModal.appointment.dataHoraInicio || checkInModal.appointment.dataHora).format('HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Profissional">
              {checkInModal.appointment.doctor?.nomeCompleto}
            </Descriptions.Item>
            <Descriptions.Item label="Tipo / Plano">
              <Tag color="blue">{(checkInModal.appointment.tipoConsulta || checkInModal.appointment.tipo || 'Particular/Convênio').replace('_', ' ')}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            Ao confirmar, o status passará para "Aguardando Atendimento" e o paciente aparecerá na tela do profissional de saúde (Médico/Enfermeiro).
          </Text>
        </div>
      </Modal>
    </div>
  );
};