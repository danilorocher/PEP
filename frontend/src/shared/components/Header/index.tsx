import React from 'react';
import { Layout, Button, Dropdown, Avatar, Badge, Input, Space, Typography } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  BellOutlined, 
  SearchOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  BankOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTenantStore } from '../../../store/useTenantStore';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { currentTenant } = useTenantStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Meu Perfil',
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined style={{ color: '#DC2626' }} />,
        label: <span style={{ color: '#DC2626', fontWeight: 500 }}>Encerrar Sessão</span>,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <AntHeader 
      style={{ 
        padding: '0 24px', 
        background: '#FFFFFF', 
        height: 64, 
        lineHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E2E8F0', // Borda Slate 200 sutil
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.03)' // Sombra quase invisível para separar do conteúdo
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        {/* Toggle da Sidebar (Responsividade Operacional) */}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ fontSize: '16px', width: 40, height: 40, color: '#475569' }}
        />

        {/* Unidade Hospitalar Ativa - Contexto Persistente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: '#F1F5F9', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
          <BankOutlined style={{ color: '#0F766E' }} />
          <Text strong style={{ color: '#334155', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {currentTenant?.name || 'UNIDADE NÃO SELECIONADA'}
          </Text>
        </div>

        {/* Busca Global (Prontuário/Paciente) - Padrão Ouro em ERP Médico */}
        <div style={{ marginLeft: '24px', maxWidth: '400px', width: '100%' }}>
          <Input 
            placeholder="Buscar paciente, prontuário (PEP) ou guia..." 
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />} 
            style={{ borderRadius: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          />
        </div>
      </div>

      <Space size={24} style={{ display: 'flex', alignItems: 'center' }}>
        {/* Central de Alertas e Notificações */}
        <Badge count={3} size="small" color="#DC2626">
          <Button type="text" icon={<BellOutlined style={{ fontSize: '18px', color: '#475569' }} />} />
        </Badge>

        {/* Perfil Profissional */}
        <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'background 0.2s' }} className="hover:bg-slate-50">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
              <Text strong style={{ fontSize: '14px', color: '#1E293B' }}>{user?.nome || 'Usuário'}</Text>
              <Text style={{ fontSize: '12px', color: '#64748B' }}>{user?.role?.nome || 'Administrador'}</Text>
            </div>
            <Avatar style={{ backgroundColor: '#0F766E', color: '#FFFFFF', border: '2px solid #CCFBF1' }} icon={<UserOutlined />} />
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};