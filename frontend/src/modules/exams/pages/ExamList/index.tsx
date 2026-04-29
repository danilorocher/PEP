import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, message, Card, Select, DatePicker, Tooltip } from 'antd';
import { PlusOutlined, ReloadOutlined, FileSearchOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
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
      const response = await api.get('/exam-requests', {
        params: {
          page,
          limit: pageSize,
          status: status || undefined,
          dataInicial: date.startOf('day').toISOString(),
          dataFinal: date.endOf('day').toISOString()
        },
      }).catch(err => {
        console.error('Aviso: Rota de exames falhou ou ainda nÃ£o existe:', err.message);
        return { data: { data: [], total: 0 } }; // Fallback seguro
      });

      const examList = response.data?.data || response.data || [];
      const totalCount = response.data?.total || examList.length || 0;

      setData(Array.isArray(examList) ? examList : []);
      setPagination({ current: page, pageSize, total: totalCount });
    } catch (error) {
      console.error(error);
      message.error('Erro ao carregar lista de exames');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams(1, pagination.pageSize, statusFilter, selectedDate);
  }, [fetchExams, statusFilter, selectedDate]);

  const getStatusTag = (status: string) => {
    const configs: any = {
      SOLICITADO: { color: 'blue', text: 'SOLICITADO', icon: <ClockCircleOutlined /> },
      COLETADO: { color: 'orange', text: 'COLETADO', icon: <ClockCircleOutlined /> },
      EM_ANALISE: { color: 'processing', text: 'EM ANÃLISE', icon: <ReloadOutlined spin /> },
      LAUDO_LIBERADO: { color: 'success', text: 'LAUDO LIBERADO', icon: <CheckCircleOutlined /> },
      CANCELADO: { color: 'error', text: 'CANCELADO', icon: <PlusOutlined style={{ rotate: '45deg' }} /> },
    };
    const config = configs[status] || { color: 'default', text: status || 'PENDENTE' };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'createdAt',
      key: 'date',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm'),
      width: 150,
    },
    {
      title: 'Paciente',
      key: 'patient',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.patient?.nomeCompleto || 'Paciente nÃ£o identificado'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>CPF: {rec.patient?.cpf || '---'}</Text>
        </Space>
      )
    },
    {
      title: 'Exame / Procedimento',
      key: 'exam',
      render: (rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{rec.procedimentoNome || rec.exameNome || 'Procedimento nÃ£o especificado'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>Solicitado por: {rec.solicitanteNome || 'MÃ©dico da Unidade'}</Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => getStatusTag(val)
    },
    {
      title: 'AÃ§Ãµes',
      key: 'actions',
      render: (rec: any) => (
        <Space>
          <Tooltip title="Ver Detalhes/Laudo">
            <Button size="small" icon={<FileSearchOutlined />} onClick={() => message.info('VisualizaÃ§Ã£o de laudo em desenvolvimento')} />
          </Tooltip>
          {rec.status === 'LAUDO_LIBERADO' && (
            <Button size="small" type="primary" ghost>Imprimir</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Central de Exames</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => message.warning('A solicitaÃ§Ã£o deve ser feita via ProntuÃ¡rio do Paciente')}>
          Nova SolicitaÃ§Ã£o
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>PerÃ­odo de SolicitaÃ§Ã£o</Text>
            <DatePicker 
              value={selectedDate} 
              onChange={(date) => setSelectedDate(date || dayjs())} 
              format="DD/MM/YYYY" 
              allowClear={false}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Status</Text>
            <Select 
              value={statusFilter} 
              onChange={setStatusFilter} 
              style={{ width: 200 }}
              options={[
                { value: '', label: 'Todos os Status' },
                { value: 'SOLICITADO', label: 'Solicitados' },
                { value: 'COLETADO', label: 'Coletados' },
                { value: 'EM_ANALISE', label: 'Em AnÃ¡lise' },
                { value: 'LAUDO_LIBERADO', label: 'Laudo Liberado' },
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
