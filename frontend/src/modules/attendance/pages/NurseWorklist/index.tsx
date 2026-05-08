import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Typography, Button, Tag, Space, message, Tooltip } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, UserOutlined, HeartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;

export const NurseWorklistPage = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchWorklist = useCallback(async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      // 🔥 CORREÇÃO: Busca os agendamentos sem filtrar direto na query string para evitar erro do Prisma
      const res = await api.get('/appointments', {
        params: {
          dataInicial: hoje.toISOString(),
          dataFinal: amanha.toISOString(),
          limit: 100 // Segurança de paginação
        }
      });

      // 🔥 CORREÇÃO: Filtramos no Frontend utilizando o status correto do Banco ('CONFIRMADO' = Aguardando)
      const worklist = (res.data?.data || res.data || []).filter((appt: any) => 
        ['CONFIRMADO'].includes(appt.status)
      );

      setAppointments(worklist);
    } catch (error: any) {
      console.error("Erro na API de Enfermagem:", error);
      message.error('Erro ao carregar a fila de enfermagem.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorklist();
    const interval = setInterval(fetchWorklist, 60000); // Atualiza a cada 1 minuto
    return () => clearInterval(interval);
  }, [fetchWorklist]);

  const handleStartTriage = async (id: string, patientId: string) => {
    try {
      // Inicia o atendimento na perspectiva do sistema (Muda para EM_ATENDIMENTO)
      await api.patch(`/appointments/${id}/start`);
      message.success('Triagem iniciada com sucesso!');
      
      // Redireciona o enfermeiro para a área do paciente
      navigate(`/medical-records/${patientId}`);
    } catch (error) {
      message.error('Erro ao iniciar a triagem.');
    }
  };

  const columns = [
    {
      title: 'Horário Agendado',
      dataIndex: 'dataHora',
      key: 'dataHora',
      render: (text: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#13c2c2' }} />
          <Text strong>{dayjs(text).format('HH:mm')}</Text>
        </Space>
      ),
      width: 150,
    },
    {
      title: 'Paciente',
      dataIndex: ['patient', 'nomeCompleto'],
      key: 'paciente',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{text || 'Paciente não identificado'}</Text>
        </Space>
      ),
    },
    {
      title: 'Especialidade Alvo',
      dataIndex: ['specialty', 'nome'],
      key: 'especialidade',
      render: (text: string) => <Tag color="cyan">{text || 'Geral'}</Tag>,
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 250,
      render: (_: any, record: any) => (
        <Tooltip title="Realizar triagem e sinais vitais">
          <Button 
            type="primary" 
            style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
            icon={<HeartOutlined />} 
            onClick={() => handleStartTriage(record.id, record.patientId)}
          >
            Realizar Triagem
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Fila de Enfermagem (Triagem)</Title>
        <Text type="secondary">
          Pacientes aguardando avaliação inicial (Status: Confirmado na Recepção).
        </Text>
      </Space>

      <Card bodyStyle={{ padding: 0 }} loading={loading}>
        <Table 
          columns={columns} 
          dataSource={appointments} 
          rowKey="id" 
          pagination={false}
          locale={{ emptyText: 'Nenhum paciente aguardando triagem no momento.' }}
        />
      </Card>
    </div>
  );
};