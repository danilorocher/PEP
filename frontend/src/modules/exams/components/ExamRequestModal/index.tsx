import { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Button, message, Row, Col, Switch } from 'antd';
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

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<ExamRequestFormData>({
    resolver: zodResolver(schema),
    defaultValues: { urgencia: 'ROTINA', isConvenio: false }
  });

  const isConvenio = watch('isConvenio');

  useEffect(() => {
    if (visible) {
      reset();
      fetchAuxiliaryData();
    }
  }, [visible, reset]);

  const fetchAuxiliaryData = async () => {
    try {
      const [examsRes, cidsRes] = await Promise.all([
        api.get('/exams/catalog', { params: { limit: 500, status: 'ATIVO' } }),
        api.get('/admin/cid10').catch(() => ({ data: [] }))
      ]);
      setExams(examsRes.data?.data || examsRes.data || []);
      setCids(cidsRes.data || [{ id: 'CID-MOCK', codigo: 'Z00.0', descricao: 'Exame médico geral' }]);
    } catch (error) {
      message.error('Erro ao carregar catálogo de exames.');
    }
  };

  const onSubmit = async (data: ExamRequestFormData) => {
    setLoading(true);
    try {
      const payload = {
        medicalRecordId: recordId,
        patientId,
        hospitalizationId,
        examId: data.examId,
        urgencia: data.urgencia,
        isConvenio: data.isConvenio,
        cid10Id: data.cid10Id,
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
      okText="Solicitar"
      destroyOnClose
      width={700}
    >
      <Form layout="vertical">
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
            <Form.Item label="Via Convênio?">
              <Controller name="isConvenio" control={control} render={({ field: { value, onChange } }) => (
                <Switch checked={value} onChange={onChange} checkedChildren="Sim" unCheckedChildren="Não" />
              )} />
            </Form.Item>
          </Col>
          <Col span={18}>
            <Form.Item label="CID-10 Justificativo" required={isConvenio} validateStatus={errors.cid10Id ? 'error' : ''} help={errors.cid10Id?.message}>
              <Controller name="cid10Id" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Obrigatório para convênios" allowClear>
                  {cids.map((c: any) => <Select.Option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</Select.Option>)}
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