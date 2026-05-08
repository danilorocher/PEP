import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Typography, Button, Tag, Space, message, Tooltip, Modal, Form, Input, Select } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;
const { Option } = Select;

export const DoctorWorklistPage = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para o Modal de Finalização (Fase 4)
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [cids, setCids] = useState<any[]>([]);
  const [form] = Form.useForm();
  
  const navigate = useNavigate();

  const fetchWorklist = useCallback(async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const res = await api.get('/appointments', {
        params: {
          dataInicial: hoje.toISOString(),
          dataFinal: amanha.toISOString(),
          limit: 100
        }
      });

      // 🔥 CORREÇÃO: Filtramos para mostrar tanto quem aguarda (CONFIRMADO) quanto quem está na sala
      const worklist = (res.data?.data || res.data || []).filter((appt: any) => 
        ['CONFIRMADO', 'EM_ATENDIMENTO'].includes(appt.status) // Ajustado para 'CONFIRMADO'
      );

      setAppointments(worklist);
    } catch (error) {
      message.error('Erro ao carregar a fila de pacientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCids = async () => {
    try {
      // Caso tenha uma rota de CIDs, busque aqui. Usaremos um mock para segurança caso não tenha.
      const res = await api.get('/cid10').catch(() => ({ data: [] }));
      setCids(res.data?.data || res.data || []);
    } catch (error) {
      console.warn('Catálogo CID-10 não carregado.');
    }
  };

  useEffect(() => {
    fetchWorklist();
    fetchCids();
    const interval = setInterval(fetchWorklist, 60000);
    return () => clearInterval(interval);
  }, [fetchWorklist]);

  // 🔥 AÇÃO 1: INICIAR O ATENDIMENTO
  const handleStartAttendance = async (id: string, patientId: string) => {
    try {
      await api.patch(`/appointments/${id}/start`);
      message.success('Atendimento iniciado! O status na recepção foi atualizado.');
      fetchWorklist();
      navigate(`/medical-records/${patientId}`);
    } catch (error) {
      message.error('Erro ao iniciar o atendimento.');
    }
  };

  // 🔥 AÇÃO 2: ABRIR MODAL DE FINALIZAÇÃO
  const openFinishModal = (id: string) => {
    setSelectedApptId(id);
    setIsFinishModalOpen(true);
  };

  // 🔥 AÇÃO 3: CONFIRMAR FINALIZAÇÃO (REALIZADO)
  const handleFinishAttendance = async (values: any) => {
    if (!selectedApptId) return;
    try {
      // Envia o comando para o backend com o CID opcional/obrigatório
      await api.patch(`/appointments/${selectedApptId}/finish`, {
        cid10Id: values.cid10Id,
        observacoes: values.observacoes
      });
      message.success('Atendimento concluído com sucesso!');
      setIsFinishModalOpen(false);
      form.resetFields();
      fetchWorklist(); // Paciente sumirá da fila do médico e ficará 'REALIZADO' na Recepção
    } catch (error) {
      message.error('Erro ao finalizar o atendimento.');
    }
  };

  const columns = [
    {
      title: 'Horário',
      dataIndex: 'dataHora',
      key: 'dataHora',
      render: (text: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <Text strong>{dayjs(text).format('HH:mm')}</Text>
        </Space>
      ),
      width: 120,
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'EM_ATENDIMENTO' ? 'orange' : 'cyan'}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 200,
      render: (_: any, record: any) => {
        // 🔥 CORREÇÃO: Atualizado de AGUARDANDO_ATENDIMENTO para CONFIRMADO
        if (record.status === 'CONFIRMADO') { 
          return (
            <Tooltip title="Chamar paciente e abrir prontuário">
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStartAttendance(record.id, record.patientId)}>
                Atender
              </Button>
            </Tooltip>
          );
        }
        
        if (record.status === 'EM_ATENDIMENTO') {
          return (
            <Tooltip title="Concluir o atendimento médico">
              <Button type="primary" success icon={<CheckCircleOutlined />} onClick={() => openFinishModal(record.id)} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                Finalizar
              </Button>
            </Tooltip>
          );
        }
      },
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Minha Fila de Atendimento</Title>
        <Text type="secondary">Gerencie os pacientes que estão na recepção e os que já estão em sua sala.</Text>
      </Space>

      <Card bodyStyle={{ padding: 0 }} loading={loading}>
        <Table columns={columns} dataSource={appointments} rowKey="id" pagination={false} locale={{ emptyText: 'Nenhum paciente na fila.' }} />
      </Card>

      {/* MODAL DE FINALIZAÇÃO */}
      <Modal
        title="Finalizar Atendimento"
        open={isFinishModalOpen}
        onCancel={() => { setIsFinishModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Concluir Atendimento"
        cancelText="Cancelar"
        okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleFinishAttendance}>
          <Form.Item name="cid10Id" label="Diagnóstico Principal (CID-10)">
            <Select showSearch placeholder="Busque pelo código ou nome do CID" allowClear>
              {cids.map(cid => (
                <Option key={cid.id} value={cid.id}>{cid.codigo} - {cid.descricao}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="observacoes" label="Resumo Clínico / Observações Internas">
            <Input.TextArea rows={4} placeholder="Breve resumo da conduta ou anotações para a recepção..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};