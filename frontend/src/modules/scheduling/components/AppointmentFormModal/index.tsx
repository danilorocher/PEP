import { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, InputNumber, Input, message, Row, Col, Space } from 'antd';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

interface AppointmentFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: any;
}

export const AppointmentFormModal = ({ visible, onCancel, onSuccess, initialValues }: AppointmentFormModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchInitialData();
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          dataHora: dayjs(initialValues.dataHora)
        });
      }
    } else {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const fetchInitialData = async () => {
    try {
      const [patientsRes, doctorsRes, specialtiesRes] = await Promise.all([
        api.get('/patients', { params: { limit: 100 } }),
        api.get('/doctors', { params: { limit: 100 } }),
        api.get('/admin/specialties') // Rota de catálogo global
      ]);
      setPatients(patientsRes.data.data);
      setDoctors(doctorsRes.data.data);
      setSpecialties(specialtiesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares');
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        dataHora: values.dataHora.toISOString(),
      };

      if (initialValues?.id) {
        await api.patch(`/appointments/${initialValues.id}`, payload);
        message.success('Agendamento atualizado');
      } else {
        await api.post('/appointments', payload);
        message.success('Consulta agendada com sucesso');
      }
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao processar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initialValues ? "Editar Agendamento" : "Novo Agendamento"}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={650}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="patientId" label="Paciente" rules={[{ required: true }]}>
              <Select showSearch placeholder="Selecione o paciente" optionFilterProp="children">
                {patients.map((p: any) => (
                  <Select.Option key={p.id} value={p.id}>{p.nomeCompleto} ({p.cpf})</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="doctorId" label="Médico" rules={[{ required: true }]}>
              <Select placeholder="Selecione o médico">
                {doctors.map((d: any) => (
                  <Select.Option key={d.id} value={d.id}>{d.nomeCompleto}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="specialtyId" label="Especialidade" rules={[{ required: true }]}>
              <Select placeholder="Selecione a especialidade">
                {specialties.map((s: any) => (
                  <Select.Option key={s.id} value={s.id}>{s.nome}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dataHora" label="Data e Hora" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="duracao" label="Duração (min)" rules={[{ required: true }]}>
              <InputNumber min={15} step={15} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="CONSULTA">Consulta</Select.Option>
                <Select.Option value="RETORNO">Retorno</Select.Option>
                <Select.Option value="EXAME">Exame</Select.Option>
                <Select.Option value="PROCEDIMENTO">Procedimento</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="observacoes" label="Observações">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};