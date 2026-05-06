import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Card, Select, DatePicker, Tooltip } from 'antd';
import { ReloadOutlined, FileSearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;

export const ExamListPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const fetchExams = useCallback(async (page = 1, pageSize = 10, status = '', date = dayjs()) => {
    setLoading(true);
    try {
      const response = await api.get('/exams/requests', {
        params: {
          page,
          limit: pageSize,
          status: status || undefined,
          dataInicial: date.startOf('day').toISOString(),
          dataFinal: date.endOf('day').toISOString()
        },
      }).catch(() => {
        return { data: { data: [], total: 0 } }; 
      });

      const examList = response.data?.data || response.data || [];
      const totalCount = response.data?.meta?.total || response.data?.total || examList.length || 0;

      setData(Array.isArray(examList) ? examList : []);
      setPagination({ current: page, pageSize, total: totalCount });
    } catch (error) {
      message.error('Erro ao carregar lista de exames');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams(1, pagination.pageSize, statusFilter, selectedDate);
  }, [fetchExams, statusFilter, selectedDate]);

  // 🔥 A MÁGICA 1: Função que chama o Backend quando alteramos o Dropdown
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/exams/requests/${id}/status`, { status: newStatus });
      message.success('Status do exame atualizado com sucesso!');
      fetchExams(pagination.current, pagination.pageSize, statusFilter, selectedDate);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao atualizar status do exame.');
    }
  };

  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'dataHoraSolicitacao',
      key: 'date',
      render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '---',
      width: 150,
    },
    {
      title: 'Paciente / Local',
      key: 'patient',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.patient?.nomeCompleto || 'Paciente não identificado'}</Text>
          {/* 🔥 A MÁGICA 2: Mostrando Ala e Leito se internado, ou Ambulatorial */}
          {rec.hospitalization ? (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Ala: {rec.hospitalization.ward?.nome} | Leito {rec.hospitalization.bed?.numero}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>Atendimento Ambulatorial</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Exame / Procedimento',
      key: 'exam',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.exam?.nome || 'Procedimento não especificado'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>Solicitado por: {rec.doctor?.nomeCompleto || 'Médico da Unidade'}</Text>
        </Space>
      )
    },
    {
      title: 'Urgência',
      dataIndex: 'urgencia',
      key: 'urgencia',
      render: (val: string) => <Tag color={val === 'EMERGENCIA' ? 'red' : val === 'URGENTE' ? 'orange' : 'default'}>{val}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      // 🔥 A MÁGICA 3: Dropdown clicável na própria tabela
      render: (val: string, rec: any) => (
        <Select 
          value={val} 
          style={{ width: 140 }}
          onChange={(newStatus) => handleStatusChange(rec.id, newStatus)}
        >
          <Select.Option value="SOLICITADO">Aguardando</Select.Option>
          <Select.Option value="EM_ANALISE">Em Execução</Select.Option>
          <Select.Option value="CONCLUIDO">Concluído</Select.Option>
          <Select.Option value="CANCELADO">Cancelado</Select.Option>
        </Select>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (rec: any) => (
        <Space>
          {/* 🔥 A MÁGICA 4: Botão só aparece se o status for Concluído */}
          {['CONCLUIDO', 'LAUDO_LIBERADO'].includes(rec.status) && (
            <Tooltip title="Visualizar Laudo do Exame">
              <Button size="small" type="primary" icon={<FileSearchOutlined />} onClick={() => message.info('Módulo de PDF em desenvolvimento')}>Ver Laudo</Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Exames Solicitados</Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Período de Solicitação</Text>
            <DatePicker 
              value={selectedDate} 
              onChange={(date) => setSelectedDate(date || dayjs())} 
              format="DD/MM/YYYY" 
              allowClear={false}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Filtro de Status</Text>
            <Select 
              value={statusFilter} 
              onChange={setStatusFilter} 
              style={{ width: 200 }}
              options={[
                { value: '', label: 'Todos os Status' },
                { value: 'SOLICITADO', label: 'Aguardando' },
                { value: 'EM_ANALISE', label: 'Em Execução' },
                { value: 'CONCLUIDO', label: 'Concluídos' },
                { value: 'CANCELADO', label: 'Cancelados' },
              ]}
            />
          </div>
          <Button 
            style={{ marginTop: 22 }} 
            icon={<ReloadOutlined />} 
            onClick={() => fetchExams(pagination.current, pagination.pageSize, statusFilter, selectedDate)}
          >
            Atualizar
          </Button>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table 
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} exames`
          }}
          onChange={(p: any) => fetchExams(p.current, p.pageSize, statusFilter, selectedDate)}
        />
      </Card>
    </div>
  );
};