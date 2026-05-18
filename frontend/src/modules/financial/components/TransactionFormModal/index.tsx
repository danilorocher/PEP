import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { financialService } from '../../services/financial.service';

const transactionSchema = z.object({
  tipo: z.enum(['RECEITA', 'DESPESA']),
  natureza: z.enum(['CONVENIO', 'PARTICULAR', 'SUS', 'CUSTO_OPERACIONAL', 'SALARIO', 'OUTROS']),
  chartAccountId: z.string().min(1, 'Conta Contábil é obrigatória'),
  costCenterId: z.string().optional(),
  descricao: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres'),
  valor: z.number({ required_error: 'Valor é obrigatório' }).min(0.01, 'O valor deve ser maior que zero'),
  dataCompetencia: z.any({ required_error: 'Data de competência é obrigatória' }),
  dataVencimento: z.any().optional(),
  observacoes: z.string().optional()
});

type FormData = z.infer<typeof transactionSchema>;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransactionFormModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { tipo: 'RECEITA', natureza: 'OUTROS' }
  });

  const tipoSelecionado = watch('tipo');

  useEffect(() => {
    if (visible) {
      reset();
      loadSelectData();
    }
  }, [visible]);

  const loadSelectData = async () => {
    try {
      const [accRes, ccRes] = await Promise.all([
        financialService.getChartOfAccountsTree(),
        financialService.getCostCenters({ limit: 100 })
      ]);
      
      // Achata a árvore de contas contábeis para exibirmos num Select simples
      const flatten = (nodes: any[]): any[] => {
        let result: any[] = [];
        nodes.forEach(n => {
          if (n.aceitaLancamento && n.ativo) result.push(n);
          if (n.children && n.children.length > 0) result = result.concat(flatten(n.children));
        });
        return result;
      };

      setAccounts(flatten(accRes));
      setCostCenters(ccRes?.data || []);
    } catch (error) {
      message.error('Erro ao carregar os dados de preenchimento automático.');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        dataCompetencia: data.dataCompetencia.toISOString(),
        dataVencimento: data.dataVencimento ? data.dataVencimento.toISOString() : undefined,
      };
      
      await financialService.createTransaction(payload);
      message.success('Lançamento registrado com sucesso!');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar o lançamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Novo Lançamento Financeiro"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      width={700}
      okText="Salvar Lançamento"
      cancelText="Cancelar"
    >
      <Form layout="vertical" style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item label="Tipo" validateStatus={errors.tipo ? 'error' : ''} help={errors.tipo?.message}>
            <Controller name="tipo" control={control} render={({ field }) => (
              <Select {...field} options={[{ label: 'Receita (Entrada)', value: 'RECEITA' }, { label: 'Despesa (Saída)', value: 'DESPESA' }]} />
            )} />
          </Form.Item>

          <Form.Item label="Natureza" validateStatus={errors.natureza ? 'error' : ''} help={errors.natureza?.message}>
            <Controller name="natureza" control={control} render={({ field }) => (
              <Select {...field} options={[
                { label: 'Convênio Médico', value: 'CONVENIO' },
                { label: 'Atendimento Particular', value: 'PARTICULAR' },
                { label: 'Repasse SUS', value: 'SUS' },
                { label: 'Custo Operacional', value: 'CUSTO_OPERACIONAL' },
                { label: 'Folha de Pagamento', value: 'SALARIO' },
                { label: 'Outros', value: 'OUTROS' },
              ]} />
            )} />
          </Form.Item>

          <Form.Item label="Conta Contábil" validateStatus={errors.chartAccountId ? 'error' : ''} help={errors.chartAccountId?.message}>
            <Controller name="chartAccountId" control={control} render={({ field }) => (
              <Select {...field} showSearch optionFilterProp="label" placeholder="Selecione a conta..." options={accounts.map(a => ({
                label: `${a.codigo} - ${a.nome}`, 
                value: a.id, 
                disabled: a.tipo !== tipoSelecionado 
              }))} />
            )} />
          </Form.Item>

          <Form.Item label="Centro de Custo (Opcional)" validateStatus={errors.costCenterId ? 'error' : ''} help={errors.costCenterId?.message}>
            <Controller name="costCenterId" control={control} render={({ field }) => (
              <Select {...field} allowClear placeholder="Setor..." options={costCenters.map(c => ({
                label: `${c.codigo} - ${c.nome}`, value: c.id
              }))} />
            )} />
          </Form.Item>

          <Form.Item label="Descrição" validateStatus={errors.descricao ? 'error' : ''} help={errors.descricao?.message}>
            <Controller name="descricao" control={control} render={({ field }) => <Input {...field} placeholder="Ex: Fatura Amil Ref 10/2026" />} />
          </Form.Item>

          <Form.Item label="Valor (R$)" validateStatus={errors.valor ? 'error' : ''} help={errors.valor?.message}>
            <Controller name="valor" control={control} render={({ field }) => (
              <InputNumber {...field} style={{ width: '100%' }} precision={2} min={0} prefix="R$" />
            )} />
          </Form.Item>

          <Form.Item label="Data de Competência" validateStatus={errors.dataCompetencia ? 'error' : ''} help={errors.dataCompetencia?.message}>
            <Controller name="dataCompetencia" control={control} render={({ field }) => (
              <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Quando ocorreu?" />
            )} />
          </Form.Item>

          <Form.Item label="Data de Vencimento" validateStatus={errors.dataVencimento ? 'error' : ''} help={errors.dataVencimento?.message}>
            <Controller name="dataVencimento" control={control} render={({ field }) => (
              <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Data limite (opcional)" />
            )} />
          </Form.Item>
        </div>
        <Form.Item label="Observações Adicionais">
          <Controller name="observacoes" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
        </Form.Item>
      </Form>
    </Modal>
  );
};