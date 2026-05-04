import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Alert } from 'antd';
import { labService } from '../../services/lab.service';

const { TextArea } = Input;

interface SignReportModalProps {
  visible: boolean;
  order: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export const SignReportModal: React.FC<SignReportModalProps> = ({ visible, order, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await labService.signReport(order.id, values);
      message.success('Laudo assinado e finalizado com sucesso!');
      onSuccess();
    } catch (err) {
      message.error('Erro ao processar assinatura do laudo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Assinar Laudo Laboratorial"
      open={visible}
      onCancel={onCancel}
      onOk={handleSign}
      confirmLoading={loading}
      okText="Assinar e Finalizar"
      width={600}
    >
      <Alert 
        message="Atenção: A assinatura digital encerra o processo laboratorial deste pedido. Não será possível editar os resultados após este passo." 
        type="warning" 
        showIcon 
        style={{ marginBottom: 16 }} 
      />
      <Form form={form} layout="vertical">
        <Form.Item 
          name="reportText" 
          label="Texto do Laudo / Parecer Técnico" 
          rules={[{ required: true, message: 'Por favor, insira a conclusão do exame.' }]}
        >
          <TextArea rows={10} placeholder="Descreva aqui o parecer final e as notas clínicas pertinentes..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};