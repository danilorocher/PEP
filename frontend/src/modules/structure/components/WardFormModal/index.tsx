import { Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { useEffect } from 'react';
import api from '../../../../shared/services/api';

interface WardFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: any;
}

export const WardFormModal = ({ visible, onCancel, onSuccess, initialValues }: WardFormModalProps) => {
  const [form] = Form.useForm();
  const isEdit = !!initialValues;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues || { status: 'ATIVO' });
    } else {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        await api.patch(`/wards/${initialValues.id}`, values);
        message.success('Ala atualizada com sucesso');
      } else {
        await api.post('/wards', values);
        message.success('Ala criada com sucesso');
      }
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar ala');
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar Ala' : 'Nova Ala Hospitalar'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Salvar"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="nome" label="Nome da Ala" rules={[{ required: true, message: 'Obrigatório' }]}>
          <Input placeholder="Ex: UTI Adulto, Enfermaria Masculina" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="UTI">UTI</Select.Option>
                <Select.Option value="ENFERMARIA">Enfermaria</Select.Option>
                <Select.Option value="EMERGENCIA">Emergência</Select.Option>
                <Select.Option value="PEDIATRIA">Pediatria</Select.Option>
                <Select.Option value="CIRURGICO">Centro Cirúrgico</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="capacidade" label="Capacidade de Leitos" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="andar" label="Andar">
              <Input placeholder="Ex: 2º Andar" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="Status">
              <Select>
                <Select.Option value="ATIVO">Ativo</Select.Option>
                <Select.Option value="INATIVO">Inativo</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};