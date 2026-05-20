import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import { DashboardStats } from '../../components/DashboardStats';
import { OccupancyChart } from '../../components/OccupancyChart';
import { useAuthStore } from '../../../../store/useAuthStore';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  // 🔥 SOLUÇÃO: Dados simulados (Mock) injetados para evitar a tela branca e dar vida ao gráfico
  const mockOccupancyData = [
    { ala: 'UTI Geral', totalLeitos: 20, ocupados: 19, taxa: '95' },
    { ala: 'UTI Pediátrica', totalLeitos: 10, ocupados: 8, taxa: '80' },
    { ala: 'Cardiologia', totalLeitos: 15, ocupados: 11, taxa: '73' },
    { ala: 'Maternidade', totalLeitos: 30, ocupados: 12, taxa: '40' },
    { ala: 'Enfermaria Cirúrgica', totalLeitos: 40, ocupados: 35, taxa: '87' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Cabeçalho da Central de Comando */}
      <div>
        <Title level={3} style={{ margin: 0, color: '#1E293B', fontWeight: 700 }}>
          Visão Geral Operacional
        </Title>
        <Text style={{ color: '#64748B', fontSize: '14px' }}>
          Bem-vindo(a), <strong style={{ color: '#334155' }}>{user?.nome || 'Profissional'}</strong>. Aqui está o resumo em tempo real da unidade hospitalar.
        </Text>
      </div>

      {/* Nível 1: Telemetria Crítica (Cards) */}
      <DashboardStats />

      {/* Nível 2: Painéis Analíticos e Gráficos */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* 🔥 CORREÇÃO: Passamos a propriedade 'data' obrigatória para o gráfico não quebrar */}
          <OccupancyChart data={mockOccupancyData} />
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={<span style={{ color: '#1E293B', fontWeight: 600, fontSize: '15px' }}>Atividades Recentes</span>}
            bordered={false} 
            style={{ borderRadius: '6px', border: '1px solid #E2E8F0', height: '100%', marginTop: '24px' }}
            headStyle={{ borderBottom: '1px solid #F1F5F9', padding: '0 20px', minHeight: '48px' }}
            bodyStyle={{ padding: '0' }}
          >
            {/* Exemplo de Lista de Eventos Clínicos de Alta Densidade */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { time: '10:42', action: 'Nova Admissão (UTI Geral)', user: 'Dr. Roberto M.' },
                { time: '10:28', action: 'Alta Médica Registrada', user: 'Dra. Carla T.' },
                { time: '09:55', action: 'Guia TISS Faturada', user: 'Faturamento' },
                { time: '09:12', action: 'Cirurgia Ortopédica Finalizada', user: 'Centro Cirúrgico' },
                { time: '08:30', action: 'Troca de Plantão Registrada', user: 'Enfermagem' }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '12px 20px', 
                  borderBottom: idx !== 4 ? '1px solid #F1F5F9' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <Text strong style={{ display: 'block', color: '#334155', fontSize: '13px' }}>{item.action}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: '12px' }}>{item.user}</Text>
                  </div>
                  <Text style={{ color: '#64748B', fontSize: '12px', fontWeight: 500 }}>{item.time}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

    </div>
  );
};