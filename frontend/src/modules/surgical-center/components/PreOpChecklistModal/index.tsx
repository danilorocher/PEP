import React, { useState, useEffect } from 'react';
import { Modal, Form, Switch, message, Typography, Alert, Divider, Row, Col } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { preOpChecklistSchema } from '../../schemas/surgical-center.schema';
import { surgicalCenterService } from '../../services/surgical-center.service';

const { Text } = Typography;

interface PreOpChecklistModalProps {
  visible: boolean;
  cirurgia: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export const PreOpChecklistModal: React.FC<PreOpChecklistModalProps> = ({ visible, cirurgia, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(preOpChecklistSchema),
    defaultValues: {
      pacienteConfirmado: false,
      lateralidadeConfirmada: false,
      jejumConfirmado: false,
      consentimentoAssinado: false,
      alergiasVerificadas: false,
    }
  });

  useEffect(() => {
    if (visible) reset();
  }, [visible, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await surgicalCenterService.registerPreOpChecklist(cirurgia.id, data);
      message.success('Checklist validado! A cirurgia está pronta para iniciar.');
      onSuccess();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao registrar checklist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Checklist de Cirurgia Segura (OMS)"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      okText="Validar e Liberar Centro Cirúrgico"
      cancelText="Cancelar"
      width={600}
      destroyOnClose
    >
      <Alert 
        message="Atenção: Protocolo de Segurança" 
        description="O centro cirúrgico só será liberado após a confirmação presencial de todos os itens abaixo pela equipe de enfermagem ou médica."
        type="warning" 
        showIcon 
        style={{ marginBottom: 24 }}
      />

      <div style={{ marginBottom: 24 }}>
        <Text strong>Paciente:</Text> {cirurgia?.patient?.nomeCompleto} <br/>
        <Text strong>Procedimento:</Text> {cirurgia?.procedimento} <br/>
        <Text strong>Cirurgião:</Text> {cirurgia?.cirurgiao?.nomeCompleto}
      </div>

      <Form layout="horizontal" labelCol={{ span: 18 }} wrapperCol={{ span: 6 }}>
        <Form.Item label={<Text strong>1. Identidade do paciente confirmada?</Text>} validateStatus={errors.pacienteConfirmado ? 'error' : ''} help={errors.pacienteConfirmado?.message as string}>
          <Controller name="pacienteConfirmado" control={control} render={({ field: { value, onChange } }) => (
            <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} checked={value} onChange={onChange} />
          )} />
        </Form.Item>

        <Form.Item label={<Text strong>2. Sítio cirúrgico/lateralidade confirmada e demarcada?</Text>} validateStatus={errors.lateralidadeConfirmada ? 'error' : ''} help={errors.lateralidadeConfirmada?.message as string}>
          <Controller name="lateralidadeConfirmada" control={control} render={({ field: { value, onChange } }) => (
            <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} checked={value} onChange={onChange} />
          )} />
        </Form.Item>

        <Form.Item label={<Text strong>3. Tempo de jejum adequado confirmado?</Text>} validateStatus={errors.jejumConfirmado ? 'error' : ''} help={errors.jejumConfirmado?.message as string}>
          <Controller name="jejumConfirmado" control={control} render={({ field: { value, onChange } }) => (
            <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} checked={value} onChange={onChange} />
          )} />
        </Form.Item>

        <Form.Item label={<Text strong>4. Termo de consentimento assinado?</Text>} validateStatus={errors.consentimentoAssinado ? 'error' : ''} help={errors.consentimentoAssinado?.message as string}>
          <Controller name="consentimentoAssinado" control={control} render={({ field: { value, onChange } }) => (
            <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} checked={value} onChange={onChange} />
          )} />
        </Form.Item>

        <Form.Item label={<Text strong>5. Alergias conhecidas verificadas?</Text>} validateStatus={errors.alergiasVerificadas ? 'error' : ''} help={errors.alergiasVerificadas?.message as string}>
          <Controller name="alergiasVerificadas" control={control} render={({ field: { value, onChange } }) => (
            <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} checked={value} onChange={onChange} />
          )} />
        </Form.Item>
      </Form>
    </Modal>
  );
};