import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Tag, message, Modal, Tabs, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';

const { Title } = Typography;

export const ProfessionalListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [activeTab, setActiveTab] = useState('doctors');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, nursesRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/nurses')
      ]);
      setDoctors(docsRes.data.data);
      setNurses(nursesRes.data.data);
    } catch (error) {
      message.error('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (type: 'doctor' | 'nurse', id: string) => {
    Modal.confirm({
      title: 'Remover Profissional',
      content: 'Deseja realmente inativar este profissional?',
      onOk: async () => {
        try {
          await api.delete(`/${type}s/${id}`);
          message.success('Profissional removido');
          fetchData();
        } catch (error) {
          message.error('Erro ao remover');
        }
      }
    });
  };

  const doctorColumns = [
    { title: 'Nome', dataIndex: 'nomeCompleto', key: 'name' },
    { title: 'CRM', dataIndex: 'crm', key: 'crm', render: (val: string, rec: any) => `${val}/${rec.ufCrm}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'ATIVO' ? 'green' : 'red'}>{s}</Tag> },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Can module="sistema" action="administrar">
            <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/professionals/doctor/edit/${record.id}`)} />
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete('doctor', record.id)} />
          </Can>
        </Space>
      )
    }
  ];

  const nurseColumns = [
    { title: 'Nome', dataIndex: 'nomeCompleto', key: 'name' },
    { title: 'COREN', dataIndex: 'coren', key: 'coren', render: (val: string, rec: any) => `${val}/${rec.ufCoren}` },
    { title: 'Categoria', dataIndex: 'categoria', key: 'cat' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'ATIVO' ? 'green' : 'red'}>{s}</Tag> },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Can module="sistema" action="administrar">
            <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/professionals/nurse/edit/${record.id}`)} />
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete('nurse', record.id)} />
          </Can>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Corpo Clínico</Title>
        <Can module="sistema" action="administrar">
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => navigate('/professionals/doctor/new')}>Novo Médico</Button>
            <Button icon={<PlusOutlined />} onClick={() => navigate('/professionals/nurse/new')}>Novo Enfermeiro</Button>
          </Space>
        </Can>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'doctors', label: 'Médicos', children: <Table rowKey="id" loading={loading} dataSource={doctors} columns={doctorColumns} /> },
          { key: 'nurses', label: 'Enfermagem', children: <Table rowKey="id" loading={loading} dataSource={nurses} columns={nurseColumns} /> }
        ]} />
      </Card>
    </div>
  );
};