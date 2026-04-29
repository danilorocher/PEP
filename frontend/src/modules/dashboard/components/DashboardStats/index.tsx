import { Card, Col, Row, Statistic, Typography } from 'antd';
import { 
  MedicineBoxOutlined, 
  CalendarOutlined, 
  AlertOutlined, 
  FileSearchOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface DashboardStatsProps {
  hospitalizations: number;
  appointments: number;
  overdueMedications: number;
  pendingExams: number;
}

export const DashboardStats = ({ 
  hospitalizations, 
  appointments, 
  overdueMedications, 
  pendingExams 
}: DashboardStatsProps) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable>
          <Statistic
            title="InternaÃ§Ãµes Ativas"
            value={hospitalizations}
            prefix={<MedicineBoxOutlined style={{ color: '#1890ff' }} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable>
          <Statistic
            title="Agenda de Hoje"
            value={appointments}
            prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable>
          <Statistic
            title="MedicaÃ§Ãµes Atrasadas"
            value={overdueMedications}
            valueStyle={{ color: overdueMedications > 0 ? '#ff4d4f' : 'inherit' }}
            prefix={<AlertOutlined style={{ color: overdueMedications > 0 ? '#ff4d4f' : '#faad14' }} />}
          />
          {overdueMedications > 0 && <Text type="danger" style={{ fontSize: "12px" }}>AÃ§Ã£o imediata necessÃ¡ria</Text>}
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable>
          <Statistic
            title="Exames Pendentes"
            value={pendingExams}
            prefix={<FileSearchOutlined style={{ color: '#722ed1' }} />}
          />
        </Card>
      </Col>
    </Row>
  );
};
