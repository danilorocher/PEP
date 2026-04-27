import { Spin } from 'antd';

interface LoadingFallbackProps {
  message?: string;
  minHeight?: string | number;
}

export const LoadingFallback = ({ message = 'Carregando dados...', minHeight = '200px' }: LoadingFallbackProps) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight, 
      flexDirection: 'column', 
      gap: 16 
    }}>
      <Spin size="large" />
      <span style={{ color: '#8c8c8c' }}>{message}</span>
    </div>
  );
};