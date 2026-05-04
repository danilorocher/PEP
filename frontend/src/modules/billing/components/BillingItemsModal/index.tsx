import { Modal, Table, Typography, Tag, Space, Alert } from 'antd';

const { Text } = Typography;

interface BillingItemsModalProps {
  visible: boolean;
  guide: any | null;
  onCancel: () => void;
}

export const BillingItemsModal = ({ visible, guide, onCancel }: BillingItemsModalProps) => {
  if (!guide) return null;

  const columns = [
    {
      title: 'Descrição',
      dataIndex: 'procedimentoDescricao',
      key: 'descricao',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Cód. TUSS',
      dataIndex: 'codigoTUSS',
      key: 'tuss',
      render: (text: string) => text || '-',
    },
    {
      title: 'Qtd',
      dataIndex: 'quantidade',
      key: 'qtd',
    },
    {
      title: 'Valor Unit.',
      dataIndex: 'valorUnitario',
      key: 'vlrUnit',
      render: (val: number) => `R$ ${val?.toFixed(2)}`,
    },
    {
      title: 'Valor Total',
      dataIndex: 'valorTotal',
      key: 'vlrTotal',
      render: (val: number) => `R$ ${val?.toFixed(2)}`,
    },
    {
      title: 'Status / Glosa',
      key: 'status',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.status === 'AUTORIZADO' ? 'green' : 'red'}>
            {record.status}
          </Tag>
          {record.status === 'GLOSADO' && record.motivoGlosa && (
            <Text type="danger" style={{ fontSize: '12px' }}>
              Motivo: {record.motivoGlosa}
            </Text>
          )}
        </Space>
      ),
    },
  ];

  const totalValue = guide.items?.reduce((acc: number, item: any) => acc + (item.valorTotal || 0), 0) || 0;
  const glosaValue = guide.items?.filter((i: any) => i.status === 'GLOSADO').reduce((acc: number, item: any) => acc + (item.valorTotal || 0), 0) || 0;

  return (
    <Modal
      title={`Detalhes da Guia: ${guide.numeroGuia || 'Sem Número'}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Text>Paciente: <strong>{guide.patient?.nomeCompleto}</strong></Text>
        <Text>Convênio: <strong>{guide.insurance?.nome}</strong></Text>
      </Space>

      {glosaValue > 0 && (
        <Alert 
          message="Atenção" 
          description={`Esta guia possui R$ ${glosaValue.toFixed(2)} em itens glosados/rejeitados pelo convênio.`} 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }} 
        />
      )}

      <Table 
        columns={columns} 
        dataSource={guide.items || []} 
        rowKey="id" 
        pagination={false} 
        size="small"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={4}>
              <Text strong>Total da Guia</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} colSpan={2}>
              <Text strong style={{ color: '#1890ff' }}>R$ {totalValue.toFixed(2)}</Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Modal>
  );
};