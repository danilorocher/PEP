import React, { useState } from 'react';
import { Layout } from 'antd';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // O estado de colapso da sidebar é controlado no layout pai para sincronizar com o Header
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      {/* Menu Lateral Institucional */}
      <Sidebar collapsed={collapsed} />

      {/* Área Principal de Operação */}
      <Layout 
        style={{ 
          marginLeft: collapsed ? 80 : 256, // Sincronizado com a largura da Sidebar
          transition: 'margin-left 0.2s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: 'var(--bg-app)' // Fundo clínico Slate 50
        }}
      >
        {/* Central de Comando Superior */}
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Content Box - Rolagem independente apenas nesta área */}
        <Content 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            padding: '24px 32px', // Densidade controlada: respira nas bordas, comprime no centro
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};