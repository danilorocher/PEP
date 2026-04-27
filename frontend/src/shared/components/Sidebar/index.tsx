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
import { usePermission } from '../../hooks/usePermission';

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
      visible: usePermission('pacientes', 'visualizar'),
    },
    {
      key: '/scheduling',
      icon: <CalendarOutlined />,
      label: 'Agendamento',
      visible: usePermission('agendamento', 'visualizar'),
    },
    {
      key: '/medical-records',
      icon: <SolutionOutlined />,
      label: 'Prontuários',
      visible: usePermission('prontuario', 'visualizar'),
    },
    {
      key: '/hospitalizations',
      icon: <MedicineBoxOutlined />,
      label: 'Internações',
      visible: usePermission('internacao', 'visualizar'),
    },
    {
      key: '/medication',
      icon: <MedicineBoxOutlined />,
      label: 'Medicações',
      visible: usePermission('medicacao', 'visualizar'),
    },
    {
      key: '/exams',
      icon: <FileSearchOutlined />,
      label: 'Exames',
      visible: usePermission('exames', 'visualizar'),
    },
    {
      key: '/billing',
      icon: <ContainerOutlined />,
      label: 'Faturamento',
      visible: usePermission('faturamento', 'visualizar'),
    },
    {
      key: '/reports',
      icon: <AuditOutlined />,
      label: 'Relatórios',
      visible: usePermission('relatorios', 'visualizar'),
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Sistema',
      visible: usePermission('sistema', 'administrar'),
    },
  ].filter(item => item.visible !== false);

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
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};