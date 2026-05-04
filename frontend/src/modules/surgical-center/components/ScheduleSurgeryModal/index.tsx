import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Input, message, Row, Col } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSurgerySchema } from '../../schemas/surgical-center.schema';
import { surgicalCenterService } from '../../services/surgical-center.service';
import api from '../../../../shared/services/api';

interface ScheduleSurgeryModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ScheduleSurgeryModal: React.FC<ScheduleSurgeryModalProps> = ({ visible, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(scheduleSurgerySchema),
    defaultValues: { prioridade: 'ELETIVA' }
  });

  useEffect(() => {
    if (visible) {
      reset({ prioridade: 'ELETIVA' });
      fetchFormData();
    }
  }, [visible, reset]);

  const fetchFormData = async () => {
    try {
      const [pRes, dRes, nRes, rRes] = await Promise.all([
        api.get('/patients', { params: { limit: 200, status: 'ATIVO' } }),
        api.get('/doctors', { params: { limit: 200, status: 'ATIVO' } }),
        api.get('/nurses', { params: { limit: 200, status: 'ATIVO' } }),
        surgicalCenterService.getResources()
      ]);
      
      setPatients(pRes.data?.data || pRes.data || []);
      setDoctors(dRes.data?.data || dRes.data || []);
      setNurses(nRes.data?.data || nRes.data || []);
      // Filtra apenas recursos do tipo SALA que estão operacionais
      setSalas((rRes.data || []).filter((r: any) => r.tipo === 'SALA' && r.status === 'ATIVO'));
    } catch (error) {
      message.error('Erro ao carregar dados para o agendamento.');
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        dataCirurgia: data.dataCirurgia.toISOString(),
      };
      
      await surgicalCenterService.scheduleSurgery(payload);
      message.success('Cirurgia agendada com sucesso!');
      onSuccess();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao agendar cirurgia. Verifique conflitos de sala/equipe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Agendar Procedimento Cirúrgico"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      width={700}
      destroyOnClose
      okText="Salvar Agendamento"
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={14}>
            <Form.Item label="Paciente" required validateStatus={errors.patientId ? 'error' : ''} help={errors.patientId?.message as string}>
              <Controller name="patientId" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione o paciente">
                  {patients.map(p => <Select.Option key={p.id} value={p.id}>{p.nomeCompleto} ({p.cpf})</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item label="Prioridade" required validateStatus={errors.prioridade ? 'error' : ''} help={errors.prioridade?.message as string}>
              <Controller name="prioridade" control={control} render={({ field }) => (
                <Select {...field}>
                  <Select.Option value="ELETIVA">Eletiva</Select.Option>
                  <Select.Option value="URGENCIA">Urgência</Select.Option>
                  <Select.Option value="EMERGENCIA">Emergência</Select.Option>
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={14}>
            <Form.Item label="Procedimento Cirúrgico" required validateStatus={errors.procedimento ? 'error' : ''} help={errors.procedimento?.message as string}>
              <Controller name="procedimento" control={control} render={({ field }) => <Input {...field} placeholder="Ex: Apendicectomia, Colecistectomia" />} />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item label="Data e Hora" required validateStatus={errors.dataCirurgia ? 'error' : ''} help={errors.dataCirurgia?.message as string}>
              <Controller name="dataCirurgia" control={control} render={({ field }) => <DatePicker {...field} showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Sala Cirúrgica" required validateStatus={errors.salaId ? 'error' : ''} help={errors.salaId?.message as string}>
              <Controller name="salaId" control={control} render={({ field }) => (
                <Select {...field} placeholder="Selecione a Sala">
                  {salas.map(s => <Select.Option key={s.id} value={s.id}>{s.nome}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Cirurgião Principal" required validateStatus={errors.cirurgiaoId ? 'error' : ''} help={errors.cirurgiaoId?.message as string}>
              <Controller name="cirurgiaoId" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione">
                  {doctors.map(d => <Select.Option key={d.id} value={d.id}>{d.nomeCompleto}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Anestesista" required validateStatus={errors.anestesistaId ? 'error' : ''} help={errors.anestesistaId?.message as string}>
              <Controller name="anestesistaId" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione">
                  {doctors.map(d => <Select.Option key={d.id} value={d.id}>{d.nomeCompleto}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Enfermeiro Circulante" required validateStatus={errors.enfermeiroId ? 'error' : ''} help={errors.enfermeiroId?.message as string}>
              <Controller name="enfermeiroId" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione">
                  {nurses.map(n => <Select.Option key={n.id} value={n.id}>{n.nomeCompleto}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Observações">
          <Controller name="observacoes" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Alergias severas, OPME necessário, etc." />} />
        </Form.Item>
      </Form>
    </Modal>
  );
};