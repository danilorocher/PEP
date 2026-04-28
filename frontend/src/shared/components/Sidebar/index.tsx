import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  MedicineBoxOutlined, 
  FileSearchOutlined,
  ContainerOutlined,
  SolutionOutlined,
  SettingOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

export const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/patients',
      icon: <TeamOutlined />,
      label: 'Pacientes',
    },
    {
      key: '/scheduling',
      icon: <CalendarOutlined />,
      label: 'Agendamento',
    },
    {
      key: '/medical-records',
      icon: <SolutionOutlined />,
      label: 'Prontuários',
    },
    {
      key: '/hospitalizations',
      icon: <MedicineBoxOutlined />,
      label: 'Internações',
    },
    {
      key: '/medication',
      icon: <MedicineBoxOutlined />,
      label: 'Medicações',
    },
    {
      key: '/exams',
      icon: <FileSearchOutlined />,
      label: 'Exames',
    },
    {
      key: '/billing',
      icon: <ContainerOutlined />,
      label: 'Faturamento',
    },
    {
      key: '/reports',
      icon: <AuditOutlined />,
      label: 'Relatórios',
    },
    {
      key: 'admin-group',
      icon: <SettingOutlined />,
      label: 'Sistema',
      // Apontando para as rotas reais que existem no seu index.tsx
      children: [
        { key: '/professionals', label: 'Profissionais' }, 
        { key: '/admin', label: 'Estrutura Hospitalar' },
      ]
    },
  ];

  return (
    <Sider trigger={null} collapsible collapsed={collapsed} theme="light" style={{
      borderRight: '1px solid #f0f0f0',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
    }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#001529' }}>
        <h2 style={{ color: 'white', margin: 0 }}>{collapsed ? 'P+' : 'PEP+'}</h2>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => {
          // Só navega se o clique não for no grupo "Sistema"
          if (key !== 'admin-group') {
            navigate(key);
          }
        }}
      />
    </Sider>
  );
};