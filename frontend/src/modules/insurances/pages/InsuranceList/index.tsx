import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Typography, Button, Tag, Space, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { api } from '../../../../shared/services/api';

const { Title, Text } = Typography;

export const InsuranceList: React.FC = () => {
  const [insurances, setInsurances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 🔥 Uso 100% nativo do Ant Design, sem react-hook-form para evitar conflitos!
  const [form] = Form.useForm();

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/insurances');
      setInsurances(response.data);
    } catch (error) {
      message.error('Erro ao buscar a lista de convênios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsurances();
  }, [fetchInsurances]);

  const openModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      if (editingId) {
        await api.patch(`/insurances/${editingId}`, values);
        message.success('Convênio atualizado com sucesso!');
      } else {
        await api.post('/insurances', values);
        message.success('Novo convênio cadastrado com sucesso!');
      }
      closeModal();
      fetchInsurances();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar o convênio.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Tem certeza que deseja inativar este Convênio?',
      content: 'Isto não apagará os guias já faturados, mas impedirá novas utilizações.',
      okText: 'Sim, Inativar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/insurances/${id}`);
          message.success('Convênio inativado com sucesso.');
          fetchInsurances();
        } catch (error) {
          message.error('Erro ao inativar convênio.');
        }
      }
    });
  };

  const columns = [
    {
      title: 'NOME DO CONVÊNIO / PLANO',
      dataIndex: 'nome',
      key: 'nome',
      render: (text: string) => <Text strong style={{ color: '#1E293B' }}>{text}</Text>
    },
    {
      title: 'REGISTRO ANS',
      dataIndex: 'registroANS',
      key: 'registroANS',
      render: (text: string) => <Text style={{ color: '#64748B' }}>{text || 'N/A'}</Text>
    },
    {
      title: 'TIPO',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => {
        const colors: any = {
          PLANO_SAUDE: 'blue',
          CONVENIO: 'cyan',
          PARTICULAR: 'purple',
          SUS: 'green'
        };
        return <Tag color={colors[tipo] || 'default'}>{tipo.replace('_', ' ')}</Tag>;
      }
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ATIVO' ? 'success' : 'error'}>{status}</Tag>
      )
    },
    {
      title: 'AÇÕES',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(record)} style={{ color: '#0F766E' }} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SafetyCertificateOutlined style={{ color: '#0F766E' }} />
            Convênios e Planos de Saúde
          </Title>
          <Text style={{ color: '#64748B', fontSize: '14px' }}>
            Gerenciamento das operadoras de saúde aceites na instituição.
          </Text>
        </div>
        
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ background: '#0F766E' }}>
          Novo Convênio
        </Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={insurances} 
          rowKey="id" 
          loading={loading}
          size="middle"
          pagination={false}
        />
      </Card>

      {/* MODAL DE CADASTRO */}
      <Modal
        title={editingId ? "Editar Convênio" : "Cadastrar Novo Convênio"}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Salvar Registro"
        cancelText="Cancelar"
        okButtonProps={{ style: { background: '#0F766E' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false} style={{ marginTop: '20px' }}>
          <Form.Item name="nome" label="Nome do Convênio / Operadora" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <Input placeholder="Ex: Unimed Nacional" />
          </Form.Item>
          
          <Form.Item name="tipo" label="Categoria / Tipo de Faturamento" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <Select placeholder="Selecione o tipo...">
              <Select.Option value="PLANO_SAUDE">Plano de Saúde (TISS/TUSS)</Select.Option>
              <Select.Option value="CONVENIO">Convênio Empresarial</Select.Option>
              <Select.Option value="PARTICULAR">Tabela Particular</Select.Option>
              <Select.Option value="SUS">Sistema Único de Saúde (AIH/BPA)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="registroANS" label="Código de Registro na ANS">
            <Input placeholder="000000" />
          </Form.Item>

          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="telefone" label="Telefone de Contato" style={{ width: '100%' }}>
              <Input placeholder="(00) 0000-0000" />
            </Form.Item>
            <Form.Item name="email" label="E-mail de Faturamento" style={{ width: '100%' }}>
              <Input placeholder="faturamento@convenio.com" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};