import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../routes';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          // 🔥 Paleta Enterprise: Clinical Slate & Cyan
          colorPrimary: '#0F766E', // Teal/Cyan clínico (Confiança, assepsia, precisão)
          colorInfo: '#0284C7',
          colorSuccess: '#059669', // Verde médico (Sinais vitais normais, faturado)
          colorWarning: '#D97706',
          colorError: '#DC2626', // Vermelho alerta (Risco clínico, estorno)
          
          // 🔥 Geometria Corporativa
          borderRadius: 2, // Cantos quase retos (Efeito Bloomberg/Tasy)
          wireframe: false,
          
          // 🔥 Tipografia e Cores de Fundo
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          colorTextBase: '#1E293B', // Slate 800 (Alta legibilidade sem o contraste agressivo do preto puro)
          colorBgBase: '#F8FAFC',   // Slate 50 (Fundo frio, conforto ocular para ecrãs hospitalares)
          colorBorder: '#E2E8F0',   // Slate 200
        },
        components: {
          Table: {
            headerBg: '#F1F5F9', // Fundo de tabela sóbrio
            headerColor: '#475569', // Texto de cabeçalho denso
            rowHoverBg: '#F1F5F9',
            paddingContentVerticalLG: 8, // 🔥 Alta Densidade: Menos espaço em branco, mais dados!
            paddingContentHorizontalLG: 12,
            fontSize: 13, // Fonte otimizada para leitura de dados numéricos
          },
          Button: {
            controlHeight: 32, // Botões mais compactos e ágeis
            paddingInline: 16,
            fontWeight: 500,
            defaultShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            primaryShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          },
          Card: {
            colorBgContainer: '#FFFFFF',
            boxShadowTertiary: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)', // Sombra premium
            paddingLG: 20,
          },
          Modal: {
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // Profundidade extrema
            headerBg: '#F8FAFC',
            paddingLG: 24,
          },
          Menu: {
            itemBg: '#020617', // Sidebar Ultra Dark (Slate 950) - Sofisticação máxima
            itemColor: '#94A3B8', // Slate 400
            itemSelectedBg: '#0F172A', // Slate 900
            itemSelectedColor: '#2DD4BF', // Teal 400 (Destaque clínico)
            itemHoverBg: '#0F172A',
            itemHoverColor: '#F8FAFC',
          },
          Input: {
            controlHeight: 36, // Formulários corporativos elegantes
            colorBgContainer: '#FFFFFF',
          },
          Select: {
            controlHeight: 36,
          }
        }
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;