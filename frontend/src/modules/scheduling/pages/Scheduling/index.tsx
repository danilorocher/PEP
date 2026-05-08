import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Typography, Card, message, Modal, Form, Select, DatePicker, Button, Space, Spin, Divider, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
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
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null); // 🔥 Controla se é edição/exclusão
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]); 
  
  // Estados para a Disponibilidade
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, patientsRes, doctorsRes, specRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients', { params: { limit: 100 } }), 
        api.get('/doctors', { params: { limit: 100 } }),
        api.get('/specialties', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } }))
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

  const handleDateClick = (arg: any) => {
    const clickedDate = dayjs(arg.dateStr);
    setSelectedAppointmentId(null); // Modo de criação
    form.resetFields();
    form.setFieldsValue({ 
      dataConsulta: clickedDate,
      tipo: 'CONSULTA',
      duracao: 30
    });
    setSelectedTime(clickedDate.format('HH:mm')); 
    setAvailableTimes([]); 
    setIsModalOpen(true);
  };

  // 🔥 NOVO: Ação ao clicar em um agendamento existente (para Editar ou Excluir)
  const handleEventClick = (info: any) => {
    const appt = info.event.extendedProps;
    setSelectedAppointmentId(info.event.id); // Ativa o modo de edição/exclusão
    
    form.setFieldsValue({
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      specialtyId: appt.specialtyId,
      dataConsulta: dayjs(appt.dataHora),
      tipo: appt.tipo,
      duracao: appt.duracao,
    });
    
    setSelectedTime(dayjs(appt.dataHora).format('HH:mm'));
    setAvailableTimes([dayjs(appt.dataHora).format('HH:mm')]);
    setIsModalOpen(true);
  };

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
      setAvailableTimes(Array.isArray(times) ? times : []);
    } catch (error) {
      setAvailableTimes(['07:00', '07:30', '08:00', '08:30', '09:00', '10:00', '11:00', '14:00', '15:30', '16:00']);
    } finally {
      setFetchingAvailability(false);
    }
  };

  const handleSaveAppointment = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedTime) {
        message.warning('Por favor, selecione um horário disponível.');
        return;
      }
      const dataHoraFinal = dayjs(values.dataConsulta.format('YYYY-MM-DD') + 'T' + selectedTime).toISOString();
      const payload = {
        patientId: values.patientId,
        doctorId: values.doctorId,
        specialtyId: values.specialtyId,
        dataHora: dataHoraFinal,   
        duracao: values.duracao,   
        tipo: values.tipo,
      };

      if (selectedAppointmentId) {
        // Modo Edição
        await api.patch(`/appointments/${selectedAppointmentId}`, payload);
        message.success('Agendamento atualizado com sucesso!');
      } else {
        // Modo Criação
        await api.post('/appointments', payload);
        message.success('Agendamento criado com sucesso!');
      }

      setIsModalOpen(false);
      fetchInitialData(); 
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao processar dados.');
    }
  };

  // 🔥 NOVO: Função para excluir o agendamento (Chama a rota DELETE da Fase 2)
  const handleDeleteAppointment = async () => {
    if (!selectedAppointmentId) return;
    try {
      await api.delete(`/appointments/${selectedAppointmentId}`); // Rota DELETE criada na Fase 2
      message.success('Agendamento excluído com sucesso!');
      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao excluir agendamento.');
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
          editable={true}        
          selectable={true}      
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick} // 🔥 ATIVADO: Agora você pode clicar no card azul!
          eventDrop={handleEventDrop}
          height="75vh"
        />
      </Card>

      <Modal
        title={selectedAppointmentId ? "Editar Agendamento" : "Novo Agendamento"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        // 🔥 Customização do Rodapé para incluir o botão de Excluir
        footer={[
          selectedAppointmentId && (
            <Popconfirm
              key="delete"
              title="Excluir Agendamento"
              description="Tem certeza que deseja excluir este agendamento? Esta ação removerá o registro do calendário."
              onConfirm={handleDeleteAppointment}
              okText="Sim, excluir"
              cancelText="Não"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} style={{ float: 'left' }}>
                Excluir
              </Button>
            </Popconfirm>
          ),
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</Button>,
          <Button key="submit" type="primary" onClick={handleSaveAppointment}>Confirmar</Button>
        ]}
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

            <Form.Item name="specialtyId" label="Especialidade" rules={[{ required: true, message: 'Obrigatório' }]} style={{ width: 200 }}>
              <Select placeholder="Especialidade">
                {specialties.map(s => <Option key={s.id} value={s.id}>{s.nome}</Option>)}
              </Select>
            </Form.Item>

            <Form.Item name="dataConsulta" label="Data" rules={[{ required: true, message: 'Selecione a data' }]}>
              <DatePicker format="DD/MM/YYYY" onChange={fetchDoctorAvailability} allowClear={false} style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
            <Form.Item name="tipo" label="Tipo de Atendimento" rules={[{ required: true }]} style={{ width: 400 }}>
              <Select placeholder="Selecione o tipo">
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
              </Select>
            </Form.Item>
          </Space>

          <Divider style={{ margin: '12px 0' }} />

          <div>
            <Typography.Text strong>Horário:</Typography.Text>
            <div style={{ marginTop: '8px' }}>
              {fetchingAvailability ? <Spin /> : (
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
              )}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};