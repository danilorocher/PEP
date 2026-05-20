import React from 'react';

interface StatusTagProps {
  status: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const getStyles = (status: string) => {
    const s = status?.toUpperCase() || '';
    
    // SUCESSO (Verde Esmeralda Clínico)
    if (['PAGO', 'ATIVO', 'CONCLUIDO', 'APROVADO', 'ALTA', 'LIBERADO'].includes(s)) {
      return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }; 
    }
    // ALERTA (Âmbar/Laranja Corporativo)
    if (['PENDENTE', 'AGUARDANDO', 'EM_ANDAMENTO', 'INTERNADO', 'PARCIAL'].includes(s)) {
      return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' }; 
    }
    // PERIGO/ERRO (Vermelho Carmesim)
    if (['CANCELADO', 'INATIVO', 'FALHA', 'ERRO', 'SUSPENSO', 'OBITO'].includes(s)) {
      return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }; 
    }
    // NEUTRO (Slate Grey)
    return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }; 
  };

  const { bg, text, border } = getStyles(status);

  return (
    <span 
      style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        display: 'inline-block',
        lineHeight: '16px'
      }}
    >
      {status}
    </span>
  );
};