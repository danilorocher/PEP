import { useEffect, useState } from 'react';
import { Typography, Spin, message, Row, Col, List, Badge, Card, Tag } from 'antd';
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
    try {
      setLoading(true);
      const [hosp, appt, meds, exams, occupancy] = await Promise.all([
        api.get('/hospitalizations', { params: { status: 'ATIVA' } }),
        api.get('/appointments/today'),
        api.get('/medication-administrations/pending'),
        api.get('/exam-requests', { params: { status: 'SOLICITADO' } }),
        api.get('/wards/occupancy')
      ]);

      setData({
        hospitalizations: hosp.data.total || 0,
        appointments: appt.data || [],
        overdueMedications: meds.data.total || 0,
        pendingExams: exams.data.total || 0,
        occupancy: occupancy.data || []
      });
    } catch (error) {
      message.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;

  return (
    <div>
      <Title level={2}>Dashboard Operacional</Title>
      
      <DashboardStats 
        hospitalizations={data.hospitalizations}
        appointments={data.appointments.length}
        overdueMedications={data.overdueMedications}
        pendingExams={data.pendingExams}
      />

      <Row gutter={24}>
        <Col span={16}>
          <OccupancyChart data={data.occupancy} />
        </Col>
        <Col span={8}>
          <Card title="Próximos Agendamentos" bordered={false} style={{ marginTop: 24 }}>
            <List
              dataSource={data.appointments.slice(0, 5)}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.patient?.nomeCompleto}
                    description={
                      <>
                        <Badge status="processing" text={dayjs(item.dataHora).format('HH:mm')} />
                        <span style={{ marginLeft: 8 }}>{item.doctor?.nomeCompleto}</span>
                        <br />
                        <Tag color="blue">{item.type}</Tag>
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