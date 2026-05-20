import React, { useEffect, useState, useRef } from 'react';
import { Modal, Form, Input, Select, message, Spin } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../../../shared/services/api';

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
  const [cids, setCids] = useState<any[]>([]);
  const [fetchingCids, setFetchingCids] = useState(false);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EvolutionFormData>({
    resolver: zodResolver(evolutionSchema),
  });

  const isEdit = !!initialValues;

  useEffect(() => {
    if (visible) {
      reset(initialValues || { descricao: '', cid10Id: undefined });
      fetchCids(''); 
    }
  }, [visible, initialValues, reset]);

  const fetchCids = async (search: string) => {
    setFetchingCids(true);
    try {
      const response = await api.get('/cid', {
        params: { search, page: 1, limit: 50 }
      });
      setCids(response.data.data || []);
    } catch (error) {
      console.error("Erro ao buscar CIDs:", error);
    } finally {
      setFetchingCids(false);
    }
  };

  const handleSearchCid = (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchCids(value);
    }, 500);
  };

  const onSubmit = async (data: EvolutionFormData) => {
    setLoading(true);
    try {
      // 🔥 BLINDAGEM DEFENSIVA: Limpa o payload antes de mandar pro backend
      const payload: any = {
        descricao: data.descricao,
      };

      // Só anexa o CID se ele for um texto válido (ignora strings vazias que quebram o Postgres)
      if (data.cid10Id && data.cid10Id.trim() !== '') {
        payload.cid10Id = data.cid10Id;
      }

      console.log('📦 Payload Limpo Enviado:', payload);

      if (isEdit) {
        await api.patch(`/medical-records/evolutions/${initialValues.id}`, payload);
        message.success('Evolução clínica atualizada com sucesso!');
      } else {
        await api.post(`/medical-records/${recordId}/evolutions`, payload);
        message.success('Evolução clínica registrada e assinada!');
      }
      onSuccess();
    } catch (error: any) {
      console.error('🚨 ERRO API EVOLUÇÃO:', error.response?.data);
      const errorMessage = error.response?.data?.message;
      message.error(
        Array.isArray(errorMessage) ? errorMessage.join(' | ') : errorMessage || 'Erro ao salvar evolução no banco de dados.'
      );
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
      okText="Assinar e Salvar"
      cancelText="Cancelar"
      destroyOnClose
      width={700}
      okButtonProps={{ style: { background: '#0F766E' } }}
    >
      <Form layout="vertical" style={{ marginTop: '16px' }}>
        
        <Form.Item label="Diagnóstico CID-10 (Opcional)" validateStatus={errors.cid10Id ? 'error' : ''} help={errors.cid10Id?.message}>
          <Controller name="cid10Id" control={control} render={({ field }) => (
            <Select 
              {...field} 
              showSearch 
              filterOption={false}
              onSearch={handleSearchCid}
              notFoundContent={fetchingCids ? <Spin size="small" /> : null}
              placeholder="Digite o código (ex: J00) ou diagnóstico (ex: Asma)..." 
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

        <Form.Item label="Descrição da Evolução (SOAP)" required validateStatus={errors.descricao ? 'error' : ''} help={errors.descricao?.message}>
          <Controller name="descricao" control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={8} placeholder="Descreva o quadro clínico, exame físico e condutas..." />
          )} />
        </Form.Item>
      </Form>
    </Modal>
  );
};