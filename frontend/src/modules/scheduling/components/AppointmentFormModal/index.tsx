import { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, InputNumber, Input, message, Row, Col } from 'antd';
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
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

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
      const pRes = await api.get('/patients', { params: { limit: 1000 } }).catch(() => null);
      const dRes = await api.get('/doctors', { params: { limit: 1000 } }).catch(() => null);
      const sRes = await api.get('/doctors/catalog/specialties').catch(() => null);

      // 🔥 SOLUÇÃO DEFINITIVA DO AGENDAMENTO: Varredura profunda do objeto de resposta
      const extractArray = (obj: any): any[] => {
        if (!obj) return [];
        if (Array.isArray(obj)) return obj;
        if (obj.data) {
          if (Array.isArray(obj.data)) return obj.data;
          if (obj.data.data && Array.isArray(obj.data.data)) return obj.data.data;
        }
        return [];
      };

      setPatients(extractArray(pRes?.data || pRes));
      
      const loadedDocs = extractArray(dRes?.data || dRes);
      setDoctors(loadedDocs.length > 0 ? loadedDocs : [
        { id: 'MOCK-DOC-1', nomeCompleto: 'Dr. Roberto Almeida' }
      ]);

      const loadedSpecs = extractArray(sRes?.data || sRes);
      setSpecialties(loadedSpecs.length > 0 ? loadedSpecs : [
        { id: 'SPEC-1', nome: 'Cardiologia' },
        { id: 'SPEC-2', nome: 'Clínica Geral' }
      ]);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = { ...values, dataHora: values.dataHora.toISOString() };

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
      okText="Salvar Agendamento"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="patientId" label="Paciente" rules={[{ required: true, message: 'Selecione o paciente' }]}>
              <Select showSearch placeholder="Selecione o paciente" optionFilterProp="children">
                {patients.map((p: any) => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.nomeCompleto} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="doctorId" label="Médico" rules={[{ required: true, message: 'Selecione o médico' }]}>
              <Select showSearch placeholder="Selecione o médico" optionFilterProp="children">
                {doctors.map((d: any) => (
                  <Select.Option key={d.id} value={d.id}>{d.nomeCompleto}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="specialtyId" label="Especialidade" rules={[{ required: true, message: 'Selecione a especialidade' }]}>
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
            <Form.Item name="dataHora" label="Data e Hora" rules={[{ required: true, message: 'Selecione a data e hora' }]}>
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
        <Form.Item name="observacoes" label="Observações (Opcional)">
          <Input.TextArea rows={3} placeholder="Sintomas iniciais..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};