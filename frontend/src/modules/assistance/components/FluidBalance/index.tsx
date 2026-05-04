import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select, Row, Col, Space, message, Card, Tag, Typography, Divider, Input } from 'antd';
import { PlusOutlined, DownOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fluidItemSchema } from '../../schemas/assistance.schema';
import { assistanceService } from '../../services/assistance.service';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface Props {
  patientId: string;
  hospitalizationId?: string;
}

export const FluidBalance: React.FC<Props> = ({ patientId, hospitalizationId }) => {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: 'ENTRY' as 'ENTRY' | 'OUTPUT', balanceId: '' });

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(fluidItemSchema),
  });

  const fetchBalances = async () => {
    try {
      const { data } = await assistanceService.getBalancesByPatient(patientId);
      setBalances(data);
    } catch (err) {
      message.error('Erro ao carregar balanço hídrico');
    }
  };

  useEffect(() => { fetchBalances(); }, [patientId]);

  const handleOpenNewBalance = async () => {
    try {
      await assistanceService.openFluidBalance({
        patientId,
        hospitalizationId,
        dataHoraReferencia: dayjs().toISOString(),
      });
      message.success('Novo período de balanço aberto');
      fetchBalances();
    } catch (err) {
      message.error('Erro ao abrir balanço');
    }
  };

  const onSubmitItem = async (formData: any) => {
    setLoading(true);
    try {
      if (modal.type === 'ENTRY') {
        await assistanceService.addFluidEntry(modal.balanceId, formData);
      } else {
        await assistanceService.addFluidOutput(modal.balanceId, formData);
      }
      message.success('Lançamento registrado');
      setModal({ ...modal, visible: false });
      reset();
      fetchBalances();
    } catch (err) {
      message.error('Erro ao registrar item');
    } finally {
      setLoading(false);
    }
  };

  const balanceColumns = [
    { title: 'Referência', dataIndex: 'dataHoraReferencia', render: (val: string) => dayjs(val).format('DD/MM/YYYY') },
    { title: 'Total Entradas', dataIndex: 'totalInput', render: (val: number) => <Text type="success">{val} ml</Text> },
    { title: 'Total Saídas', dataIndex: 'totalOutput', render: (val: number) => <Text type="danger">{val} ml</Text> },
    { title: 'Balanço Final', dataIndex: 'balance', render: (val: number) => <Text strong style={{ color: val >= 0 ? '#1890ff' : '#cf1322' }}>{val} ml</Text> },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'EM_ANDAMENTO' ? 'processing' : 'default'}>{s}</Tag> },
    {
      title: 'Ações',
      key: 'actions',
      render: (rec: any) => rec.status === 'EM_ANDAMENTO' && (
        <Space>
          <Button size="small" icon={<ArrowUpOutlined />} onClick={() => setModal({ visible: true, type: 'ENTRY', balanceId: rec.id })}>Entrada</Button>
          <Button size="small" icon={<ArrowDownOutlined />} danger onClick={() => setModal({ visible: true, type: 'OUTPUT', balanceId: rec.id })}>Saída</Button>
        </Space>
      )
    }
  ];

  return (
    <Card title="Balanço Hídrico" extra={<Button onClick={handleOpenNewBalance} icon={<PlusOutlined />}>Abrir Período</Button>}>
      <Table dataSource={balances} columns={balanceColumns} rowKey="id" size="small" />

      <Modal 
        title={modal.type === 'ENTRY' ? "Registrar Entrada de Líquidos" : "Registrar Saída de Líquidos"} 
        open={modal.visible} 
        onCancel={() => setModal({ ...modal, visible: false })} 
        onOk={handleSubmit(onSubmitItem)} 
        confirmLoading={loading}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item label="Tipo" required>
                <Controller name="tipo" control={control} render={({ field }) => (
                  <Select {...field} placeholder="Selecione">
                    {modal.type === 'ENTRY' ? (
                      <>
                        <Select.Option value="ORAL">Oral</Select.Option>
                        <Select.Option value="INTRAVENOSA">Intravenosa</Select.Option>
                        <Select.Option value="DIETA">Dieta</Select.Option>
                      </>
                    ) : (
                      <>
                        <Select.Option value="DIURESE">Diurese</Select.Option>
                        <Select.Option value="VOMITO">Vômito</Select.Option>
                        <Select.Option value="DRENO">Dreno</Select.Option>
                      </>
                    )}
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="Volume (ml)" required>
                <Controller name="volumeMl" control={control} render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} />} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Descrição/Observação">
            <Controller name="descricao" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};