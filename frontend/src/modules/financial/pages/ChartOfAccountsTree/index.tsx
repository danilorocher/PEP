import React, { useEffect, useState } from 'react';
import { Tree, Card, Button, message, Tag } from 'antd';
import { PlusOutlined, DollarOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { financialService } from '../../services/financial.service';
import { ChartOfAccountsFormModal } from '../../components/ChartOfAccountsFormModal';

export const ChartOfAccountsTree: React.FC = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 🔥 NOVO: Controle de visibilidade do Modal
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const data = await financialService.getChartOfAccountsTree();
      setTreeData(data);
    } catch (error) {
      message.error('Erro ao carregar o plano de contas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const renderTitle = (node: any) => (
    <span>
      {node.tipo === 'RECEITA' ? <DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} /> : <MinusCircleOutlined style={{ color: '#f5222d', marginRight: 8 }} />}
      <strong>{node.codigo}</strong> - {node.nome}
      {!node.aceitaLancamento && <Tag style={{ marginLeft: 8 }} color="default">Sintética</Tag>}
    </span>
  );

  const formatTreeData = (nodes: any[]): any[] => {
    return nodes.map(node => ({
      ...node,
      title: renderTitle(node),
      children: node.children ? formatTreeData(node.children) : []
    }));
  };

  return (
    <Card 
      title="Plano de Contas" 
      extra={
        // 🔥 NOVO: Função onClick ativada!
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Nova Conta
        </Button>
      }
    >
      {loading ? <p>Carregando...</p> : (
        <Tree
          showLine
          defaultExpandAll
          treeData={formatTreeData(treeData)}
        />
      )}

      {/* 🔥 NOVO: Modal injetado na tela */}
      <ChartOfAccountsFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchTree(); // Atualiza a árvore logo após salvar!
        }}
      />
    </Card>
  );
};