import { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, InputNumber, Button, Space, Typography, message, Divider, Card, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../../shared/services/api';

const { Text } = Typography;

const prescriptionItemSchema = z.object({
  medicationId: z.string().min(1, 'Selecione o medicamento'),
  dosagem: z.string().min(1, 'Informe a dosagem'),
  viaAdministracao: z.enum(['ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INALATORIA', 'OUTRO']),
  frequencia: z.string().min(1, 'Informe a frequência'),
  horariosProgramados: z.array(z.string()).min(1, 'Adicione pelo menos um horário'),
  duracaoDias: z.number().min(1, 'Mínimo 1 dia').optional(),
  observacoes: z.string().optional(),
});

const prescriptionSchema = z.object({
  observacoes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'Adicione pelo menos um medicamento à prescrição'),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

interface PrescriptionFormModalProps {
  visible: boolean;
  recordId: string;
  hospitalizationId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const PrescriptionFormModal = ({ visible, recordId, hospitalizationId, onCancel, onSuccess }: PrescriptionFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      items: [{ dosagem: '', viaAdministracao: 'ORAL', frequencia: '', horariosProgramados: [] }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  useEffect(() => {
    if (visible) {
      reset({ items: [{ dosagem: '', viaAdministracao: 'ORAL', frequencia: '', horariosProgramados: [] }] });
      fetchMedications();
    }
  }, [visible, reset]);

  const fetchMedications = async () => {
    try {
      const response = await api.get('/medications', { params: { limit: 200, status: 'ATIVO' } });
      setMedications(response.data.data || []);
    } catch (error) {
      message.error('Erro ao carregar lista de medicamentos');
    }
  };

  const onSubmit = async (data: PrescriptionFormData) => {
    setLoading(true);
    try {
      const payload = {
        medicalRecordId: recordId,
        hospitalizationId,
        observacoes: data.observacoes,
        items: data.items,
      };
      
      await api.post('/prescriptions', payload);
      message.success('Prescrição gerada com sucesso');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar prescrição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Nova Prescrição Médica/Enfermagem"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      width={900}
      destroyOnClose
      okText="Assinar e Salvar"
    >
      <Form layout="vertical">
        <Form.Item label="Observações Gerais">
          <Controller name="observacoes" control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={2} placeholder="Orientações gerais para a equipe de enfermagem" />
          )} />
        </Form.Item>

        <Divider orientation="left">Itens da Prescrição</Divider>
        
        {errors.items?.root && <Text type="danger">{errors.items.root.message}</Text>}

        {fields.map((field, index) => (
          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }} key={field.id} extra={
            fields.length > 1 && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
          }>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Medicamento" required validateStatus={errors.items?.[index]?.medicationId ? 'error' : ''} help={errors.items?.[index]?.medicationId?.message}>
                  <Controller name={`items.${index}.medicationId`} control={control} render={({ field }) => (
                    <Select {...field} showSearch optionFilterProp="children" placeholder="Buscar medicamento">
                      {medications.map((m: any) => <Select.Option key={m.id} value={m.id}>{m.nome} ({m.formaFarmaceutica})</Select.Option>)}
                    </Select>
                  )} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Dosagem" required validateStatus={errors.items?.[index]?.dosagem ? 'error' : ''} help={errors.items?.[index]?.dosagem?.message}>
                  <Controller name={`items.${index}.dosagem`} control={control} render={({ field }) => <Input {...field} placeholder="Ex: 500mg" />} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Via Admin." required validateStatus={errors.items?.[index]?.viaAdministracao ? 'error' : ''}>
                  <Controller name={`items.${index}.viaAdministracao`} control={control} render={({ field }) => (
                    <Select {...field}>
                      <Select.Option value="ORAL">Oral</Select.Option>
                      <Select.Option value="INTRAVENOSA">Intravenosa</Select.Option>
                      <Select.Option value="INTRAMUSCULAR">Intramuscular</Select.Option>
                      <Select.Option value="SUBCUTANEA">Subcutânea</Select.Option>
                      <Select.Option value="TOPICA">Tópica</Select.Option>
                      <Select.Option value="OUTRO">Outro</Select.Option>
                    </Select>
                  )} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Frequência" required validateStatus={errors.items?.[index]?.frequencia ? 'error' : ''} help={errors.items?.[index]?.frequencia?.message}>
                  <Controller name={`items.${index}.frequencia`} control={control} render={({ field }) => <Input {...field} placeholder="Ex: 8/8h" />} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Horários (HH:mm)" required validateStatus={errors.items?.[index]?.horariosProgramados ? 'error' : ''} help={errors.items?.[index]?.horariosProgramados?.message}>
                  <Controller name={`items.${index}.horariosProgramados`} control={control} render={({ field }) => (
                    <Select {...field} mode="tags" style={{ width: '100%' }} placeholder="Ex: 08:00, 16:00, 00:00" tokenSeparators={[',', ' ']} />
                  )} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Dias" validateStatus={errors.items?.[index]?.duracaoDias ? 'error' : ''}>
                  <Controller name={`items.${index}.duracaoDias`} control={control} render={({ field }) => <InputNumber {...field} min={1} style={{ width: '100%' }} />} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Obs. Específicas">
                  <Controller name={`items.${index}.observacoes`} control={control} render={({ field }) => <Input {...field} />} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}

        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => append({ medicationId: '', dosagem: '', viaAdministracao: 'ORAL', frequencia: '', horariosProgramados: [] })}>
          Adicionar Medicamento
        </Button>
      </Form>
    </Modal>
  );
};