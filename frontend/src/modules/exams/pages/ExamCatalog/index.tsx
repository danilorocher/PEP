import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Card, Select, Input, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { ExamCatalogModal } from '../../components/ExamCatalogModal';

const { Title } = Typography;

export const ExamCatalogPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  const fetchCatalog = useCallback(async (page = 1, pageSize = 10, currentSearch = '', currentTipo = '') => {
    setLoading(true);
    try {
      const response = await api.get('/exams/catalog', {
        params: { page, limit: pageSize, search: currentSearch, tipo: currentTipo },
      });

      const listData = response.data?.data || response.data || [];
      const totalCount = response.data?.total || listData.length || 0;

      setData(Array.isArray(listData) ? listData : []);
      setPagination({ current: page, pageSize, total: totalCount });
    } catch (error) {
      message.error('Erro ao carregar catálogo de exames');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog(1, pagination.pageSize, search, tipoFilter);
  }, [fetchCatalog, search, tipoFilter]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/exams/catalog/${id}`);
      message.success('Exame inativado com sucesso');
      fetchCatalog(pagination.current, pagination.pageSize, search, tipoFilter);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao inativar exame');
    }
  };

  const columns = [
    {
      title: 'Código TUSS',
      dataIndex: 'codigoTUSS',
      key: 'tuss',
      render: (val: string) => val || '---',
      width: 120,
    },
    {
      title: 'Nome do Exame',
      dataIndex: 'nome',
      key: 'nome',
      render: (val: string) => <strong>{val}</strong>,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (val: string) => {
        const colors: any = { LABORATORIAL: 'blue', IMAGEM: 'purple', FUNCIONAL: 'cyan', OUTRO: 'default' };
        return <Tag color={colors[val] || 'default'}>{val}</Tag>;
      },
    },
    {
      title: 'Preparo',
      dataIndex: 'preparacaoNecessaria',
      key: 'preparo',
      render: (val: string) => val || 'Nenhum preparo',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={val === 'ATIVO' ? 'green' : 'red'}>{val}</Tag>,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (rec: any) => (
        <Space>
          <Can module="exames" action="liberar">
            <Button size="small" icon={<EditOutlined />} onClick={() => { setSelectedExam(rec); setModalVisible(true); }}>Editar</Button>
            <Popconfirm title="Tem certeza que deseja inativar este exame?" onConfirm={() => handleDelete(rec.id)} okText="Sim" cancelText="Não">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Catálogo de Exames e Procedimentos</Title>
        <Can module="exames" action="liberar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedExam(null); setModalVisible(true); }}>
            Novo Exame
          </Button>
        </Can>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Input 
            placeholder="Buscar por nome ou código..." 
            prefix={<SearchOutlined />} 
            allowClear 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ width: 300 }} 
          />
          <Select 
            value={tipoFilter} 
            onChange={setTipoFilter} 
            style={{ width: 200 }}
            options={[
              { value: '', label: 'Todos os Tipos' },
              { value: 'LABORATORIAL', label: 'Laboratoriais' },
              { value: 'IMAGEM', label: 'Exames de Imagem' },
              { value: 'FUNCIONAL', label: 'Funcionais' },
            ]}
          />
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table 
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={{ ...pagination, showSizeChanger: true }}
          onChange={(p: any) => fetchCatalog(p.current, p.pageSize, search, tipoFilter)}
        />
      </Card>

      {modalVisible && (
        <ExamCatalogModal
          visible={modalVisible}
          initialValues={selectedExam}
          onCancel={() => setModalVisible(false)}
          onSuccess={() => { setModalVisible(false); fetchCatalog(pagination.current, pagination.pageSize, search, tipoFilter); }}
        />
      )}
    </div>
  );
};