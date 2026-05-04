import React, { useState } from 'react';
import { Modal, Form, Input, Alert, message, Typography, QRCode } from 'antd';
import { labService } from '../../services/lab.service';

const { Text } = Typography;

export const SampleCollectionModal = ({ visible, order, onCancel, onSuccess }: any) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);

  const handleCollect = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await labService.collectSample(order.id, values);
      setBarcode(res.data.barcode);
      message.success('Coleta registrada com sucesso!');
      onSuccess();
    } catch (err) {
      message.error('Erro ao registrar coleta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Coleta de Amostra"
      open={visible}
      onCancel={onCancel}
      onOk={barcode ? onCancel : handleCollect}
      okText={barcode ? "Fechar" : "Registrar Coleta"}
      confirmLoading={loading}
    >
      {!barcode ? (
        <Form form={form} layout="vertical">
          <Alert message="Verifique os dados do paciente antes da coleta." type="warning" showIcon style={{ marginBottom: 16 }} />
          <Text strong>Paciente: {order?.patient?.nomeCompleto}</Text>
          <Form.Item name="sampleType" label="Tipo de Amostra" rules={[{ required: true }]} style={{ marginTop: 16 }}>
            <Input placeholder="Ex: SANGUE, URINA" />
          </Form.Item>
        </Form>
      ) : (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <QRCode value={barcode} status="active" />
          <div style={{ marginTop: 10 }}><Text code>{barcode}</Text></div>
        </div>
      )}
    </Modal>
  );
};