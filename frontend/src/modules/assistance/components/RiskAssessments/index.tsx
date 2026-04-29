import React, { useState } from 'react';
import { Card, Form, Select, Button, message, Tabs, notification, Row, Col, Typography } from 'antd';
import { CheckSquareOutlined, WarningOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bradenSchema, morseSchema, glasgowSchema } from '../../schemas/assistance.schema';
import { assistanceService } from '../../services/assistance.service';

const { Text } = Typography;

interface Props {
  patientId: string;
  hospitalizationId?: string;
}

export const RiskAssessments: React.FC<Props> = ({ patientId, hospitalizationId }) => {
  const [loading, setLoading] = useState(false);

  // Forms independentes para cada escala
  const bradenForm = useForm({ resolver: zodResolver(bradenSchema) });
  const morseForm = useForm({ resolver: zodResolver(morseSchema) });
  const glasgowForm = useForm({ resolver: zodResolver(glasgowSchema) });

  const showResultNotification = (scaleName: string, score: number, classification: string) => {
    notification.success({
      message: `Avaliação Registrada: ${scaleName}`,
      description: (
        <div>
          <Text>Score Total: <strong>{score}</strong></Text><br />
          <Text>Classificação: <strong style={{ color: classification.includes('Alto') || classification.includes('Grave') ? 'red' : 'inherit' }}>{classification}</strong></Text>
        </div>
      ),
      icon: <WarningOutlined style={{ color: '#faad14' }} />,
      duration: 8,
    });
  };

  const onSubmitBraden = async (data: any) => {
    setLoading(true);
    try {
      const response = await assistanceService.createBraden({ ...data, patientId, hospitalizationId });
      showResultNotification('Escala de Braden', response.data.totalScore, response.data.classificacao);
      bradenForm.reset();
    } catch (err) {
      message.error('Erro ao registrar avaliação de Braden');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitMorse = async (data: any) => {
    setLoading(true);
    try {
      const response = await assistanceService.createMorse({ ...data, patientId, hospitalizationId });
      showResultNotification('Escala de Morse', response.data.totalScore, response.data.classificacao);
      morseForm.reset();
    } catch (err) {
      message.error('Erro ao registrar avaliação de Morse');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitGlasgow = async (data: any) => {
    setLoading(true);
    try {
      const response = await assistanceService.createGlasgow({ ...data, patientId, hospitalizationId });
      showResultNotification('Escala de Glasgow', response.data.totalScore, response.data.classificacao);
      glasgowForm.reset();
    } catch (err) {
      message.error('Erro ao registrar avaliação de Glasgow');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'braden',
      label: 'Escala de Braden (Lesão)',
      children: (
        <Form layout="vertical" onFinish={bradenForm.handleSubmit(onSubmitBraden)}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Percepção Sensorial" required>
                <Controller name="sensoryPerception" control={bradenForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={1}>1 - Totalmente Limitado</Select.Option>
                    <Select.Option value={2}>2 - Muito Limitado</Select.Option>
                    <Select.Option value={3}>3 - Levemente Limitado</Select.Option>
                    <Select.Option value={4}>4 - Nenhuma Limitação</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Umidade" required>
                <Controller name="moisture" control={bradenForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={1}>1 - Completamente Molhado</Select.Option>
                    <Select.Option value={2}>2 - Muito Úmido</Select.Option>
                    <Select.Option value={3}>3 - Ocasionalmente Úmido</Select.Option>
                    <Select.Option value={4}>4 - Raramente Úmido</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Atividade" required>
                <Controller name="activity" control={bradenForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={1}>1 - Acamado</Select.Option>
                    <Select.Option value={2}>2 - Confinado à Cadeira</Select.Option>
                    <Select.Option value={3}>3 - Caminha Ocasionalmente</Select.Option>
                    <Select.Option value={4}>4 - Caminha Frequentemente</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Mobilidade" required>
                <Controller name="mobility" control={bradenForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={1}>1 - Totalmente Imóvel</Select.Option>
                    <Select.Option value={2}>2 - Bastante Limitado</Select.Option>
                    <Select.Option value={3}>3 - Levemente Limitado</Select.Option>
                    <Select.Option value={4}>4 - Nenhuma Limitação</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nutrição" required>
                <Controller name="nutrition" control={bradenForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={1}>1 - Muito Pobre</Select.Option>
                    <Select.Option value={2}>2 - Inadequada</Select.Option>
                    <Select.Option value={3}>3 - Adequada</Select.Option>
                    <Select.Option value={4}>4 - Excelente</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Fricção e Cisalhamento" required>
                <Controller name="frictionShear" control={bradenForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={1}>1 - Problema</Select.Option>
                    <Select.Option value={2}>2 - Problema Potencial</Select.Option>
                    <Select.Option value={3}>3 - Nenhum Problema Aparente</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" loading={loading} icon={<CheckSquareOutlined />}>Registrar Braden</Button>
        </Form>
      )
    },
    {
      key: 'morse',
      label: 'Escala de Morse (Quedas)',
      children: (
        <Form layout="vertical" onFinish={morseForm.handleSubmit(onSubmitMorse)}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Histórico de Quedas" required>
                <Controller name="historyOfFalling" control={morseForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione"><Select.Option value={0}>Não (0)</Select.Option><Select.Option value={25}>Sim (25)</Select.Option></Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Diagnóstico Secundário" required>
                <Controller name="secondaryDiagnosis" control={morseForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione"><Select.Option value={0}>Não (0)</Select.Option><Select.Option value={15}>Sim (15)</Select.Option></Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Auxílio na Deambulação" required>
                <Controller name="ambulatoryAid" control={morseForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={0}>Nenhum / Acamado / Cadeira de Rodas (0)</Select.Option>
                    <Select.Option value={15}>Muletas / Bengala / Andador (15)</Select.Option>
                    <Select.Option value={30}>Apoia-se em móveis (30)</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Terapia Intravenosa" required>
                <Controller name="ivTherapy" control={morseForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione"><Select.Option value={0}>Não (0)</Select.Option><Select.Option value={20}>Sim (20)</Select.Option></Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Marcha" required>
                <Controller name="gait" control={morseForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={0}>Normal / Acamado / Cadeira de Rodas (0)</Select.Option>
                    <Select.Option value={10}>Fraca (10)</Select.Option>
                    <Select.Option value={20}>Comprometida / Cambaleante (20)</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Estado Mental" required>
                <Controller name="mentalStatus" control={morseForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={0}>Orientado / Capaz (0)</Select.Option>
                    <Select.Option value={15}>Esquece limitações (15)</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" loading={loading} icon={<CheckSquareOutlined />}>Registrar Morse</Button>
        </Form>
      )
    },
    {
      key: 'glasgow',
      label: 'Escala de Glasgow (Neurológica)',
      children: (
        <Form layout="vertical" onFinish={glasgowForm.handleSubmit(onSubmitGlasgow)}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Abertura Ocular" required>
                <Controller name="eyeOpening" control={glasgowForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={4}>4 - Espontânea</Select.Option>
                    <Select.Option value={3}>3 - À voz</Select.Option>
                    <Select.Option value={2}>2 - À dor</Select.Option>
                    <Select.Option value={1}>1 - Nenhuma</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Resposta Verbal" required>
                <Controller name="verbalResponse" control={glasgowForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={5}>5 - Orientado</Select.Option>
                    <Select.Option value={4}>4 - Confuso</Select.Option>
                    <Select.Option value={3}>3 - Palavras inapropriadas</Select.Option>
                    <Select.Option value={2}>2 - Sons incompreensíveis</Select.Option>
                    <Select.Option value={1}>1 - Nenhuma</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Resposta Motora" required>
                <Controller name="motorResponse" control={glasgowForm.control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    <Select.Option value={6}>6 - Obedece a comandos</Select.Option>
                    <Select.Option value={5}>5 - Localiza dor</Select.Option>
                    <Select.Option value={4}>4 - Flexão normal (retirada)</Select.Option>
                    <Select.Option value={3}>3 - Flexão anormal (decorticação)</Select.Option>
                    <Select.Option value={2}>2 - Extensão (descerebração)</Select.Option>
                    <Select.Option value={1}>1 - Nenhuma</Select.Option>
                  </Select>
                )} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" loading={loading} icon={<CheckSquareOutlined />}>Registrar Glasgow</Button>
        </Form>
      )
    }
  ];

  return (
    <Card title="Avaliação de Risco Clínico">
      <Tabs defaultActiveKey="braden" items={tabItems} type="card" />
    </Card>
  );
};