import { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../../shared/services/api';

const dischargeSchema = z.object({
  cid10AltaId: z.string().min(1, 'CID-10 da alta é obrigatório'),
  sumarioAlta: z.string().min(10, 'O sumário deve conter pelo menos 10 caracteres'),
  condicaoPacienteAlta: z.enum(['ALTA_MELHORADO', 'ALTA_CURADO', 'ALTA_PEDIDO', 'OBITO', 'TRANSFERENCIA'], { required_error: 'Condição de alta é obrigatória' }),
});

type DischargeFormData = z.infer<typeof dischargeSchema>;

interface DischargeModalProps {
  visible: boolean;
  hospitalizationId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export const DischargeModal = ({ visible, hospitalizationId, onCancel, onSuccess }: DischargeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [cids, setCids] = useState([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<DischargeFormData>({
    resolver: zodResolver(dischargeSchema),
  });

  useEffect(() => {
    if (visible) {
      reset();
      // Fetch CIDs
      api.get('/admin/cid10').then(res => setCids(res.data)).catch(() => {
        setCids([{ id: 'CID-MOCK', codigo: 'J18.9', descricao: 'Pneumonia não especificada' }] as any);
      });
    }
  }, [visible, reset]);

  const onSubmit = async (data: DischargeFormData) => {
    if (!hospitalizationId) return;
    setLoading(true);
    try {
      await api.patch(`/hospitalizations/${hospitalizationId}/discharge`, data);
      message.success('Alta registrada com sucesso. O leito foi liberado.');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao registrar alta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Registrar Alta Hospitalar"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      okText="Confirmar Alta"
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="CID-10 da Alta" required validateStatus={errors.cid10AltaId ? 'error' : ''} help={errors.cid10AltaId?.message}>
          <Controller name="cid10AltaId" control={control} render={({ field }) => (
            <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione o CID final">
              {cids.map((c: any) => <Select.Option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</Select.Option>)}
            </Select>
          )} />
        </Form.Item>

        <Form.Item label="Condição na Alta" required validateStatus={errors.condicaoPacienteAlta ? 'error' : ''} help={errors.condicaoPacienteAlta?.message}>
          <Controller name="condicaoPacienteAlta" control={control} render={({ field }) => (
            <Select {...field} placeholder="Selecione a condição">
              <Select.Option value="ALTA_MELHORADO">Alta - Melhorado</Select.Option>
              <Select.Option value="ALTA_CURADO">Alta - Curado</Select.Option>
              <Select.Option value="ALTA_PEDIDO">Alta - A Pedido</Select.Option>
              <Select.Option value="TRANSFERENCIA">Transferência</Select.Option>
              <Select.Option value="OBITO">Óbito</Select.Option>
            </Select>
          )} />
        </Form.Item>

        <Form.Item label="Sumário de Alta" required validateStatus={errors.sumarioAlta ? 'error' : ''} help={errors.sumarioAlta?.message}>
          <Controller name="sumarioAlta" control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={4} placeholder="Descreva o quadro clínico, evolução e recomendações de alta" />
          )} />
        </Form.Item>
      </Form>
    </Modal>
  );
};