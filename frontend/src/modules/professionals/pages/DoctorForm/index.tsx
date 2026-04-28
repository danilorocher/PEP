import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Row, Col, Select, Typography, message, Space } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../../shared/services/api';

const doctorSchema = z.object({
  nomeCompleto: z.string().min(3),
  cpf: z.string().length(11),
  crm: z.string().min(1),
  ufCrm: z.string().length(2),
  cns: z.string().optional(),
  emailProfissional: z.string().email().optional(),
  specialties: z.array(z.string()).optional(),
});

export const DoctorFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(doctorSchema)
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/doctors/${id}`).then(res => reset(res.data));
    }
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isEdit) await api.patch(`/doctors/${id}`, data);
      else await api.post('/doctors', data);
      message.success('Médico salvo com sucesso');
      navigate('/professionals');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<Space><Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/professionals')} /> {isEdit ? 'Editar Médico' : 'Cadastrar Médico'}</Space>}>
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col span={12}><Form.Item label="Nome Completo"><Controller name="nomeCompleto" control={control} render={({field}) => <Input {...field} />} /></Form.Item></Col>
          <Col span={6}><Form.Item label="CPF"><Controller name="cpf" control={control} render={({field}) => <Input {...field} disabled={isEdit} />} /></Form.Item></Col>
          <Col span={6}><Form.Item label="CNS"><Controller name="cns" control={control} render={({field}) => <Input {...field} />} /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}><Form.Item label="CRM"><Controller name="crm" control={control} render={({field}) => <Input {...field} />} /></Form.Item></Col>
          <Col span={3}><Form.Item label="UF"><Controller name="ufCrm" control={control} render={({field}) => <Input {...field} maxLength={2} />} /></Form.Item></Col>
          <Col span={15}><Form.Item label="E-mail Profissional"><Controller name="emailProfissional" control={control} render={({field}) => <Input {...field} />} /></Form.Item></Col>
        </Row>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>Salvar</Button>
      </Form>
    </Card>
  );
};