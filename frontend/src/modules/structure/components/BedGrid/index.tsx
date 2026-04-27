import { Row, Col, Card, Badge, Empty, Typography, theme } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Bed {
  id: string;
  numero: string;
  tipo: string;
  status: 'LIVRE' | 'OCUPADO' | 'MANUTENCAO' | 'RESERVADO';
}

interface BedGridProps {
  beds: Bed[];
  onEditBed: (bed: Bed) => void;
}

export const BedGrid = ({ beds, onEditBed }: BedGridProps) => {
  const { token } = theme.useToken();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVRE': return '#52c41a';
      case 'OCUPADO': return '#f5222d';
      case 'MANUTENCAO': return '#faad14';
      case 'RESERVADO': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  if (beds.length === 0) return <Empty description="Nenhum leito cadastrado nesta ala" />;

  return (
    <Row gutter={[16, 16]}>
      {beds.map((bed) => (
        <Col key={bed.id} xs={12} sm={8} md={6} lg={4}>
          <Card
            hoverable
            size="small"
            style={{ 
              borderTop: `4px solid ${getStatusColor(bed.status)}`,
              textAlign: 'center' 
            }}
            onClick={() => onEditBed(bed)}
          >
            <MedicineBoxOutlined style={{ fontSize: 24, color: getStatusColor(bed.status) }} />
            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: 16 }}>Leito {bed.numero}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{bed.tipo}</Text>
            </div>
            <Badge color={getStatusColor(bed.status)} text={bed.status} style={{ marginTop: 4 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};