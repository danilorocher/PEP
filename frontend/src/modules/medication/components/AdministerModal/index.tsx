import { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, message, Typography, Descriptions, Tag } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Text } = Typography;

const administerSchema = z.object({
  status: z.enum(['MINISTRADO', 'NAO_MINISTRADO', 'RECUSADO_PACIENTE'], { required_error: 'Selecione o status da administração' }),
  observacoes: z.string().optional(),
});

type AdministerFormData = z.infer<typeof administerSchema>;

interface AdministerModalProps {
  visible: boolean;
  administration: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export const AdministerModal = ({ visible, administration, onCancel, onSuccess }: AdministerModalProps) => {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<AdministerFormData>({
    resolver: zodResolver(administerSchema),
    defaultValues: {
      status: 'MINISTRADO'
    }
  });

  const selectedStatus = watch('status');

  useEffect(() => {
    if (visible) {
      reset({ status: 'MINISTRADO', observacoes: '' });
    }
  }, [visible, reset]);

  const onSubmit = async (data: AdministerFormData) => {
    if (!administration) return;
    
    if (data.status !== 'MINISTRADO' && (!data.observacoes || data.observacoes.trim().length < 5)) {
      message.error('É obrigatório informar o motivo na observação quando a medicação não é ministrada.');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/medication-administrations/${administration.id}`, {
        status: data.status,
        observacoes: data.observacoes,
      });
      message.success('Registro de administração atualizado');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao registrar administração');
    } finally {
      setLoading(false);
    }
  };

  if (!administration) return null;

  const item = administration.prescriptionItem;
  const isOverdue = dayjs().isAfter(dayjs(administration.dataHoraProgamada));

  return (
    <Modal
      title="Registrar Administração de Medicamento"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      okText="Salvar Registro"
      destroyOnClose
    >
      <Descriptions size="small" column={1} bordered style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Paciente">
          <Text strong>{administration.hospitalization?.patient?.nomeCompleto}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Localização">
          {administration.hospitalization?.ward?.nome} - Leito {administration.hospitalization?.bed?.numero}
        </Descriptions.Item>
        <Descriptions.Item label="Medicamento">
          <Text strong>{item?.medication?.nome}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Prescrição">
          {item?.dosagem} - {item?.viaAdministracao}
        </Descriptions.Item>
        <Descriptions.Item label="Horário Programado">
          <Tag color={isOverdue ? 'red' : 'blue'}>
            {dayjs(administration.dataHoraProgamada).format('DD/MM/YYYY HH:mm')}
          </Tag>
          {isOverdue && <Text type="danger" style={{ marginLeft: 8 }}>Em atraso</Text>}
        </Descriptions.Item>
      </Descriptions>

      <Form layout="vertical">
        <Form.Item label="Ação" required validateStatus={errors.status ? 'error' : ''} help={errors.status?.message}>
          <Controller name="status" control={control} render={({ field }) => (
            <Select {...field}>
              <Select.Option value="MINISTRADO">Ministrado</Select.Option>
              <Select.Option value="NAO_MINISTRADO">Não Ministrado (Outros Motivos)</Select.Option>
              <Select.Option value="RECUSADO_PACIENTE">Recusado pelo Paciente</Select.Option>
            </Select>
          )} />
        </Form.Item>

        <Form.Item 
          label="Observações" 
          required={selectedStatus !== 'MINISTRADO'} 
          validateStatus={errors.observacoes ? 'error' : ''} 
          help={errors.observacoes?.message || (selectedStatus !== 'MINISTRADO' ? 'Obrigatório informar o motivo' : '')}
        >
          <Controller name="observacoes" control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={3} placeholder="Descreva intercorrências ou o motivo da não administração" />
          )} />
        </Form.Item>
      </Form>
    </Modal>
  );
};