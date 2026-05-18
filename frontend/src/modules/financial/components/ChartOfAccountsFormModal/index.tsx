import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Switch, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { financialService } from '../../services/financial.service';

const schema = z.object({
  codigo: z.string().min(1, 'O código é obrigatório (Ex: 3.1.4)'),
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  tipo: z.enum(['RECEITA', 'DESPESA', 'ATIVO', 'PASSIVO']),
  natureza: z.enum(['DEVEDORA', 'CREDORA']),
  codigoPai: z.string().optional().nullable(),
  aceitaLancamento: z.boolean().default(true),
  ativo: z.boolean().default(true),
  descricao: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChartOfAccountsFormModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const [parentAccounts, setParentAccounts] = useState<any[]>([]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ativo: true, aceitaLancamento: true, tipo: 'RECEITA', natureza: 'CREDORA' }
  });

  useEffect(() => {
    if (visible) {
      reset({ ativo: true, aceitaLancamento: true, tipo: 'RECEITA', natureza: 'CREDORA', codigo: '', nome: '', codigoPai: null, descricao: '' });
      loadParentAccounts();
    }
  }, [visible, reset]);

  // Busca as contas existentes para popular o Select de "Conta Pai"
  const loadParentAccounts = async () => {
    try {
      const tree = await financialService.getChartOfAccountsTree();
      
      // Transforma a árvore em uma lista plana para o Select
      const flatten = (nodes: any[]): any[] => {
        let result: any[] = [];
        nodes.forEach(n => {
          result.push(n);
          if (n.children && n.children.length > 0) {
            result = result.concat(flatten(n.children));
          }
        });
        return result;
      };
      
      setParentAccounts(flatten(tree));
    } catch (error) {
      console.error('Erro ao carregar contas pai', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Formata o payload (se codigoPai for vazio, manda undefined para o backend não quebrar)
      const payload = {
        ...data,
        codigoPai: data.codigoPai ? data.codigoPai : undefined
      };

      await financialService.createChartAccount(payload);
      message.success('Conta contábil criada com sucesso!');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao criar a conta contábil.');
    }
  };

  return (
    <Modal
      title="Nova Conta Contábil"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Salvar"
      cancelText="Cancelar"
      width={700}
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <Form.Item label="Código (Ex: 3.1.4)" validateStatus={errors.codigo ? 'error' : ''} help={errors.codigo?.message}>
            <Controller name="codigo" control={control} render={({ field }) => <Input {...field} placeholder="Ex: 3.1.4" />} />
          </Form.Item>

          <Form.Item label="Nome da Conta" validateStatus={errors.nome ? 'error' : ''} help={errors.nome?.message}>
            <Controller name="nome" control={control} render={({ field }) => <Input {...field} placeholder="Ex: Receitas de Exames" />} />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item label="Tipo" validateStatus={errors.tipo ? 'error' : ''} help={errors.tipo?.message}>
            <Controller name="tipo" control={control} render={({ field }) => (
              <Select {...field} options={[
                { label: 'Receita', value: 'RECEITA' },
                { label: 'Despesa', value: 'DESPESA' },
                { label: 'Ativo', value: 'ATIVO' },
                { label: 'Passivo', value: 'PASSIVO' }
              ]} />
            )} />
          </Form.Item>

          <Form.Item label="Natureza" validateStatus={errors.natureza ? 'error' : ''} help={errors.natureza?.message}>
            <Controller name="natureza" control={control} render={({ field }) => (
              <Select {...field} options={[
                { label: 'Credora (Aumenta com Crédito)', value: 'CREDORA' },
                { label: 'Devedora (Aumenta com Débito)', value: 'DEVEDORA' }
              ]} />
            )} />
          </Form.Item>
        </div>

        <Form.Item label="Conta Pai (Opcional - Selecione para criar uma subconta)">
          <Controller name="codigoPai" control={control} render={({ field }) => (
            <Select {...field} allowClear showSearch optionFilterProp="label" placeholder="Nenhuma (Conta Raiz)" options={parentAccounts.map(a => ({
              label: `${a.codigo} - ${a.nome}`,
              value: a.codigo
            }))} />
          )} />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item label="Aceita Lançamentos (Conta Analítica)">
            <Controller name="aceitaLancamento" control={control} render={({ field: { value, onChange } }) => (
              <Switch checked={value} onChange={onChange} checkedChildren="Sim" unCheckedChildren="Não (Sintética)" />
            )} />
          </Form.Item>

          <Form.Item label="Status Ativo">
            <Controller name="ativo" control={control} render={({ field: { value, onChange } }) => (
              <Switch checked={value} onChange={onChange} />
            )} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};