import { Layout, Button, Space, Typography, Avatar, Dropdown, theme } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined, GlobalOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTenantStore } from '../../../store/useTenantStore';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { subdomain } = useTenantStore();
  const { token } = theme.useToken();

  const userMenuItems: any[] = [
    {
      key: 'profile',
      label: 'Meu Perfil',
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Sair do Sistema',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <AntHeader style={{ 
      background: token.colorBgContainer, 
      padding: '0 24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      position: 'sticky',
      top: 0,
      zIndex: 1,
      width: '100%'
    }}>
      <Space>
        <GlobalOutlined style={{ color: token.colorPrimary }} />
        <Text strong style={{ color: token.colorPrimary }}>UNIDADE: {subdomain.toUpperCase()}</Text>
      </Space>

      <Space style={{ fontSize: "16px" }}>
        <Button type="text" icon={<BellOutlined />} />
        
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <Space style={{ cursor: 'pointer' }}>
            <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
              <div style={{ fontWeight: 'bold' }}>{user?.name || user?.nomeCompleto}</div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {typeof user?.role === 'string' ? user.role : (user?.role as any)?.nome ?? ''}
              </Text>
            </div>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};