import { useEffect, useState, useRef } from 'react';
import { Modal, Form, Select, Input, Button, message, Row, Col, Switch, Spin } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../../shared/services/api';

const schema = z.object({
  examId: z.string().min(1, 'Selecione um exame'),
  urgencia: z.enum(['ROTINA', 'URGENTE', 'EMERGENCIA']),
  isConvenio: z.boolean().default(false),
  cid10Id: z.string().optional(),
  observacoes: z.string().optional()
});

type ExamRequestFormData = z.infer<typeof schema>;

interface ExamRequestModalProps {
  visible: boolean;
  patientId: string;
  recordId: string;
  hospitalizationId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ExamRequestModal = ({ visible, patientId, recordId, hospitalizationId, onCancel, onSuccess }: ExamRequestModalProps) => {
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [cids, setCids] = useState<any[]>([]);
  const [fetchingCids, setFetchingCids] = useState(false);
  
  // Ref para controlar o debounce da pesquisa do CID-10
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<ExamRequestFormData>({
    resolver: zodResolver(schema),
    defaultValues: { urgencia: 'ROTINA', isConvenio: false }
  });

  const isConvenio = watch('isConvenio');

  useEffect(() => {
    if (visible) {
      reset();
      fetchExamsCatalog();
      fetchCids(''); // Traz as primeiras doenças recomendadas ao abrir
    }
  }, [visible, reset]);

  const fetchExamsCatalog = async () => {
    try {
      const examsRes = await api.get('/exams/catalog', { params: { limit: 500, status: 'ATIVO' } });
      setExams(examsRes.data?.data || examsRes.data || []);
    } catch (error) {
      message.error('Erro ao carregar catálogo de exames.');
    }
  };

  // 🔥 Motor de Busca Otimizado ligado à nossa rota legítima do DATASUS
  const fetchCids = async (search: string) => {
    setFetchingCids(true);
    try {
      const response = await api.get('/cid', {
        params: { search, page: 1, limit: 50 }
      });
      setCids(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Erro ao buscar CIDs para solicitação de exames:", error);
    } finally {
      setFetchingCids(false);
    }
  };

  // 🔥 Efeito Debounce para proteger o servidor contra requisições excessivas
  const handleSearchCid = (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchCids(value);
    }, 500);
  };

  const onSubmit = async (data: ExamRequestFormData) => {
    setLoading(true);
    try {
      // Blindagem defensiva de chaves estrangeiras nulas para o Postgres
      const safeCid = (data.cid10Id && data.cid10Id.trim() !== '') ? data.cid10Id : null;

      const payload = {
        medicalRecordId: recordId,
        patientId,
        hospitalizationId,
        examId: data.examId,
        urgencia: data.urgencia,
        isConvenio: data.isConvenio,
        cid10Id: safeCid,
        observacoes: data.observacoes,
      };

      await api.post('/exams/requests', payload);
      message.success('Exame solicitado com sucesso!');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao solicitar exame');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Nova Solicitação de Exame"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      okText="Solicitar Exame"
      cancelText="Cancelar"
      destroyOnClose
      width={700}
      okButtonProps={{ style: { background: '#0F766E', borderColor: '#0F766E' } }}
    >
      <Form layout="vertical" style={{ marginTop: '16px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item label="Exame" required validateStatus={errors.examId ? 'error' : ''} help={errors.examId?.message}>
              <Controller name="examId" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione o exame no catálogo">
                  {exams.map((e: any) => <Select.Option key={e.id} value={e.id}>{e.codigoTUSS ? `[${e.codigoTUSS}] ` : ''}{e.nome}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Urgência" required>
              <Controller name="urgencia" control={control} render={({ field }) => (
                <Select {...field}>
                  <Select.Option value="ROTINA">Rotina</Select.Option>
                  <Select.Option value="URGENTE">Urgente</Select.Option>
                  <Select.Option value="EMERGENCIA">Emergência</Select.Option>
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} align="middle">
          <Col span={6}>
            <Form.Item label="Via Convênio?" style={{ marginBottom: '24px' }}>
              <Controller name="isConvenio" control={control} render={({ field: { value, onChange } }) => (
                <Switch checked={value} onChange={onChange} checkedChildren="Sim" unCheckedChildren="Não" />
              )} />
            </Form.Item>
          </Col>
          <Col span={18}>
            {/* 🔥 CAMPO ATUALIZADO COM CAPACIDADE PARA 14.229 REGISTROS */}
            <Form.Item label="CID-10 Justificativo" required={isConvenio} validateStatus={errors.cid10Id ? 'error' : ''} help={errors.cid10Id?.message}>
              <Controller name="cid10Id" control={control} render={({ field }) => (
                <Select 
                  {...field} 
                  showSearch 
                  filterOption={false}
                  onSearch={handleSearchCid}
                  notFoundContent={fetchingCids ? <Spin size="small" /> : null}
                  placeholder="Digite o código (ex: A00) ou a doença (ex: Cólera)..." 
                  allowClear
                >
                  {cids.map((c: any) => (
                    <Select.Option key={c.id} value={c.id}>
                      <strong style={{ color: '#0F766E' }}>{c.codigo}</strong> - {c.descricao}
                    </Select.Option>
                  ))}
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Observações Clínicas / Indicação">
          <Controller name="observacoes" control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={3} placeholder="Informações relevantes para o laboratório ou setor de imagem..." />
          )} />
        </Form.Item>
      </Form>
    </Modal>
  );
};