import { useEffect, useState } from 'react';
import { Typography, Spin, message, Row, Col, List, Badge, Card, Tag, Avatar } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';
import { DashboardStats } from '../../components/DashboardStats';
import { OccupancyChart } from '../../components/OccupancyChart';
import dayjs from 'dayjs';

const { Title } = Typography;

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    hospitalizations: 0,
    appointments: [],
    overdueMedications: 0,
    pendingExams: 0,
    occupancy: []
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [hosp, appt, meds, exams, occupancy] = await Promise.all([
        api.get('/hospitalizations', { params: { status: 'ATIVA' } }).catch(() => ({ data: { total: 0 } })),
        api.get('/appointments/today').catch(() => ({ data: [] })),
        api.get('/medication-administrations/pending').catch(() => ({ data: { total: 0 } })),
        api.get('/exam-requests', { params: { status: 'SOLICITADO' } }).catch(() => ({ data: { total: 0 } })),
        api.get('/wards/occupancy').catch(() => ({ data: [] }))
      ]);

      setData({
        hospitalizations: hosp.data?.total || hosp.data?.length || 0,
        appointments: appt.data?.data || appt.data || [],
        overdueMedications: meds.data?.total || meds.data?.length || 0,
        pendingExams: exams.data?.total || exams.data?.length || 0,
        occupancy: occupancy.data?.data || occupancy.data || []
      });
    } catch (error) {
      console.error('Erro fatal ao renderizar Dashboard:', error);
      message.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Opcional: Atualiza o dashboard automaticamente a cada 1 minuto (60000ms)
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🧠 Filtros Inteligentes para separar quem chegou de quem ainda vai chegar
  const salaDeEspera = (data.appointments || []).filter((item: any) => item.status === 'AGUARDANDO_ATENDIMENTO');
  const proximosAgendamentos = (data.appointments || []).filter((item: any) => !item.status || item.status === 'AGENDADO' || item.status === 'CONFIRMADO');

  if (loading && data.appointments.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Title level={2}>Dashboard Operacional</Title>
      
      <DashboardStats 
        hospitalizations={data.hospitalizations}
        appointments={data.appointments?.length || 0}
        overdueMedications={data.overdueMedications}
        pendingExams={data.pendingExams}
      />

      <Row gutter={24}>
        <Col span={16}>
          <OccupancyChart data={data.occupancy} />
        </Col>
        
        {/* Coluna da Direita dividida em duas partes */}
        <Col span={8}>
          {/* 1. Card da Sala de Espera */}
          <Card 
            title={<><UserOutlined style={{ color: '#eb2f96' }} /> Sala de Espera</>} 
            bordered={false} 
            style={{ marginTop: 24, marginBottom: 24, borderTop: '3px solid #eb2f96' }}
          >
            <List
              dataSource={salaDeEspera.slice(0, 5)}
              locale={{ emptyText: 'Nenhum paciente em espera no momento' }}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#fff0f6', color: '#eb2f96' }} icon={<UserOutlined />} />}
                    title={item.patient?.nomeCompleto || 'Paciente não identificado'}
                    description={
                      <>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Aguardando: {item.doctor?.nomeCompleto || 'Médico'}
                        </Text>
                      </>
                    }
                  />
                  <Tag color="magenta">Recepção</Tag>
                </List.Item>
              )}
            />
          </Card>

          {/* 2. Card de Próximos Agendamentos */}
          <Card 
            title={<><ClockCircleOutlined style={{ color: '#1890ff' }} /> Previstos para Hoje</>} 
            bordered={false}
            style={{ borderTop: '3px solid #1890ff' }}
          >
            <List
              dataSource={proximosAgendamentos.slice(0, 5)}
              locale={{ emptyText: 'Nenhum agendamento pendente para hoje' }}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.patient?.nomeCompleto || 'Paciente não identificado'}
                    description={
                      <>
                        <Badge status="processing" text={dayjs(item.dataHora).format('HH:mm')} />
                        <span style={{ marginLeft: 8 }}>{item.doctor?.nomeCompleto}</span>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};