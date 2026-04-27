import { Modal, Form, Input, Select, message, Row, Col } from 'antd';
import { useEffect } from 'react';
import api from '../../../../shared/services/api';

interface BedFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  wardId: string;
  initialValues?: any;
}

export const BedFormModal = ({ visible, onCancel, onSuccess, wardId, initialValues }: BedFormModalProps) => {
  const [form] = Form.useForm();
  const isEdit = !!initialValues;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues || { status: 'LIVRE', wardId });
    }
  }, [visible, initialValues, wardId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        await api.patch(`/beds/${initialValues.id}`, values);
        message.success('Leito atualizado');
      } else {
        await api.post('/beds', { ...values, wardId });
        message.success('Leito cadastrado');
      }
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao processar leito');
    }
  };

  return (
    <Modal
      title={isEdit ? `Editar Leito ${initialValues.numero}` : 'Adicionar Novo Leito'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Confirmar"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="numero" label="Número do Leito" rules={[{ required: true }]}>
              <Input placeholder="Ex: 101-A" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="UTI">UTI</Select.Option>
                <Select.Option value="CLINICO">Clínico</Select.Option>
                <Select.Option value="ISOLAMENTO">Isolamento</Select.Option>
                <Select.Option value="PEDIATRICO">Pediátrico</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="status" label="Status Inicial">
          <Select>
            <Select.Option value="LIVRE">Livre</Select.Option>
            <Select.Option value="OCUPADO" disabled>Ocupado (Via Admissão)</Select.Option>
            <Select.Option value="MANUTENCAO">Manutenção</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};