import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Row, Col, Select, message, Space, Checkbox } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../../shared/services/api';

const nurseSchema = z.object({
  nomeCompleto: z.string().min(3),
  cpf: z.string().length(11),
  coren: z.string().min(1),
  ufCoren: z.string().length(2),
  categoria: z.enum(['ENFERMEIRO', 'TECNICO', 'AUXILIAR']),
  podePrescrever: z.boolean().default(false),
});

export const NurseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const { control: ctrl, handleSubmit, reset } = useForm({
    resolver: zodResolver(nurseSchema),
    defaultValues: { podePrescrever: false }
  });

  const control = ctrl as any;

  useEffect(() => {
    if (isEdit) {
      api.get(`/nurses/${id}`).then(res => reset(res.data));
    }
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isEdit) await api.patch(`/nurses/${id}`, data);
      else await api.post('/nurses', data);
      message.success('Enfermeiro salvo');
      navigate('/professionals');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<Space><Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/professionals')} /> {isEdit ? 'Editar Enfermeiro' : 'Cadastrar Enfermeiro'}</Space>}>
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col span={12}><Form.Item label="Nome Completo"><Controller name="nomeCompleto" control={control} render={({field}) => <Input {...field} />} /></Form.Item></Col>
          <Col span={12}><Form.Item label="CPF"><Controller name="cpf" control={control} render={({field}) => <Input {...field} disabled={isEdit} />} /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}><Form.Item label="COREN"><Controller name="coren" control={control} render={({field}) => <Input {...field} />} /></Form.Item></Col>
          <Col span={3}><Form.Item label="UF"><Controller name="ufCoren" control={control} render={({field}) => <Input {...field} maxLength={2} />} /></Form.Item></Col>
          <Col span={9}>
            <Form.Item label="Categoria">
              <Controller name="categoria" control={control} render={({field}) => (
                <Select {...field}>
                  <Select.Option value="ENFERMEIRO">Enfermeiro(a)</Select.Option>
                  <Select.Option value="TECNICO">Técnico</Select.Option>
                  <Select.Option value="AUXILIAR">Auxiliar</Select.Option>
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={6} style={{ paddingTop: 30 }}>
            <Controller name="podePrescrever" control={control} render={({field: { value, onChange }}) => (
              <Checkbox checked={value} onChange={e => onChange(e.target.checked)}>Pode Prescrever?</Checkbox>
            )} />
          </Col>
        </Row>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>Salvar</Button>
      </Form>
    </Card>
  );
};