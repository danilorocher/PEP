import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Typography, Card, message, Modal, Form, Select, DatePicker, Button, Space, Spin, Divider } from 'antd';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Title } = Typography;
const { Option } = Select;

export const SchedulingPage = () => {
  const [form] = Form.useForm();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados do Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]); // 🔥 NOVO: Estado para Especialidades
  
  // Estados para a Disponibilidade
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 1. Busca inicial de dados
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, patientsRes, doctorsRes, specRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients', { params: { limit: 100 } }), 
        api.get('/doctors', { params: { limit: 100 } }),
        api.get('/specialties', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })) // 🔥 Busca as especialidades
      ]);

      const rawAppts = apptRes.data?.data || [];
      setEvents(rawAppts.map((appt: any) => ({
        id: appt.id,
        title: `${appt.patient?.nomeCompleto || 'Sem Nome'} - ${(appt.tipo || 'Consulta')}`,
        start: appt.dataHora, 
        end: dayjs(appt.dataHora).add(appt.duracao || 30, 'minute').toISOString(),
        backgroundColor: getStatusColor(appt.status),
        extendedProps: { ...appt } 
      })));

      setPatients(patientsRes.data?.data || patientsRes.data || []);
      setDoctors(doctorsRes.data?.data || doctorsRes.data || []);
      setSpecialties(specRes.data?.data || specRes.data || []); 
    } catch (error) {
      message.error('Erro ao carregar dados da agenda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // 2. Cores baseadas no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADO': return '#1890ff';
      case 'CONFIRMADO': return '#52c41a';
      case 'EM_ATENDIMENTO': return '#faad14';
      case 'REALIZADO': return '#389e0d';
      case 'CANCELADO': return '#f5222d';
      case 'FALTOU': return '#8c8c8c';
      default: return '#d9d9d9';
    }
  };

  // 3. Ação: Clique na grade abre o Modal
  const handleDateClick = (arg: any) => {
    const clickedDate = dayjs(arg.dateStr);
    
    form.resetFields();
    form.setFieldsValue({ 
      dataConsulta: clickedDate,
      tipo: 'CONSULTA', // 🔥 AGORA OBEDECE AO ENUM DO PRISMA
      duracao: 30
    });
    
    setSelectedTime(clickedDate.format('HH:mm')); 
    setAvailableTimes([]); 
    setIsModalOpen(true);
  };

  // 4. Ação: Drag-and-drop
  const handleEventDrop = async (info: any) => {
    const { event } = info;
    try {
      await api.patch(`/appointments/${event.id}/reschedule`, { 
        dataHora: event.start.toISOString(),
      });
      message.success('Agendamento remarcado com sucesso!');
    } catch (error) {
      info.revert();
      message.error('Falha ao remarcar. Horário indisponível.');
    }
  };

  // 5. Buscar disponibilidade
  const fetchDoctorAvailability = async () => {
    const doctorId = form.getFieldValue('doctorId');
    const date = form.getFieldValue('dataConsulta');

    if (!doctorId || !date) return;

    setFetchingAvailability(true);
    try {
      const res = await api.get(`/appointments/doctor/${doctorId}/availability`, {
        params: { date: date.format('YYYY-MM-DD') } 
      });
      
      const times = res.data?.data || res.data;
      if (Array.isArray(times) && times.length > 0) {
        setAvailableTimes(times);
      } else {
        throw new Error('Nenhum horário retornado');
      }
    } catch (error) {
      // Mock de segurança caso a API de horários ainda não exista
      setAvailableTimes(['07:00', '07:30', '08:00', '08:30', '09:00', '10:00', '11:00', '14:00', '15:30', '16:00']);
    } finally {
      setFetchingAvailability(false);
    }
  };

  // 6. Submeter o Novo Agendamento
  const handleSaveAppointment = async () => {
    try {
      const values = await form.validateFields();
      
      if (!selectedTime) {
        message.warning('Por favor, selecione um horário disponível.');
        return;
      }

      const dataHoraFinal = dayjs(values.dataConsulta.format('YYYY-MM-DD') + 'T' + selectedTime).toISOString();

      // 🔥 CORREÇÃO MÁXIMA: Payload IDÊNTICO ao exigido pelo CreateAppointmentDto!
      await api.post('/appointments', {
        patientId: values.patientId,
        doctorId: values.doctorId,
        specialtyId: values.specialtyId, // 🔥 OBRIGATÓRIO NO DTO!
        dataHora: dataHoraFinal,   
        duracao: values.duracao,   
        tipo: values.tipo, // 🔥 DEVE SER: CONSULTA, RETORNO, EXAME ou PROCEDIMENTO
      });

      message.success('Agendamento criado com sucesso!');
      setIsModalOpen(false);
      fetchInitialData(); 
    } catch (error: any) {
      if (error.errorFields) return; 
      message.error(error.response?.data?.message || 'Erro de Validação. Verifique os dados no console.');
      console.error('Detalhes do Erro 400:', error.response?.data);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Agenda Visual</Title>
      
      <Card loading={loading} bodyStyle={{ padding: 0 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          locale="pt-br"
          slotMinTime="07:00:00" 
          slotMaxTime="19:00:00" 
          allDaySlot={false}     
          slotDuration="00:15:00" 
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            omitZeroMinute: false, 
          }}
          editable={true}        
          selectable={true}      
          events={events}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          height="75vh"
        />
      </Card>

      <Modal
        title="Novo Agendamento"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveAppointment}
        okText="Confirmar Agendamento"
        cancelText="Cancelar"
        width={700} 
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="patientId" label="Paciente" rules={[{ required: true, message: 'Selecione o paciente' }]}>
            <Select showSearch placeholder="Buscar paciente..." optionFilterProp="children">
              {patients.map(p => <Option key={p.id} value={p.id}>{p.nomeCompleto} (CPF: {p.cpf})</Option>)}
            </Select>
          </Form.Item>

          <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
            <Form.Item name="doctorId" label="Médico" rules={[{ required: true, message: 'Selecione o médico' }]} style={{ width: 300 }}>
              <Select placeholder="Selecione o profissional" onChange={fetchDoctorAvailability}>
                {doctors.map(d => <Option key={d.id} value={d.id}>{d.nomeCompleto} - CRM {d.crm}</Option>)}
              </Select>
            </Form.Item>

            {/* 🔥 NOVO: Campo obrigatório pelo seu DTO! */}
            <Form.Item name="specialtyId" label="Especialidade" rules={[{ required: true, message: 'Obrigatório' }]} style={{ width: 200 }}>
              <Select placeholder="Especialidade">
                {specialties.map(s => <Option key={s.id} value={s.id}>{s.nome}</Option>)}
                {/* Fallback caso a API de especialidades não retorne nada ainda */}
                {specialties.length === 0 && <Option value="11111111-1111-1111-1111-111111111111">Clínica Médica (Mock)</Option>}
              </Select>
            </Form.Item>

            <Form.Item name="dataConsulta" label="Data" rules={[{ required: true, message: 'Selecione a data' }]}>
              <DatePicker format="DD/MM/YYYY" onChange={fetchDoctorAvailability} allowClear={false} style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
            <Form.Item name="tipo" label="Tipo de Atendimento" rules={[{ required: true }]} style={{ width: 400 }}>
              <Select placeholder="Selecione o tipo">
                {/* 🔥 LIMITADO ESTASTRITAMENTE AO ENUM "ApptType" DO PRISMA */}
                <Option value="CONSULTA">Consulta Médica</Option>
                <Option value="RETORNO">Retorno</Option>
                <Option value="EXAME">Exame</Option>
                <Option value="PROCEDIMENTO">Procedimento</Option>
              </Select>
            </Form.Item>

            <Form.Item name="duracao" label="Duração Estimada" rules={[{ required: true }]} style={{ width: 200 }}>
              <Select placeholder="Tempo">
                <Option value={15}>15 minutos</Option>
                <Option value={30}>30 minutos</Option>
                <Option value={45}>45 minutos</Option>
                <Option value={60}>1 hora</Option>
                <Option value={90}>1h 30min</Option>
                <Option value={120}>2 horas</Option>
              </Select>
            </Form.Item>
          </Space>

          <Divider style={{ margin: '12px 0' }} />

          <div>
            <Typography.Text strong>Selecione o Horário Inicial:</Typography.Text>
            <div style={{ marginTop: '8px', minHeight: '50px' }}>
              {fetchingAvailability ? (
                <Spin tip="Buscando horários..." />
              ) : availableTimes.length > 0 ? (
                <Space size={[8, 8]} wrap>
                  {availableTimes.map((time) => (
                    <Button 
                      key={time} 
                      type={selectedTime === time ? 'primary' : 'default'}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  Nenhum horário encontrado. Selecione um médico e uma data.
                </Typography.Text>
              )}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};