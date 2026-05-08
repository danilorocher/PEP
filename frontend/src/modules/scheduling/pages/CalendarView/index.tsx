import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Typography, Card, message } from 'antd';
import api from '../../../../shared/services/api';

const { Title } = Typography;

export const AppointmentsCalendarPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, docsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/doctors', { params: { limit: 100 } })
      ]);
      
      const docsData = docsRes.data?.data || [];
      setResources(docsData.map((doc: any) => ({
        id: doc.id,
        title: doc.nomeCompleto
      })));

      const rawData = apptRes.data?.data || [];
      const mappedEvents = rawData.map((appt: any) => ({
        id: appt.id,
        resourceId: appt.doctorId, // Alinha na coluna do médico correto
        title: `${appt.patient?.nomeCompleto || 'Sem Nome'}`,
        start: appt.dataHoraInicio || appt.dataHora, 
        end: appt.dataHoraFim || new Date(new Date(appt.dataHora).getTime() + appt.duracao * 60000),
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

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADO': return '#1890ff';
      case 'CONFIRMADO': return '#52c41a';
      case 'AGUARDANDO_ATENDIMENTO': return '#13c2c2'; // Check-in feito
      case 'EM_ATENDIMENTO': return '#faad14';
      case 'CANCELADO': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  const handleEventDrop = async (info: any) => {
    const { event, newResource } = info;
    try {
      await api.patch(`/appointments/${event.id}/reschedule`, {
        dataHoraInicio: event.start.toISOString(),
        doctorId: newResource ? newResource.id : event.extendedProps.doctorId
      });
      message.success('Agendamento remarcado!');
    } catch (error) {
      info.revert();
      message.error('Falha ao remarcar. Horário indisponível.');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Agenda Clínica Visual</Title>
      <Card loading={loading} bodyStyle={{ padding: 0 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          resources={resources}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimeGridDay,timeGridWeek,dayGridMonth'
          }}
          locale="pt-br"
          slotMinTime="07:00:00" 
          slotMaxTime="19:00:00" 
          allDaySlot={false}     
          slotDuration="00:15:00" 
          editable={true}        
          selectable={true}      
          events={events}
          eventDrop={handleEventDrop}
          height="75vh"
        />
      </Card>
    </div>
  );
};