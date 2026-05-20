import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Input, Typography, Button, Tag, Row, Col, message } from 'antd';
import { SearchOutlined, BookOutlined, CloudDownloadOutlined } from '@ant-design/icons';
// 🔥 CORREÇÃO: Caminho relativo exato (4 níveis para trás)
import { api } from '../../../../shared/services/api';

const { Title, Text } = Typography;

export const CidList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Busca no Banco de Dados
  const fetchCids = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const response = await api.get('/cid', {
        params: { page, limit: pageSize, search }
      });
      setData(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      message.error('Erro ao carregar o catálogo de CIDs do banco de dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito Debounce: Evita metralhar a API a cada letra
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1); 
      fetchCids(1, searchText);
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, fetchCids]);

  // Ação de Sincronização
  const handleSyncDatabase = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/cid/sync');
      message.success(response.data.message || 'Sincronização concluída com sucesso!');
      fetchCids(1, searchText); 
    } catch (error) {
      message.error('Falha ao tentar sincronizar os dados da OMS.');
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    {
      title: 'CÓDIGO (CID-10)',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 150,
      render: (text: string) => (
        <Tag color="cyan" style={{ fontSize: '13px', fontWeight: 600, padding: '2px 8px', letterSpacing: '0.5px' }}>
          {text}
        </Tag>
      )
    },
    {
      title: 'DESCRIÇÃO DA DOENÇA',
      dataIndex: 'descricao',
      key: 'descricao',
      render: (text: string) => <Text strong style={{ color: '#1E293B', fontSize: '13px' }}>{text}</Text>
    },
    {
      title: 'CATEGORIA / CAPÍTULO',
      key: 'grupo', 
      width: 350,
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text style={{ color: '#475569', fontSize: '12px', fontWeight: 600 }}>{record.grupo}</Text>
          <Text style={{ color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase' }}>{record.capitulo}</Text>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOutlined style={{ color: '#0F766E' }} />
            Catálogo CID-10
          </Title>
          <Text style={{ color: '#64748B', fontSize: '14px' }}>
            Classificação Estatística Internacional de Doenças e Problemas Relacionados com a Saúde.
          </Text>
        </div>
        
        <Button 
          type="primary" 
          icon={<CloudDownloadOutlined />} 
          loading={syncing}
          onClick={handleSyncDatabase}
          style={{ background: '#0F766E', borderColor: '#0F766E', fontWeight: 500 }}
        >
          {syncing ? 'Sincronizando Base...' : 'Sincronizar Base Oficial'}
        </Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <Row justify="space-between" align="middle">
            <Col xs={24} sm={12} md={10}>
              <Input 
                placeholder="Pesquisar por Código (Ex: J00) ou Descrição (Ex: Asma)..." 
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />} 
                size="large"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ borderRadius: '6px', backgroundColor: '#F8FAFC' }}
              />
            </Col>
            <Col>
              <Text style={{ color: '#94A3B8', fontSize: '13px' }}>
                Total na base de dados: <strong style={{ color: '#1E293B' }}>{total}</strong>
              </Text>
            </Col>
          </Row>
        </div>

        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          size="middle"
          pagination={{ 
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page) => {
              setCurrentPage(page);
              fetchCids(page, searchText);
            },
            showSizeChanger: false,
            style: { padding: '16px 24px', margin: 0, borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }
          }}
        />
      </Card>
    </div>
  );
};