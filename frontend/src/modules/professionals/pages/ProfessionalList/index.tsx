import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/api';
// 🔥 NOVO: Importação do Drawer de permissões
import { PermissionsDrawer } from '../../components/PermissionsDrawer';

const { Title, Text } = Typography;

export const ProfessionalListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // 🔥 NOVO: Controle de estado do Drawer de permissões
  const [drawer, setDrawer] = useState({ open: false, roleId: '', name: '' });

  const fetchProfessionals = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await api.get('/professionals', {
        params: { page, limit: pageSize },
      }).catch(err => {
        console.error('Aviso: Rota de profissionais falhou ou não existe', err.message);
        return { data: { data: [], total: 0 } }; // Shield contra tela branca
      });

      const listData = response.data?.data || response.data || [];
      const totalCount = response.data?.total || listData.length || 0;

      setData(Array.isArray(listData) ? listData : []);
      setPagination({ current: page, pageSize, total: totalCount });
    } catch (error) {
      console.error(error);
      message.error('Erro ao carregar lista de profissionais');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Inativar Profissional',
      content: 'Tem certeza que deseja inativar este colaborador?',
      okText: 'Confirmar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/professionals/${id}`);
          message.success('Profissional inativado com sucesso');
          fetchProfessionals(pagination.current, pagination.pageSize);
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Erro ao inativar profissional');
        }
      },
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MEDICO': return 'blue';
      case 'ENFERMEIRO': return 'cyan';
      case 'TECNICO_ENFERMAGEM': return 'geekblue';
      case 'RECEPCIONISTA': return 'purple';
      case 'ADMINISTRATIVO': return 'magenta';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Colaborador',
      key: 'nome',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.nomeCompleto || 'Nome não informado'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>CPF: {rec.cpf || '---'}</Text>
        </Space>
      ),
    },
    {
      title: 'Cargo / Função',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (val: string) => <Tag color={getRoleColor(val)}>{val ? val.replace('_', ' ') : 'N/A'}</Tag>,
    },
    {
      title: 'Registro / Especialidade',
      key: 'registro',
      render: (rec: any) => {
        if (rec.tipo === 'MEDICO') return `CRM: ${rec.registroConselho || '---'} - ${rec.especialidade?.nome || 'Geral'}`;
        if (['ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(rec.tipo)) return `COREN: ${rec.registroConselho || '---'}`;
        if (rec.registroConselho) return `${rec.registroConselho} - ${rec.ufConselho || ''}`;
        return '---';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={val === 'INATIVO' ? 'error' : 'success'}>{val || 'ATIVO'}</Tag>,
    },
    // 🔥 NOVA COLUNA: Indica visualmente se o usuário tem login ativo no sistema
    {
      title: 'Acesso ao Sistema',
      key: 'acesso',
      align: 'center' as const,
      render: (rec: any) => rec.userId
        ? <Tag color="green">ATIVO</Tag>
        : <Tag color="default">SEM ACESSO</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (rec: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/professionals/edit/${rec.id}`)} 
          />
          
          {/* 🔥 NOVO BOTÃO: Gerir permissões isoladamente */}
          <Button 
            size="small" 
            icon={<SafetyCertificateOutlined />} 
            disabled={!rec.userId}
            title={rec.userId ? 'Gerir Permissões' : 'Este utilizador não possui acesso ao sistema'}
            onClick={() => setDrawer({ open: true, roleId: rec.user?.roleId, name: rec.nomeCompleto })}
          />

          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(rec.id)} 
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Gestão de Equipe</Title>
        
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/professionals/new')}>
          Novo Colaborador
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={(newPagination: any) => fetchProfessionals(newPagination.current, newPagination.pageSize)}
      />

      {/* 🔥 NOVO: Componente do Drawer que será aberto ao clicar no ícone de certificado */}
      <PermissionsDrawer 
        open={drawer.open}
        roleId={drawer.roleId}
        userName={drawer.name}
        onClose={() => setDrawer({ ...drawer, open: false })}
        onSaved={() => fetchProfessionals(pagination.current, pagination.pageSize)}
      />
    </div>
  );
};