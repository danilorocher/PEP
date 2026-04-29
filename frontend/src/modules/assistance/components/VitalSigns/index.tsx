import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, Row, Col, Space, message, Typography, Card } from 'antd';
import { PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vitalSignsSchema } from '../../schemas/assistance.schema';
import { assistanceService } from '../../services/assistance.service';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Props {
  patientId: string;
  hospitalizationId?: string;
}

export const VitalSigns: React.FC<Props> = ({ patientId, hospitalizationId }) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(vitalSignsSchema),
  });

  const fetchHistory = async () => {
    try {
      const { data } = await assistanceService.getVitalSignsByPatient(patientId);
      setHistory(data.data);
    } catch (err) {
      message.error('Erro ao carregar histórico de sinais vitais');
    }
  };

  useEffect(() => { fetchHistory(); }, [patientId]);

  const onSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await assistanceService.createVitalSigns({
        ...formData,
        patientId,
        hospitalizationId,
      });
      message.success('Sinais vitais registrados com sucesso');
      setVisible(false);
      reset();
      fetchHistory();
    } catch (err) {
      message.error('Erro ao salvar registro');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Data/Hora', dataIndex: 'dataHora', key: 'date', render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm') },
    { title: 'PA', key: 'pa', render: (rec: any) => `${rec.systolicPressure}/${rec.diastolicPressure} mmHg` },
    { title: 'Temp', dataIndex: 'temperature', key: 'temp', render: (val: number) => `${val}°C` },
    { title: 'FC', dataIndex: 'heartRate', key: 'fc', render: (val: number) => `${val} bpm` },
    { title: 'FR', dataIndex: 'respiratoryRate', key: 'fr', render: (val: number) => `${val} irpm` },
    { title: 'SpO2', dataIndex: 'spo2', key: 'spo2', render: (val: number) => `${val}%` },
    { title: 'Dor', dataIndex: 'painScale', key: 'pain' },
    { title: 'Responsável', dataIndex: ['registeredBy', 'nomeCompleto'], key: 'user' },
  ];

  return (
    <Card title={<Space><HistoryOutlined /> Histórico de Sinais Vitais</Space>} extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setVisible(true)}>Registrar</Button>
    }>
      <Table dataSource={history} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 5 }} />

      <Modal title="Novo Registro de Sinais Vitais" open={visible} onCancel={() => setVisible(false)} onOk={handleSubmit(onSubmit)} confirmLoading={loading} width={600}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Sistólica (PA)" validateStatus={errors.systolicPressure ? 'error' : ''}><Controller name="systolicPressure" control={control} render={({field}) => <InputNumber {...field} style={{width: '100%'}} />} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Diastólica (PA)" validateStatus={errors.diastolicPressure ? 'error' : ''}><Controller name="diastolicPressure" control={control} render={({field}) => <InputNumber {...field} style={{width: '100%'}} />} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Temp (°C)" validateStatus={errors.temperature ? 'error' : ''}><Controller name="temperature" control={control} render={({field}) => <InputNumber {...field} step={0.1} style={{width: '100%'}} />} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Freq. Card. (bpm)" validateStatus={errors.heartRate ? 'error' : ''}><Controller name="heartRate" control={control} render={({field}) => <InputNumber {...field} style={{width: '100%'}} />} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Freq. Resp. (irpm)" validateStatus={errors.respiratoryRate ? 'error' : ''}><Controller name="respiratoryRate" control={control} render={({field}) => <InputNumber {...field} style={{width: '100%'}} />} /></Form.Item></Col>
            <Col span={8}><Form.Item label="SpO2 (%)" validateStatus={errors.spo2 ? 'error' : ''}><Controller name="spo2" control={control} render={({field}) => <InputNumber {...field} style={{width: '100%'}} />} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};