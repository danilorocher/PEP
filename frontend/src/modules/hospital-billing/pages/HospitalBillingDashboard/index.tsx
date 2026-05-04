import React from 'react';
import { Typography, Space, Tabs, Card } from 'antd';
import { ContainerOutlined, WarningOutlined, BarChartOutlined } from '@ant-design/icons';
import { AccountsList } from '../../components/AccountsList';

const { Title, Text } = Typography;

export const HospitalBillingDashboard: React.FC = () => {
  const tabItems = [
    {
      key: 'accounts',
      label: <span><ContainerOutlined /> Contas Hospitalares</span>,
      children: <AccountsList />
    },
    {
      key: 'denials',
      label: <span><WarningOutlined /> Gestão de Glosas</span>,
      children: (
        <Card>
          <Text type="secondary">Painel de análise de glosas, recursos e reprocessamento junto às operadoras e SUS.</Text>
        </Card>
      )
    },
    {
      key: 'drg',
      label: <span><BarChartOutlined /> Análise DRG e Custos</span>,
      children: (
        <Card>
          <Text type="secondary">Dashboard analítico comparando o custo previsto do DRG (Diagnosis Related Groups) com o consumo real da conta do paciente.</Text>
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Faturamento Avançado e Finanças</Title>
        <Text type="secondary">Controlo de consumo em tempo real, emissão de AIH/BPA, DRG e análise de glosas.</Text>
      </Space>

      <Card bodyStyle={{ padding: '0 24px 24px 24px' }}>
        <Tabs defaultActiveKey="accounts" items={tabItems} size="large" />
      </Card>
    </div>
  );
};