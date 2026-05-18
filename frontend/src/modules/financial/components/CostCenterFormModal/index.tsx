import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { financialService } from '../../services/financial.service';

const schema = z.object({
  codigo: z.string().min(1, 'O código é obrigatório'),
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  tipo: z.enum(['CLINICO', 'ADMINISTRATIVO', 'APOIO']),
  ativo: z.boolean().default(true),
  descricao: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // Se vier preenchido, é edição!
}

export const CostCenterFormModal: React.FC<Props> = ({ visible, onClose, onSuccess, initialData }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ativo: true, tipo: 'CLINICO' }
  });

  // Preenche o form se for Edição, ou limpa se for Criação
  useEffect(() => {
    if (visible) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({ ativo: true, tipo: 'CLINICO', codigo: '', nome: '', descricao: '' });
      }
    }
  }, [visible, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (initialData?.id) {
        await financialService.updateCostCenter(initialData.id, data);
        message.success('Centro de custo atualizado com sucesso!');
      } else {
        await financialService.createCostCenter(data);
        message.success('Centro de custo criado com sucesso!');
      }
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar o centro de custo.');
    }
  };

  return (
    <Modal
      title={initialData ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Salvar"
      cancelText="Cancelar"
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <Form.Item label="Código" validateStatus={errors.codigo ? 'error' : ''} help={errors.codigo?.message}>
            <Controller name="codigo" control={control} render={({ field }) => <Input {...field} placeholder="Ex: 400" />} />
          </Form.Item>

          <Form.Item label="Nome do Setor" validateStatus={errors.nome ? 'error' : ''} help={errors.nome?.message}>
            <Controller name="nome" control={control} render={({ field }) => <Input {...field} placeholder="Ex: Pediatria" />} />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <Form.Item label="Tipo" validateStatus={errors.tipo ? 'error' : ''} help={errors.tipo?.message}>
            <Controller name="tipo" control={control} render={({ field }) => (
              <Select {...field} options={[
                { label: 'Clínico (Gera Receita)', value: 'CLINICO' },
                { label: 'Administrativo (Custo Fixo)', value: 'ADMINISTRATIVO' },
                { label: 'Apoio (Ex: TI, Limpeza)', value: 'APOIO' }
              ]} />
            )} />
          </Form.Item>

          <Form.Item label="Status Ativo">
            <Controller name="ativo" control={control} render={({ field: { value, onChange } }) => (
              <Switch checked={value} onChange={onChange} />
            )} />
          </Form.Item>
        </div>

        <Form.Item label="Descrição (Opcional)">
          <Controller name="descricao" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
        </Form.Item>
      </Form>
    </Modal>
  );
};