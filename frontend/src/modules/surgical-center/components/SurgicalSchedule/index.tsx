import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Space, Typography, Tag, message, Tooltip, DatePicker } from 'antd';
import { SafetyCertificateOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { surgicalCenterService } from '../../services/surgical-center.service';
import { PreOpChecklistModal } from '../PreOpChecklistModal';
import { ScheduleSurgeryModal } from '../ScheduleSurgeryModal'; // 🔥 Nova Importação
import dayjs from 'dayjs';

const { Text } = Typography;

export const SurgicalSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  
  const [checklistModal, setChecklistModal] = useState({ visible: false, cirurgia: null as any });
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false); // 🔥 Novo Estado

  const fetchSchedules = useCallback(async (date = dayjs()) => {
    setLoading(true);
    try {
      const res = await surgicalCenterService.getSchedules(
        date.startOf('day').toISOString(), 
        date.endOf('day').toISOString()
      );
      setSchedules(res.data?.data || res.data || []);
    } catch (err) {
      message.error('Erro ao carregar a pauta cirúrgica.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules(selectedDate);
  }, [fetchSchedules, selectedDate]);

  const handleStartSurgery = async (id: string) => {
    try {
      await surgicalCenterService.startSurgery(id);
      message.success('Cirurgia Iniciada! Tempo de sala contando.');
      fetchSchedules(selectedDate);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao iniciar cirurgia.');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'AGENDADO': return 'default';
      case 'PRE_OPERATORIO': return 'warning';
      case 'EM_ANDAMENTO': return 'processing';
      case 'RECUPERACAO': return 'cyan';
      case 'FINALIZADO': return 'success';
      case 'CANCELADO': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    { 
      title: 'Horário', 
      dataIndex: 'dataCirurgia', 
      render: (val: string) => <Text strong>{dayjs(val).format('HH:mm')}</Text>,
      width: 100
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
      title: 'Procedimento', 
      dataIndex: 'procedimento', 
      key: 'procedimento' 
    },
    { 
      title: 'Sala', 
      dataIndex: ['sala', 'nome'], 
      key: 'sala',
      render: (val: string) => <Tag color="geekblue">{val}</Tag>
    },
    { 
      title: 'Cirurgião', 
      dataIndex: ['cirurgiao', 'nomeCompleto'], 
      key: 'cirurgiao' 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (val: string) => <Tag color={getStatusColor(val)}>{val.replace('_', ' ')}</Tag>
    },
    { 
      title: 'Ações', 
      key: 'acoes', 
      render: (rec: any) => (
        <Space>
          {rec.status === 'AGENDADO' && (
            <Tooltip title="Realizar Checklist OMS">
              <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => setChecklistModal({ visible: true, cirurgia: rec })}>
                Pré-Op
              </Button>
            </Tooltip>
          )}
          {rec.status === 'PRE_OPERATORIO' && (
            <Tooltip title="Iniciar Procedimento">
              <Button type="primary" style={{ backgroundColor: '#52c41a' }} icon={<PlayCircleOutlined />} onClick={() => handleStartSurgery(rec.id)}>
                Iniciar
              </Button>
            </Tooltip>
          )}
          {rec.status === 'EM_ANDAMENTO' && (
            <Button type="default" onClick={() => message.info('Módulo Intra-operatório em desenvolvimento')}>Painel da Sala</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card title="Pauta do Centro Cirúrgico" extra={
      <Space>
        <DatePicker value={selectedDate} onChange={(date) => setSelectedDate(date || dayjs())} format="DD/MM/YYYY" allowClear={false} />
        <Button icon={<ReloadOutlined />} onClick={() => fetchSchedules(selectedDate)} />
        
        {/* 🔥 BOTÃO CORRIGIDO: Agora ele chama o Modal e não a message.info */}
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setScheduleModalVisible(true)}>
          Agendar Cirurgia
        </Button>
      </Space>
    }>
      <Table 
        dataSource={schedules} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        size="small" 
        pagination={{ pageSize: 15 }}
      />

      {/* Renderiza o Modal do Checklist */}
      {checklistModal.visible && (
        <PreOpChecklistModal 
          visible={checklistModal.visible}
          cirurgia={checklistModal.cirurgia}
          onCancel={() => setChecklistModal({ visible: false, cirurgia: null })}
          onSuccess={() => {
            setChecklistModal({ visible: false, cirurgia: null });
            fetchSchedules(selectedDate);
          }}
        />
      )}

      {/* 🔥 Renderiza o NOVO Modal de Agendamento */}
      {scheduleModalVisible && (
        <ScheduleSurgeryModal
          visible={scheduleModalVisible}
          onCancel={() => setScheduleModalVisible(false)}
          onSuccess={() => {
            setScheduleModalVisible(false);
            fetchSchedules(selectedDate);
          }}
        />
      )}
    </Card>
  );
};