import React from 'react';
import { Typography, Space, Tabs, Card } from 'antd';
import { MedicineBoxOutlined, InboxOutlined, AlertOutlined } from '@ant-design/icons';
import { StockManagement } from '../../components/StockManagement';
import { DispensationQueue } from '../../components/DispensationQueue';

const { Title, Text } = Typography;

export const PharmacyDashboardPage: React.FC = () => {
  const tabItems = [
    {
      key: 'dispensation',
      label: <span><MedicineBoxOutlined /> Fila de Dispensação</span>,
      children: <DispensationQueue />
    },
    {
      key: 'stock',
      label: <span><InboxOutlined /> Estoque Lote/Validade</span>,
      children: <StockManagement />
    },
    {
      key: 'interactions',
      label: <span><AlertOutlined /> Interações Medicamentosas</span>,
      children: (
        <Card>
          <Text type="secondary">Módulo de regras de interações medicamentosas ativo e operando em background nas prescrições médicas.</Text>
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Farmácia Hospitalar</Title>
        <Text type="secondary">Gestão de estoque, dispensação e rastreabilidade de medicamentos.</Text>
      </Space>

      <Card bodyStyle={{ padding: '0 24px 24px 24px' }}>
        <Tabs defaultActiveKey="dispensation" items={tabItems} size="large" />
      </Card>
    </div>
  );
};