import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../../shared/services/api';

const evolutionSchema = z.object({
  descricao: z.string().min(10, 'A evolução deve conter pelo menos 10 caracteres'),
  cid10Id: z.string().optional(),
});

type EvolutionFormData = z.infer<typeof evolutionSchema>;

interface EvolutionFormModalProps {
  visible: boolean;
  recordId: string;
  initialValues?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export const EvolutionFormModal = ({ visible, recordId, initialValues, onCancel, onSuccess }: EvolutionFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [cids, setCids] = useState([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EvolutionFormData>({
    resolver: zodResolver(evolutionSchema),
  });

  const isEdit = !!initialValues;

  useEffect(() => {
    if (visible) {
      reset(initialValues || { descricao: '', cid10Id: undefined });
      fetchCids();
    }
  }, [visible, initialValues, reset]);

  const fetchCids = async () => {
    try {
      const response = await api.get('/admin/cid10');
      setCids(response.data);
    } catch (error) {
      setCids([{ id: 'CID-MOCK', codigo: 'Z00.0', descricao: 'Exame médico geral' }] as any);
    }
  };

  const onSubmit = async (data: EvolutionFormData) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/medical-records/evolutions/${initialValues.id}`, data);
        message.success('Evolução atualizada com sucesso');
      } else {
        await api.post(`/medical-records/${recordId}/evolutions`, data);
        message.success('Evolução registrada');
      }
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar evolução');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar Evolução Clínica' : 'Nova Evolução Clínica'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      okText="Salvar"
      cancelText="Cancelar"
      destroyOnClose
      width={700}
    >
      <Form layout="vertical">
        <Form.Item label="CID-10 (Obrigatório para médicos)" validateStatus={errors.cid10Id ? 'error' : ''} help={errors.cid10Id?.message}>
          <Controller name="cid10Id" control={control} render={({ field }) => (
            <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione o diagnóstico associado" allowClear>
              {cids.map((c: any) => <Select.Option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</Select.Option>)}
            </Select>
          )} />
        </Form.Item>

        <Form.Item label="Descrição da Evolução" required validateStatus={errors.descricao ? 'error' : ''} help={errors.descricao?.message}>
          <Controller name="descricao" control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={8} placeholder="Descreva o quadro clínico, exame físico e condutas..." />
          )} />
        </Form.Item>
      </Form>
    </Modal>
  );
};