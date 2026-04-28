import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SolutionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/api';
import { PatientFilters } from '../../components/PatientFilters';

const { Title } = Typography;

export const PatientListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});

  const fetchPatients = useCallback(async (page = 1, pageSize = 10, currentFilters = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/patients', {
        params: {
          page,
          limit: pageSize,
          ...currentFilters,
        },
      });
      // Tratamento seguro para diferentes formatos de resposta
      const patientList = response.data?.data || response.data || [];
      const totalCount = response.data?.total || patientList.length || 0;

      setData(Array.isArray(patientList) ? patientList : []);
      setPagination({
        current: page,
        pageSize,
        total: totalCount,
      });
    } catch (error) {
      message.error('Erro ao carregar lista de pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleTableChange = (newPagination: any) => {
    fetchPatients(newPagination.current, newPagination.pageSize, filters);
  };

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    fetchPatients(1, pagination.pageSize, newFilters);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Excluir Paciente',
      content: 'Tem certeza que deseja inativar este paciente? Esta ação não pode ser desfeita se houver internações ativas.',
      okText: 'Confirmar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/patients/${id}`);
          message.success('Paciente inativado com sucesso');
          fetchPatients(pagination.current, pagination.pageSize, filters);
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Erro ao excluir paciente');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Nome Completo',
      dataIndex: 'nomeCompleto',
      key: 'nomeCompleto',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 'bold' }}>{text}</span>
          <small style={{ color: '#8c8c8c' }}>CPF: {record.cpf || 'Não informado'}</small>
        </Space>
      ),
    },
    {
      title: 'Convênio',
      dataIndex: 'convenioId',
      key: 'convenioId',
      render: (id: string) => id ? <Tag color="blue">Particular/Convênio</Tag> : <Tag color="green">SUS</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: any = { ATIVO: 'success', INATIVO: 'error', OBITO: 'default' };
        return <Tag color={colors[status] || 'default'}>{status || 'ATIVO'}</Tag>;
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<SolutionOutlined />} 
            onClick={() => navigate(`/medical-records/${record.id}`)}
            title="Acessar Prontuário"
          />
          {/* Botões liberados das tags Can */}
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/patients/edit/${record.id}`)} 
          />
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)} 
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Gestão de Pacientes</Title>
        {/* Botão Novo Paciente liberado */}
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/patients/new')}>
          Novo Paciente
        </Button>
      </div>

      <PatientFilters onSearch={handleSearch} onClear={() => handleSearch({})} loading={loading} />

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
};