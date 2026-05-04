import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Row, Col, Select, DatePicker, Space, Typography, message, Divider, Tag } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Title } = Typography;

const patientSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome muito curto'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  cns: z.string().optional(),
  dataNascimento: z.any(),
  sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  telefone: z.string().optional(),
  convenioId: z.string().optional(),
  alergias: z.array(z.string()).default([]),
  comorbidades: z.array(z.string()).default([]),
  grupoSanguineo: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export const PatientFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      alergias: [],
      comorbidades: [],
      sexo: 'OUTRO'
    }
  });

  useEffect(() => {
    if (isEdit) {
      const loadPatient = async () => {
        try {
          const response = await api.get(`/patients/${id}`);
          const p = response.data;
          reset({
            ...p,
            dataNascimento: dayjs(p.dataNascimento),
            alergias: p.alergias || [],
            comorbidades: p.comorbidades || [],
          });
        } catch (error) {
          message.error('Erro ao carregar dados do paciente');
          navigate('/patients');
        }
      };
      loadPatient();
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        dataNascimento: data.dataNascimento.toISOString(),
      };

      if (isEdit) {
        await api.patch(`/patients/${id}`, payload);
        message.success('Paciente atualizado com sucesso');
      } else {
        await api.post('/patients', payload);
        message.success('Paciente cadastrado e prontuário gerado');
      }
      navigate('/patients');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao salvar paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} />
        <Title level={2} style={{ margin: 0 }}>{isEdit ? 'Editar Paciente' : 'Novo Paciente'}</Title>
      </Space>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Card title="Dados Identificadores" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Nome Completo" required validateStatus={errors.nomeCompleto ? 'error' : ''} help={errors.nomeCompleto?.message as string}>
                <Controller name="nomeCompleto" control={control} render={({ field }) => <Input {...field} />} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="CPF (Apenas números)" required validateStatus={errors.cpf ? 'error' : ''} help={errors.cpf?.message as string}>
                <Controller name="cpf" control={control} render={({ field }) => <Input {...field} maxLength={11} disabled={isEdit} />} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="CNS" validateStatus={errors.cns ? 'error' : ''} help={errors.cns?.message as string}>
                <Controller name="cns" control={control} render={({ field }) => <Input {...field} maxLength={15} />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Data de Nascimento" required validateStatus={errors.dataNascimento ? 'error' : ''} help={errors.dataNascimento?.message as string}>
                <Controller name="dataNascimento" control={control} render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" />} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Sexo" required>
                <Controller name="sexo" control={control} render={({ field }) => (
                  <Select {...field}>
                    <Select.Option value="MASCULINO">Masculino</Select.Option>
                    <Select.Option value="FEMININO">Feminino</Select.Option>
                    <Select.Option value="OUTRO">Outro</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Telefone">
                <Controller name="telefone" control={control} render={({ field }) => <Input {...field} />} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tipo Sanguíneo">
                <Controller name="grupoSanguineo" control={control} render={({ field }) => (
                  <Select {...field} allowClear>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <Select.Option key={type} value={type.replace('+', '_POSITIVO').replace('-', '_NEGATIVO')}>{type}</Select.Option>
                    ))}
                  </Select>
                )} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Informações Clínicas" bordered={false} style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Alergias">
                <Controller name="alergias" control={control} render={({ field }) => (
                  <Select {...field} mode="tags" style={{ width: '100%' }} placeholder="Digite e pressione Enter" tokenSeparators={[',']} />
                )} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Comorbidades">
                <Controller name="comorbidades" control={control} render={({ field }) => (
                  <Select {...field} mode="tags" style={{ width: '100%' }} placeholder="Digite e pressione Enter" tokenSeparators={[',']} />
                )} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/patients')}>Cancelar</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Salvar Registro
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};