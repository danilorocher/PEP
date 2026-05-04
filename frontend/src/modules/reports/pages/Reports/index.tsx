import { useState, useRef } from 'react';
import { Card, Form, Select, DatePicker, Button, Typography, message, Spin, Space, Table, Row, Col } from 'antd';
import { FileExcelOutlined, FileSyncOutlined, SearchOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const reportSchema = z.object({
  type: z.string().min(1, 'Selecione o tipo de relatório'),
  dateRange: z.any().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const startPolling = (jobId: string) => {
    setPolling(true);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/reports/${jobId}/status`);
        const { status, result } = response.data;

        if (status === 'COMPLETED') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setReportData(result);
          setPolling(false);
          message.success('Relatório processado com sucesso!');
        } else if (status === 'FAILED') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setPolling(false);
          message.error('Falha ao gerar o relatório.');
        }
      } catch (error) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setPolling(false);
        message.error('Erro ao verificar status do relatório.');
      }
    }, 3000); 
  };

  const onSubmit = async (data: ReportFormData) => {
    setLoading(true);
    setReportData(null);
    try {
      const payload: any = {
        type: data.type,
      };

      if (data.dateRange && data.dateRange.length === 2) {
        payload.startDate = data.dateRange[0].startOf('day').toISOString();
        payload.endDate = data.dateRange[1].endOf('day').toISOString();
      }

      const response = await api.post('/reports/generate', payload);
      
      if (response.data?.jobId) {
        message.info('Relatório em processamento. Aguarde...');
        startPolling(response.data.jobId);
      } else {
        setReportData(response.data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao solicitar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) {
      message.warning('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(reportData[0]).join(';');
    const rows = reportData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'object' && value !== null ? `"${JSON.stringify(value).replace(/"/g, '""')}"` : `"${value}"`
      ).join(';')
    );
    
    const csvContent = `${headers}\n${rows.join('\n')}`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateColumns = () => {
    if (!reportData || reportData.length === 0) return [];
    return Object.keys(reportData[0]).map(key => ({
      title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      dataIndex: key,
      key: key,
      render: (text: any) => typeof text === 'object' && text !== null ? JSON.stringify(text) : String(text || '-'),
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>Central de Relatórios</Title>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item label="Tipo de Relatório" required validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
                <Controller name="type" control={control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione o relatório">
                    <Select.Option value="PACIENTES_INTERNADOS">Pacientes Internados Atualmente</Select.Option>
                    <Select.Option value="TAXA_OCUPACAO_LEITOS">Taxa de Ocupação de Leitos</Select.Option>
                    <Select.Option value="PACIENTES_POR_ALA">Pacientes por Ala</Select.Option>
                    <Select.Option value="HISTORICO_MEDICAMENTOS">Histórico de Administração de Medicamentos</Select.Option>
                    <Select.Option value="ADMINISTRACAO_MEDICAMENTO_HORARIO">Estatísticas de Medicação por Horário</Select.Option>
                    <Select.Option value="EXAMES_REALIZADOS">Exames Realizados</Select.Option>
                    <Select.Option value="TEMPO_MEDIO_INTERNACAO">Tempo Médio de Internação</Select.Option>
                    <Select.Option value="AGENDA_DO_DIA">Agenda do Dia</Select.Option>
                    <Select.Option value="FATURAMENTO_POR_CONVENIO">Faturamento por Convênio</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item label="Período" validateStatus={errors.dateRange ? 'error' : ''}>
                <Controller name="dateRange" control={control} render={({ field }) => (
                  <RangePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" />
                )} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading || polling} block>
                Gerar
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {polling && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" indicator={<FileSyncOutlined spin style={{ fontSize: 48 }} />} />
          <Title level={4} style={{ marginTop: 24 }}>Processando grandes volumes de dados...</Title>
          <Text type="secondary">Esta operação ocorre em background. Aguarde.</Text>
        </Card>
      )}

      {!polling && reportData && (
        <Card 
          title="Resultado do Relatório" 
          extra={
            <Button type="primary" icon={<FileExcelOutlined />} onClick={exportToCSV} style={{ backgroundColor: '#52c41a' }}>
              Exportar CSV
            </Button>
          }
        >
          <Table 
            dataSource={reportData} 
            columns={generateColumns()} 
            rowKey={(record, index) => index?.toString() || Math.random().toString()}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};