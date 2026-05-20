import React from 'react';
import { Card, Row, Col, Typography, Statistic } from 'antd';
import { 
  TeamOutlined, 
  MedicineBoxOutlined, 
  WalletOutlined, 
  ExperimentOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export const DashboardStats: React.FC = () => {
  // Dados simulados para estruturar a UI Enterprise (num cenário real, viriam de uma API)
  const stats = [
    {
      title: 'Pacientes em Atendimento',
      value: 142,
      trend: '+12%',
      trendUp: true,
      icon: <TeamOutlined style={{ fontSize: '20px', color: '#0284C7' }} />,
      bg: '#E0F2FE', // Light Blue
      borderColor: '#BAE6FD',
    },
    {
      title: 'Internações Ativas (Leitos)',
      value: 87,
      trend: '-3%',
      trendUp: false,
      icon: <MedicineBoxOutlined style={{ fontSize: '20px', color: '#0F766E' }} />,
      bg: '#CCFBF1', // Light Teal/Cyan
      borderColor: '#99F6E4',
    },
    {
      title: 'Exames em Processamento',
      value: 304,
      trend: '+24%',
      trendUp: true,
      icon: <ExperimentOutlined style={{ fontSize: '20px', color: '#D97706' }} />,
      bg: '#FEF3C7', // Light Amber
      borderColor: '#FDE68A',
    },
    {
      title: 'Faturamento Previsto (Mês)',
      value: 1245000.00,
      isCurrency: true,
      trend: '+8%',
      trendUp: true,
      icon: <WalletOutlined style={{ fontSize: '20px', color: '#059669' }} />,
      bg: '#D1FAE5', // Light Emerald
      borderColor: '#A7F3D0',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card 
            bordered={false} 
            bodyStyle={{ padding: '20px' }}
            style={{ 
              borderRadius: '6px', 
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
              background: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Text style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.title}
                </Text>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="tabular-nums" style={{ fontSize: '28px', fontWeight: 700, color: '#1E293B', lineHeight: 1 }}>
                    {stat.isCurrency 
                      ? stat.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) 
                      : stat.value}
                  </span>
                </div>
              </div>
              
              {/* Ícone com Fundo Semântico (Identidade Premium) */}
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '8px', 
                background: stat.bg, 
                border: `1px solid ${stat.borderColor}`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {stat.icon}
              </div>
            </div>

            {/* Indicador de Tendência (Trend) */}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: stat.trendUp ? '#059669' : '#DC2626', 
                background: stat.trendUp ? '#ECFDF5' : '#FEF2F2',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {stat.trendUp ? <ArrowUpOutlined style={{ marginRight: 4 }} /> : <ArrowDownOutlined style={{ marginRight: 4 }} />}
                {stat.trend}
              </span>
              <Text style={{ color: '#94A3B8', fontSize: '12px' }}>em relação ao dia anterior</Text>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};