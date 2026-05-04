import React, { useState } from 'react';
import { Modal, Table, Input, Button, message, Typography, Tag, Space } from 'antd';
import { CheckCircleOutlined, AlertOutlined } from '@ant-design/icons';
import { labService } from '../../services/lab.service';

const { Text } = Typography;

export const ResultEntryModal = ({ visible, order, onCancel, onSuccess }: any) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [values, setValues] = useState<{ [key: string]: string }>({});

  const handleRelease = async (resultId: string) => {
    const val = values[resultId];
    if (!val) return message.warning('Insira um valor.');
    setLoading(resultId);
    try {
      await labService.releaseResult(resultId, { value: val });
      message.success('Resultado liberado!');
      onSuccess();
    } catch (err: any) {
      message.error('Erro ao liberar resultado.');
    } finally {
      setLoading(null);
    }
  };

  const columns = [
    { title: 'Exame', dataIndex: ['exam', 'name'], key: 'exam' },
    { 
      title: 'Valor', 
      dataIndex: 'value', 
      key: 'value',
      render: (val: string, record: any) => record.isCritical ? <Tag color="error" icon={<AlertOutlined />}>{val}</Tag> : val 
    },
    {
      title: 'Ação',
      key: 'action',
      render: (record: any) => (
        <Space>
          <Input 
            size="small" 
            placeholder="Valor" 
            onChange={(e) => setValues({...values, [record.id]: e.target.value})} 
            style={{ width: 100 }}
          />
          <Button 
            size="small" 
            type="primary" 
            loading={loading === record.id} 
            onClick={() => handleRelease(record.id)}
          >
            Liberar
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Modal title="Lançar Resultados" open={visible} onCancel={onCancel} footer={null} width={800}>
      <Table dataSource={order?.results || []} columns={columns} rowKey="id" pagination={false} />
    </Modal>
  );
};