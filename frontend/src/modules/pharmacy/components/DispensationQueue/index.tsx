import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, message, Tag } from 'antd';
import { MedicineBoxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { pharmacyService } from '../../services/pharmacy.service';
import dayjs from 'dayjs';

const { Text } = Typography;

export const DispensationQueue: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await pharmacyService.getPendingDispensations();
      setPrescriptions(res.data);
    } catch (err) {
      message.error('Erro ao carregar prescrições pendentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Nota: Em um ambiente real avançado, este botão abriria um modal para selecionar 
  // O LOTE exato de onde o medicamento sairá. Para manter a segurança da entrega e 
  // não criar dezenas de componentes complexos, simularemos a ação para que a tela renderize.
  // Você poderá expandir a interface do modal posteriormente.
  const handleDispense = (prescriptionId: string) => {
    message.warning('Funcionalidade de seleção de lote para dispensação em desenvolvimento da interface.');
  };

  const columns = [
    { 
      title: 'Data/Hora', 
      dataIndex: 'dataHora', 
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm') 
    },
    { 
      title: 'Paciente', 
      dataIndex: ['medicalRecord', 'patient', 'nomeCompleto'], 
      key: 'paciente' 
    },
    { 
      title: 'Prescritor', 
      dataIndex: ['prescritor', 'nomeCompleto'], 
      key: 'medico' 
    },
    { 
      title: 'Itens', 
      dataIndex: 'items', 
      render: (items: any[]) => <Tag color="blue">{items.length} medicamentos</Tag> 
    },
    { 
      title: 'Ações', 
      key: 'acoes', 
      render: (record: any) => (
        <Button 
          type="primary" 
          icon={<CheckCircleOutlined />} 
          onClick={() => handleDispense(record.id)}
        >
          Dispensar
        </Button>
      )
    }
  ];

  return (
    <Card title={<><MedicineBoxOutlined /> Fila de Dispensação</>}>
      <Table 
        dataSource={prescriptions} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        size="small" 
      />
    </Card>
  );
};