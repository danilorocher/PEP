import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Modal, Form, Input, Select, message, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';

const { Title } = Typography;
const { Option } = Select;

export const OccupationsListPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchOccupations = useCallback(async () => {
    setLoading(true);
    try {
      // Bate no backend para buscar os cargos
      const response = await api.get('/occupations', { params: { limit: 1000 } }).catch(() => ({ data: { data: [] } }));
      const rawData = response.data?.data || response.data || [];
      setData(Array.isArray(rawData) ? rawData : []);
    } catch (error) {
      message.error('Erro ao carregar cargos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOccupations();
  }, [fetchOccupations]);

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
      title: 'Excluir Cargo',
      content: 'Tem certeza? Isso pode afetar os colaboradores vinculados a ele.',
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/occupations/${id}`);
          message.success('Cargo excluído com sucesso!');
          fetchOccupations();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Erro ao excluir cargo.');
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingId) {
        await api.patch(`/occupations/${editingId}`, values);
        message.success('Cargo atualizado!');
      } else {
        await api.post('/occupations', values);
        message.success('Cargo cadastrado com sucesso!');
      }
      
      setIsModalOpen(false);
      fetchOccupations();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || 'Erro ao salvar cargo.');
    } finally {
      setLoading(false);
    }
  };

  const getTipoBaseColor = (tipo: string) => {
    switch (tipo) {
      case 'MEDICO': return 'blue';
      case 'ENFERMEIRO': return 'cyan';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Nome do Cargo',
      dataIndex: 'nome',
      key: 'nome',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Tipo Base (Estrutura)',
      dataIndex: 'tipoBase',
      key: 'tipoBase',
      render: (text: string) => <Tag color={getTipoBaseColor(text)}>{text}</Tag>,
    },
    {
      title: 'CBO',
      dataIndex: 'codigoCBO',
      key: 'codigoCBO',
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
        <Title level={2}>Catálogo de Cargos (CBO)</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Novo Cargo
        </Button>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} />
      </Card>

      <Modal
        title={editingId ? 'Editar Cargo' : 'Novo Cargo'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="nome" label="Nome de Exibição do Cargo" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="Ex: Médico Cardiologista, Recepcionista Pleno..." size="large" />
          </Form.Item>
          
          <Form.Item name="tipoBase" label="Categoria do Sistema (Tipo Base)" rules={[{ required: true, message: 'Obrigatório' }]} tooltip="Isto define que tipo de permissões de saúde este cargo pode ter.">
            <Select size="large">
              <Option value="MEDICO">Médico (Pode prescrever)</Option>
              <Option value="ENFERMEIRO">Enfermagem (Pode administrar medicação)</Option>
              <Option value="ADMINISTRATIVO">Administrativo / Recepção / Outros</Option>
            </Select>
          </Form.Item>

          <Form.Item name="codigoCBO" label="Código CBO">
            <Input placeholder="Opcional" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};