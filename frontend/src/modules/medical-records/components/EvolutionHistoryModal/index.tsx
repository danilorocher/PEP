import { useEffect, useState } from 'react';
import { Modal, Timeline, Typography, Spin, message, Tag } from 'antd';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const { Text } = Typography;

interface EvolutionHistoryModalProps {
  visible: boolean;
  evolutionId: string | null;
  onCancel: () => void;
}

export const EvolutionHistoryModal = ({ visible, evolutionId, onCancel }: EvolutionHistoryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (visible && evolutionId) {
      fetchHistory();
    }
  }, [visible, evolutionId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/medical-records/evolutions/${evolutionId}/history`);
      setHistory(response.data);
    } catch (error) {
      message.error('Erro ao carregar histórico da evolução');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Histórico de Alterações"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={600}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
      ) : (
        <Timeline
          items={history.map((item) => ({
            children: (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Versão {item.versao}</Text>
                  <span style={{ marginLeft: 8 }}><Tag color="blue">{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</Tag></span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  {item.dadosSnapshot?.descricao}
                </div>
              </div>
            ),
          }))}
        />
      )}
    </Modal>
  );
};