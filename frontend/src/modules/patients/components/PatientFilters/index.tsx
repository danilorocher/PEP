import { Form, Input, Select, Button, Row, Col, Card } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

interface PatientFiltersProps {
  onSearch: (filters: any) => void;
  onClear: () => void;
  loading?: boolean;
}

export const PatientFilters = ({ onSearch, onClear, loading }: PatientFiltersProps) => {
  const [form] = Form.useForm();

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form form={form} layout="vertical" onFinish={onSearch}>
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={8} md={8}>
            <Form.Item name="nomeCompleto" label="Nome do Paciente" style={{ marginBottom: 0 }}>
              <Input placeholder="Buscar por nome..." allowClear prefix={<SearchOutlined />} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Form.Item name="status" label="Status" style={{ marginBottom: 0 }}>
              <Select placeholder="Todos" allowClear>
                <Select.Option value="ATIVO">Ativo</Select.Option>
                <Select.Option value="INATIVO">Inativo</Select.Option>
                <Select.Option value="OBITO">Óbito</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={10} md={12} style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              Filtrar
            </Button>
            <Button onClick={handleClear} icon={<ClearOutlined />} style={{ marginLeft: 8 }}>
              Limpar
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};