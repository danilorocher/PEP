import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Typography, Card, message } from 'antd';
import api from '../../../../shared/services/api';

const { Title } = Typography;

export const AppointmentsCalendarPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Busca os agendamentos no Backend
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      // O frontend está na pasta 'scheduling', mas a API do backend é '/appointments'
      const response = await api.get('/appointments');
      const rawData = response.data?.data || [];
      
      // Mapeamento dos dados do Backend para o formato do FullCalendar
      const mappedEvents = rawData.map((appt: any) => ({
        id: appt.id,
        title: `${appt.patient?.nomeCompleto || 'Sem Nome'} - ${appt.doctor?.nomeCompleto || 'Sem Médico'}`,
        start: appt.dataHoraInicio, 
        end: appt.dataHoraFim,
        backgroundColor: getStatusColor(appt.status),
        extendedProps: { ...appt } 
      }));
      
      setEvents(mappedEvents);
    } catch (error) {
      message.error('Erro ao carregar a agenda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 2. Cores baseadas no status do Agendamento
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADO': return '#1890ff'; // Azul
      case 'CONFIRMADO': return '#52c41a'; // Verde
      case 'EM_ATENDIMENTO': return '#faad14'; // Amarelo
      case 'CANCELADO': return '#f5222d'; // Vermelho
      default: return '#d9d9d9'; // Cinza
    }
  };

  // 3. Ação: Quando clica num horário vazio
  const handleDateClick = (arg: any) => {
    console.log('Horário clicado para novo agendamento:', arg.dateStr);
    // Em breve: Lógica para abrir o Modal de agendamento aqui
  };

  // 4. Ação: Drag-and-drop (Remarcação arrastando)
  const handleEventDrop = async (info: any) => {
    const { event } = info;
    try {
      await api.patch(`/appointments/${event.id}/reschedule`, { // Ajuste a rota de patch conforme o seu backend
        dataHoraInicio: event.start.toISOString(),
        dataHoraFim: event.end?.toISOString(),
      });
      message.success('Agendamento remarcado com sucesso!');
    } catch (error) {
      info.revert(); // Se falhar, o bloco volta pro lugar original
      message.error('Falha ao remarcar. Horário indisponível.');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Agenda Visual</Title>
      <Card loading={loading} bodyStyle={{ padding: 0 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale="pt-br"
          slotMinTime="07:00:00" 
          slotMaxTime="19:00:00" 
          allDaySlot={false}     
          slotDuration="00:15:00" 
          editable={true}        
          selectable={true}      
          events={events}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          height="75vh"
        />
      </Card>
    </div>
  );
};