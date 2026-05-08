import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Modal, Form, Input, message, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';

const { Title } = Typography;

export const SpecialtiesListPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchSpecialties = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/specialties', { params: { limit: 1000 } });
      const rawData = response.data?.data || response.data || [];
      setData(Array.isArray(rawData) ? rawData : []);
    } catch (error) {
      message.error('Erro ao carregar especialidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Excluir Especialidade',
      content: 'Tem certeza? Profissionais vinculados a esta especialidade podem perder a referência.',
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/specialties/${id}`);
          message.success('Especialidade excluída com sucesso!');
          fetchSpecialties();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Erro ao excluir especialidade.');
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingId) {
        await api.patch(`/specialties/${editingId}`, values);
        message.success('Especialidade atualizada!');
      } else {
        await api.post('/specialties', values);
        message.success('Especialidade cadastrada com sucesso!');
      }
      
      setIsModalOpen(false);
      fetchSpecialties();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || 'Erro ao salvar especialidade.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Nome da Especialidade',
      dataIndex: 'nome',
      key: 'nome',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Código CBO-S (Opcional)',
      dataIndex: 'codigoCBOS',
      key: 'codigoCBOS',
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (rec: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(rec)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(rec.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Catálogo de Especialidades Médicas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Nova Especialidade
        </Button>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      <Modal
        title={editingId ? 'Editar Especialidade' : 'Nova Especialidade'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item 
            name="nome" 
            label="Nome da Especialidade" 
            rules={[{ required: true, message: 'O nome é obrigatório' }]}
          >
            <Input placeholder="Ex: Cardiologia, Pediatria, Ortopedia..." size="large" />
          </Form.Item>
          
          <Form.Item 
            name="codigoCBOS" 
            label="Código CBO-S (Saúde)" 
            tooltip="Código Brasileiro de Ocupações em Saúde, usado para faturamento TISS."
          >
            <Input placeholder="Ex: 2251-20" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};