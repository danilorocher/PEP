import { Tag } from 'antd';

interface StatusTagProps {
  status: string;
}

export const StatusTag = ({ status }: StatusTagProps) => {
  const getColor = (s: string) => {
    const normalizedStatus = s?.toUpperCase() || '';
    
    switch (normalizedStatus) {
      case 'ATIVO':
      case 'MINISTRADO':
      case 'AUTORIZADA':
      case 'PAGA':
      case 'REALIZADO':
      case 'LIVRE':
      case 'ALTA_CURADO':
      case 'ALTA_MELHORADO':
        return 'green';
        
      case 'INATIVO':
      case 'CANCELADO':
      case 'CANCELADA':
      case 'NEGADA':
      case 'OCUPADO':
      case 'SUSPENSA':
      case 'OBITO':
      case 'FALTOU':
        return 'red';
        
      case 'AGENDADO':
      case 'ENVIADA':
      case 'RESERVADO':
      case 'ABERTO':
      case 'SOLICITADO':
      case 'ATIVA':
        return 'blue';
        
      case 'GLOSADA':
      case 'MANUTENCAO':
      case 'RECUSADO_PACIENTE':
      case 'ATRASADO':
      case 'TRANSFERENCIA':
      case 'ALTA_PEDIDO':
        return 'orange';
        
      case 'EM_ATENDIMENTO':
      case 'COLETADO':
      case 'EM_ANALISE':
        return 'cyan';
        
      case 'FECHADO':
      case 'ARQUIVADO':
      case 'CONCLUIDO':
      case 'CONCLUIDA':
      case 'ALTA':
      case 'TRANSFERIDO':
        return 'purple';
        
      default:
        return 'default';
    }
  };

  const formatText = (text: string) => {
    if (!text) return 'DESCONHECIDO';
    return text.replace(/_/g, ' ');
  };

  return <Tag color={getColor(status)}>{formatText(status)}</Tag>;
};