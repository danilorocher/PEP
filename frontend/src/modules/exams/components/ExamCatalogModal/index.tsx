import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../../shared/services/api';

const schema = z.object({
  nome: z.string().min(3, 'O nome do exame é obrigatório'),
  tipo: z.enum(['LABORATORIAL', 'IMAGEM', 'FUNCIONAL', 'OUTRO'], { required_error: 'Selecione o tipo' }),
  codigoTUSS: z.string().optional(),
  codigoInterno: z.string().optional(),
  tempoMedioResultado: z.number().optional(),
  preparacaoNecessaria: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
});

type ExamCatalogFormData = z.infer<typeof schema>;

interface ExamCatalogModalProps {
  visible: boolean;
  initialValues?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ExamCatalogModal = ({ visible, initialValues, onCancel, onSuccess }: ExamCatalogModalProps) => {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExamCatalogFormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ATIVO', tipo: 'LABORATORIAL' }
  });

  const isEdit = !!initialValues;

  useEffect(() => {
    if (visible) {
      reset(initialValues || { status: 'ATIVO', tipo: 'LABORATORIAL' });
    }
  }, [visible, initialValues, reset]);

  const onSubmit = async (data: ExamCatalogFormData) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/exams/catalog/${initialValues.id}`, data);
        message.success('Exame atualizado no catálogo com sucesso!');
      } else {
        await api.post('/exams/catalog', data);
        message.success('Exame adicionado ao catálogo com sucesso!');
      }
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar o exame no catálogo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar Exame no Catálogo' : 'Novo Exame no Catálogo'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      okText="Salvar Exame"
      destroyOnClose
      width={700}
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item label="Nome do Exame" required validateStatus={errors.nome ? 'error' : ''} help={errors.nome?.message}>
              <Controller name="nome" control={control} render={({ field }) => (
                <Input {...field} placeholder="Ex: Hemograma Completo, Raio-X de Tórax" />
              )} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Tipo" required validateStatus={errors.tipo ? 'error' : ''} help={errors.tipo?.message}>
              <Controller name="tipo" control={control} render={({ field }) => (
                <Select {...field}>
                  <Select.Option value="LABORATORIAL">Laboratorial</Select.Option>
                  <Select.Option value="IMAGEM">Imagem (Raio-X, TC, RM)</Select.Option>
                  <Select.Option value="FUNCIONAL">Funcional (Eletro, ECG)</Select.Option>
                  <Select.Option value="OUTRO">Outro</Select.Option>
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Código TUSS" validateStatus={errors.codigoTUSS ? 'error' : ''} help={errors.codigoTUSS?.message}>
              <Controller name="codigoTUSS" control={control} render={({ field }) => (
                <Input {...field} placeholder="Ex: 40304361" />
              )} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Código Interno" validateStatus={errors.codigoInterno ? 'error' : ''} help={errors.codigoInterno?.message}>
              <Controller name="codigoInterno" control={control} render={({ field }) => (
                <Input {...field} placeholder="Ex: HEMO-01" />
              )} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="SLA (Horas para Resultado)" validateStatus={errors.tempoMedioResultado ? 'error' : ''} help={errors.tempoMedioResultado?.message}>
              <Controller name="tempoMedioResultado" control={control} render={({ field }) => (
                <InputNumber {...field} style={{ width: '100%' }} min={1} placeholder="Ex: 24" />
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item label="Preparação Necessária (Orientações ao Paciente)">
              <Controller name="preparacaoNecessaria" control={control} render={({ field }) => (
                <Input.TextArea {...field} rows={2} placeholder="Ex: Jejum de 8h, não ingerir bebida alcoólica..." />
              )} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Status">
              <Controller name="status" control={control} render={({ field }) => (
                <Select {...field}>
                  <Select.Option value="ATIVO">Ativo</Select.Option>
                  <Select.Option value="INATIVO">Inativo</Select.Option>
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};