import { useEffect, useState } from 'react';
import { Form, Select, Button, Row, Col, Card, Input } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';

interface BillingFiltersProps {
  onSearch: (filters: any) => void;
  onClear: () => void;
  loading?: boolean;
}

export const BillingFilters = ({ onSearch, onClear, loading }: BillingFiltersProps) => {
  const [form] = Form.useForm();
  const [insurances, setInsurances] = useState([]);

  useEffect(() => {
    const fetchInsurances = async () => {
      try {
        // Supondo rota de catálogo global ou de convênios do tenant
        const response = await api.get('/admin/insurances').catch(() => ({ data: [] }));
        setInsurances(response.data || []);
      } catch (error) {
        console.error('Erro ao buscar convênios');
      }
    };
    fetchInsurances();
  }, []);

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form form={form} layout="vertical" onFinish={onSearch}>
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={6} md={6}>
            <Form.Item name="numeroGuia" label="Nº da Guia" style={{ marginBottom: 0 }}>
              <Input placeholder="Buscar por número..." allowClear prefix={<SearchOutlined />} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Form.Item name="convenioId" label="Convênio" style={{ marginBottom: 0 }}>
              <Select placeholder="Selecione um convênio" allowClear>
                {insurances.map((ins: any) => (
                  <Select.Option key={ins.id} value={ins.id}>{ins.nome}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Form.Item name="status" label="Status" style={{ marginBottom: 0 }}>
              <Select placeholder="Todos" allowClear>
                <Select.Option value="RASCUNHO">Rascunho</Select.Option>
                <Select.Option value="ENVIADA">Enviada</Select.Option>
                <Select.Option value="AUTORIZADA">Autorizada</Select.Option>
                <Select.Option value="NEGADA">Negada</Select.Option>
                <Select.Option value="PAGA">Paga</Select.Option>
                <Select.Option value="GLOSADA">Glosada</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={6} md={6} style={{ textAlign: 'right' }}>
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