import { useEffect, useState } from 'react';
import {
  Modal, Form, Select, Input, InputNumber, Button, Space,
  message, Divider, Card, Row, Col
} from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const TODAY = dayjs().format('YYYY-MM-DD');

// 🔥 BUG 4 CORRIGIDO: Adicionado dataInicio no Schema Zod
const prescriptionItemSchema = z.object({
  medicationId: z.string().min(1, 'Selecione o medicamento'),
  dosagem: z.string().min(1, 'Informe a dosagem'),
  viaAdministracao: z.enum(['ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INALATORIA', 'OUTRO']),
  frequencia: z.string().min(1, 'Informe a frequência'),
  horariosProgramados: z.array(z.string()).min(1, 'Adicione pelo menos um horário'),
  duracaoDias: z.number().min(1).optional(),
  dataInicio: z.string().min(1, 'Informe a data de início'), 
  observacoes: z.string().optional(),
});

const prescriptionSchema = z.object({
  observacoes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'Adicione pelo menos um medicamento'),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

const DEFAULT_ITEM = {
  medicationId: '',
  dosagem: '',
  viaAdministracao: 'ORAL' as const,
  frequencia: '',
  horariosProgramados: [] as string[],
  duracaoDias: 1,
  dataInicio: TODAY, // 🔥 BUG 4 CORRIGIDO: Valor default para hoje
  observacoes: '',
};

interface PrescriptionFormModalProps {
  visible: boolean;
  recordId: string;
  hospitalizationId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const PrescriptionFormModal = ({
  visible, recordId, hospitalizationId, onCancel, onSuccess
}: PrescriptionFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);

  const { control: ctrl, handleSubmit, reset, formState: { errors } } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: { items: [{ ...DEFAULT_ITEM }] }
  });
  const control = ctrl as any;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (visible) {
      reset({ items: [{ ...DEFAULT_ITEM }] });
      fetchMedications();
    }
  }, [visible, reset]);

  const fetchMedications = async () => {
    try {
      // 🔥 CORREÇÃO APENAS DA ROTA: Apontando para o catálogo da Farmácia
      const response = await api.get('/pharmacy/medications/catalog', { params: { limit: 500 } });
      setMedications(response.data?.data || response.data || []);
    } catch {
      message.error('Erro ao carregar lista de medicamentos');
    }
  };

  const onSubmit = async (data: PrescriptionFormData) => {
    setLoading(true);
    try {
      const payload = {
        hospitalizationId: hospitalizationId || undefined,
        observacoes: data.observacoes,
        items: data.items.map(item => ({
          ...item,
          dataInicio: item.dataInicio, 
        })),
      };

      // 🔥 BUG 3 CORRIGIDO: Rota correta apontando para o Prontuário
      await api.post(`/medical-records/${recordId}/prescriptions`, payload);
      message.success('Prescrição registrada com sucesso!');
      onSuccess();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) {
        message.error(msg.join(', '));
      } else {
        message.error(msg || 'Erro ao salvar prescrição');
      }
    } finally {
      setLoading(false);
    }
  };

  const VIA_OPTIONS = [
    { value: 'ORAL', label: 'Oral' },
    { value: 'INTRAVENOSA', label: 'Intravenosa (IV)' },
    { value: 'INTRAMUSCULAR', label: 'Intramuscular (IM)' },
    { value: 'SUBCUTANEA', label: 'Subcutânea (SC)' },
    { value: 'TOPICA', label: 'Tópica' },
    { value: 'INALATORIA', label: 'Inalatória' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  return (
    <Modal
      title="Nova Prescrição Médica"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      width={1000}
      destroyOnClose
      okText="Salvar Prescrição"
      cancelText="Cancelar"
    >
      <Form layout="vertical">
        <Form.Item label="Observações Gerais (Opcional)">
          <Controller
            name="observacoes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                placeholder="Orientações gerais para a equipe de enfermagem"
              />
            )}
          />
        </Form.Item>

        <Divider orientation="left">Itens da Prescrição</Divider>

        {errors.items?.root && (
          <p style={{ color: 'red' }}>{errors.items.root.message}</p>
        )}

        {fields.map((field, index) => (
          <Card
            key={field.id}
            size="small"
            style={{ marginBottom: 16, background: '#fafafa', border: '1px solid #d9d9d9' }}
            title={`Medicamento ${index + 1}`}
            extra={
              fields.length > 1 && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => remove(index)}
                >
                  Remover
                </Button>
              )
            }
          >
            <Row gutter={16}>
              <Col span={14}>
                <Form.Item
                  label="Medicamento"
                  required
                  validateStatus={errors.items?.[index]?.medicationId ? 'error' : ''}
                  help={errors.items?.[index]?.medicationId?.message}
                >
                  <Controller
                    name={`items.${index}.medicationId`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        showSearch
                        optionFilterProp="label"
                        placeholder="Buscar medicamento pelo nome..."
                        onChange={(value) => {
                          const med = medications.find((m: any) => m.id === value);
                          if (med && (med.totalStock ?? 1) <= 0) {
                            Modal.confirm({
                              title: 'Medicamento sem estoque',
                              icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                              content: `${med.nome} não possui estoque. Deseja prescrever assim mesmo?`,
                              okText: 'Sim, prescrever',
                              cancelText: 'Cancelar',
                              onOk: () => field.onChange(value),
                            });
                          } else {
                            field.onChange(value);
                          }
                        }}
                        options={medications.map((m: any) => ({
                          value: m.id,
                          label: `${m.nome} ${m.concentracao ? `(${m.concentracao})` : ''} — ${m.formaFarmaceutica || ''}`,
                        }))}
                        notFoundContent="Nenhum medicamento encontrado"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  label="Dosagem"
                  required
                  validateStatus={errors.items?.[index]?.dosagem ? 'error' : ''}
                  help={errors.items?.[index]?.dosagem?.message}
                >
                  <Controller
                    name={`items.${index}.dosagem`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Ex: 500mg" />}
                  />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  label="Via de Administração"
                  required
                >
                  <Controller
                    name={`items.${index}.viaAdministracao`}
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={VIA_OPTIONS} />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={5}>
                <Form.Item
                  label="Frequência"
                  required
                  validateStatus={errors.items?.[index]?.frequencia ? 'error' : ''}
                  help={errors.items?.[index]?.frequencia?.message}
                >
                  <Controller
                    name={`items.${index}.frequencia`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        showSearch
                        placeholder="Ex: 8/8h"
                        options={[
                          { value: '1x/dia', label: '1x/dia' },
                          { value: '2x/dia', label: '2x/dia (12/12h)' },
                          { value: '3x/dia', label: '3x/dia (8/8h)' },
                          { value: '4x/dia', label: '4x/dia (6/6h)' },
                          { value: '6x/dia', label: '6x/dia (4/4h)' },
                          { value: 'S/N', label: 'Se necessário (S/N)' },
                          { value: 'Dose única', label: 'Dose única' },
                        ]}
                        allowClear
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item
                  label="Horários Programados"
                  required
                  validateStatus={errors.items?.[index]?.horariosProgramados ? 'error' : ''}
                  help={(errors.items?.[index]?.horariosProgramados as any)?.message}
                >
                  <Controller
                    name={`items.${index}.horariosProgramados`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        mode="tags"
                        placeholder="Digite o horário (ex: 08:00) e pressione Enter"
                        tokenSeparators={[',', ' ']}
                        options={[
                          { value: '06:00', label: '06:00' },
                          { value: '08:00', label: '08:00' },
                          { value: '10:00', label: '10:00' },
                          { value: '12:00', label: '12:00' },
                          { value: '14:00', label: '14:00' },
                          { value: '16:00', label: '16:00' },
                          { value: '18:00', label: '18:00' },
                          { value: '20:00', label: '20:00' },
                          { value: '22:00', label: '22:00' },
                          { value: '00:00', label: '00:00' },
                        ]}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Duração (dias)">
                  <Controller
                    name={`items.${index}.duracaoDias`}
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        min={1}
                        max={365}
                        style={{ width: '100%' }}
                        placeholder="7"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                {/* 🔥 BUG 4 CORRIGIDO: Campo de Data Início na Interface */}
                <Form.Item
                  label="Data de Início"
                  required
                  validateStatus={errors.items?.[index]?.dataInicio ? 'error' : ''}
                  help={errors.items?.[index]?.dataInicio?.message}
                >
                  <Controller
                    name={`items.${index}.dataInicio`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="date"
                        min={TODAY}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Observações">
                  <Controller
                    name={`items.${index}.observacoes`}
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Obs. específicas" />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}

        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={() => append({ ...DEFAULT_ITEM })}
          style={{ marginTop: 8 }}
        >
          Adicionar Medicamento
        </Button>
      </Form>
    </Modal>
  );
};