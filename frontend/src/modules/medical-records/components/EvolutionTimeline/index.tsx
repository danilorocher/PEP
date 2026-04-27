import { Timeline, Typography, Card, Button, Space, Tag, Empty } from 'antd';
import { EditOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Can } from '../../../../shared/hooks/usePermission';
import { useAuthStore } from '../../../../store/useAuthStore';

const { Text, Paragraph } = Typography;

interface EvolutionTimelineProps {
  evolutions: any[];
  onEdit: (evolution: any) => void;
  onViewHistory: (evolutionId: string) => void;
}

export const EvolutionTimeline = ({ evolutions, onEdit, onViewHistory }: EvolutionTimelineProps) => {
  const { user } = useAuthStore();

  if (!evolutions || evolutions.length === 0) {
    return <Empty description="Nenhuma evolução registrada neste prontuário" />;
  }

  const items = evolutions.map((evo) => {
    const isOwner = user?.id === evo.profissionalId;

    return {
      color: evo.tipoProfissional === 'MEDICO' ? 'blue' : 'green',
      children: (
        <Card size="small" style={{ width: '100%', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <Text strong style={{ fontSize: 16 }}>{dayjs(evo.dataHora).format('DD/MM/YYYY HH:mm')}</Text>
              <br />
              <Text type="secondary">{evo.tipoProfissional}</Text>
              {evo.cid10Id && <Tag color="blue" style={{ marginLeft: 8 }}>CID Associado</Tag>}
              {evo.versao > 1 && <Tag color="orange" style={{ marginLeft: 8 }}>Editado (v{evo.versao})</Tag>}
            </div>
            
            <Space>
              {evo.versao > 1 && (
                <Button size="small" icon={<HistoryOutlined />} onClick={() => onViewHistory(evo.id)}>
                  Histórico
                </Button>
              )}
              {isOwner && (
                <Can module="prontuario" action="editar">
                  <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(evo)}>
                    Editar
                  </Button>
                </Can>
              )}
            </Space>
          </div>
          
          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {evo.descricao}
          </Paragraph>
        </Card>
      ),
    };
  });

  return (
    <div style={{ marginTop: 24 }}>
      <Timeline items={items} />
    </div>
  );
};