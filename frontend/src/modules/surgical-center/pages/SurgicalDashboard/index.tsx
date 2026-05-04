import React from 'react';
import { Typography, Space, Tabs, Card } from 'antd';
import { CalendarOutlined, SyncOutlined, SafetyOutlined } from '@ant-design/icons';
import { SurgicalSchedule } from '../../components/SurgicalSchedule';

const { Title, Text } = Typography;

export const SurgicalDashboardPage: React.FC = () => {
  const tabItems = [
    {
      key: 'schedule',
      label: <span><CalendarOutlined /> Pauta e Agendamento</span>,
      children: <SurgicalSchedule />
    },
    {
      key: 'intraop',
      label: <span><SyncOutlined /> Em Andamento (Intra-Op)</span>,
      children: (
        <Card>
          <Text type="secondary">Painel de monitoramento das salas em tempo real, registro de OPMEs e fichas anestésicas.</Text>
        </Card>
      )
    },
    {
      key: 'postop',
      label: <span><SafetyOutlined /> SRPA (Recuperação)</span>,
      children: (
        <Card>
          <Text type="secondary">Gestão de pacientes na Sala de Recuperação Pós-Anestésica (Escala de Aldrete).</Text>
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Centro Cirúrgico</Title>
        <Text type="secondary">Gestão de mapa cirúrgico, checklists de segurança da OMS e rastreabilidade de OPMEs.</Text>
      </Space>

      <Card bodyStyle={{ padding: '0 24px 24px 24px' }}>
        <Tabs defaultActiveKey="schedule" items={tabItems} size="large" />
      </Card>
    </div>
  );
};