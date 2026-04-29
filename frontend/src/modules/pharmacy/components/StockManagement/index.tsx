import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Row, Col, Typography } from 'antd';
import { PlusOutlined, InboxOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addStockSchema } from '../../schemas/pharmacy.schema';
import { pharmacyService } from '../../services/pharmacy.service';

const { Title, Text } = Typography;

export const StockManagement: React.FC = () => {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(addStockSchema),
  });

  const fetchMedications = async () => {
    try {
      const res = await pharmacyService.getAllMedications();
      
      // Tenta extrair a lista independentemente de como o seu NestJS devolve a paginação
      const dataArray = res.data?.data || res.data || [];
      
      if (Array.isArray(dataArray)) {
        setMedications(dataArray);
      } else {
        setMedications([]);
        console.warn("A API de medicamentos não retornou um Array válido:", res.data);
      }
      
    } catch (err: any) {
      console.error('🔍 DETALHE DO ERRO AO BUSCAR MEDICAMENTOS:', err.response || err);
      
      // Se der erro 404, a rota no seu backend provavelmente é no singular (/medication)
      if (err.response?.status === 404) {
         message.error('Erro 404: Rota de medicamentos não encontrada no backend.');
      } else {
         message.error('Erro ao carregar lista de medicamentos.');
      }
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const onSubmitStock = async (data: any) => {
    setLoading(true);
    try {
      await pharmacyService.addStock({
        ...data,
        validade: data.validade.toISOString(),
      });
      message.success('Lote registrado no estoque com sucesso!');
      setModalVisible(false);
      reset();
    } catch (err) {
      message.error('Erro ao registrar entrada no estoque.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Medicamento', dataIndex: 'nome', key: 'nome' },
    { title: 'Princípio Ativo', dataIndex: 'principioAtivo', key: 'principioAtivo' },
    { title: 'Forma Farmacêutica', dataIndex: 'formaFarmaceutica', key: 'formaFarmaceutica' },
    { 
      title: 'Ações', 
      key: 'acoes', 
      render: (record: any) => (
        <Button 
          type="link" 
          onClick={() => {
            reset({ medicationId: record.id });
            setModalVisible(true);
          }}
        >
          Dar Entrada
        </Button>
      )
    }
  ];

  return (
    <Card title={<><InboxOutlined /> Gestão de Estoque</>} extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        Nova Entrada Avulsa
      </Button>
    }>
      <Table 
        dataSource={medications} 
        columns={columns} 
        rowKey="id" 
        size="small" 
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Registro de Entrada de Lote"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit(onSubmitStock)}
        confirmLoading={loading}
        width={700}
        destroyOnClose
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Medicamento" validateStatus={errors.medicationId ? 'error' : ''} help={errors.medicationId?.message as string}>
                <Controller name="medicationId" control={control} render={({ field }) => (
                  <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione o medicamento">
                    {medications.map(m => (
                      <Select.Option key={m.id} value={m.id}>{m.nome} - {m.concentracao || ''}</Select.Option>
                    ))}
                  </Select>
                )} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Número do Lote" validateStatus={errors.lote ? 'error' : ''} help={errors.lote?.message as string}>
                <Controller name="lote" control={control} render={({ field }) => <Input {...field} placeholder="Ex: L123456" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Validade" validateStatus={errors.validade ? 'error' : ''} help={errors.validade?.message as string}>
                <Controller name="validade" control={control} render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Quantidade (Unid/Caixas)" validateStatus={errors.quantidade ? 'error' : ''} help={errors.quantidade?.message as string}>
                <Controller name="quantidade" control={control} render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0.1} />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Localização (Setor)" validateStatus={errors.localizacao ? 'error' : ''} help={errors.localizacao?.message as string}>
                <Controller name="localizacao" control={control} render={({ field }) => <Input {...field} placeholder="Ex: Farmácia Central, UTI" />} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};