import { useEffect, useState } from 'react';
import { Typography, Tabs, Button, Space, message, Card, Spin, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';
import { BedGrid } from '../../components/BedGrid';
import { WardFormModal } from '../../components/WardFormModal';
import { BedFormModal } from '../../components/BedFormModal';
import { Can } from '../../../../shared/hooks/usePermission';

const { Title, Text } = Typography;

export const StructureListPage = () => {
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState<any[]>([]);
  const [activeWardId, setActiveWardId] = useState<string>('');
  const [beds, setBeds] = useState<any[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const [wardModal, setWardModal] = useState({ visible: false, data: null });
  const [bedModal, setBedModal] = useState({ visible: false, data: null });

  const fetchWards = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wards');
      const data = response.data.data;
      setWards(data);
      if (data.length > 0 && !activeWardId) {
        setActiveWardId(data[0].id);
      }
    } catch (error) {
      message.error('Erro ao carregar alas');
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async (wardId: string) => {
    if (!wardId) return;
    setLoadingBeds(true);
    try {
      const response = await api.get(`/wards/${wardId}/beds`);
      setBeds(response.data);
    } catch (error) {
      message.error('Erro ao carregar leitos');
    } finally {
      setLoadingBeds(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    if (activeWardId) {
      fetchBeds(activeWardId);
    }
  }, [activeWardId]);

  const handleDeleteWard = async (id: string) => {
    try {
      await api.delete(`/wards/${id}`);
      message.success('Ala removida');
      fetchWards();
    } catch (error) {
      message.error('Erro ao remover ala');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Estrutura Hospitalar</Title>
        <Can module="sistema" action="administrar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setWardModal({ visible: true, data: null })}>
            Nova Ala
          </Button>
        </Can>
      </div>

      <Card loading={loading}>
        {wards.length > 0 ? (
          <Tabs
            activeKey={activeWardId}
            onChange={setActiveWardId}
            tabBarExtraContent={
              <Space>
                <Can module="sistema" action="administrar">
                  <Tooltip title="Editar Ala Atual">
                    <Button 
                      size="small" 
                      icon={<EditOutlined />} 
                      onClick={() => setWardModal({ visible: true, data: wards.find(w => w.id === activeWardId) })} 
                    />
                  </Tooltip>
                  <Popconfirm title="Excluir ala?" onConfirm={() => handleDeleteWard(activeWardId)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<PlusOutlined />} 
                    onClick={() => setBedModal({ visible: true, data: null })}
                  >
                    Adicionar Leito
                  </Button>
                </Can>
              </Space>
            }
            items={wards.map(ward => ({
              key: ward.id,
              label: (
                <span>
                  <ApartmentOutlined />
                  {ward.nome}
                </span>
              ),
              children: (
                <div style={{ padding: '20px 0' }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">{ward.tipo} • {ward.andar || 'Andar não informado'} • Capacidade: {ward.capacidade}</Text>
                  </div>
                  {loadingBeds ? <Spin /> : (
                    <BedGrid 
                      beds={beds} 
                      onEditBed={(bed) => setBedModal({ visible: true, data: bed })} 
                    />
                  )}
                </div>
              )
            }))}
          />
        ) : (
          <Empty description="Nenhuma ala cadastrada no sistema" />
        )}
      </Card>

      <WardFormModal 
        visible={wardModal.visible}
        initialValues={wardModal.data}
        onCancel={() => setWardModal({ visible: false, data: null })}
        onSuccess={() => {
          setWardModal({ visible: false, data: null });
          fetchWards();
        }}
      />

      <BedFormModal 
        visible={bedModal.visible}
        wardId={activeWardId}
        initialValues={bedModal.data}
        onCancel={() => setBedModal({ visible: false, data: null })}
        onSuccess={() => {
          setBedModal({ visible: false, data: null });
          fetchBeds(activeWardId);
        }}
      />
    </div>
  );
};