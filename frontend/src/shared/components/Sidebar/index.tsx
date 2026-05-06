import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  IdcardOutlined, 
  MedicineBoxOutlined, 
  FileSearchOutlined,
  ContainerOutlined,
  SolutionOutlined,
  SettingOutlined,
  AuditOutlined,
  BankOutlined,
  ScissorOutlined,
  WalletOutlined,
  HeartOutlined,
  ExperimentOutlined 
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
      key: '/attendance',
      icon: <IdcardOutlined />,
      label: 'Atendimento',
    },
    {
      key: '/medical-records',
      icon: <SolutionOutlined />,
      // 🔥 AQUI: Expectativa do usuário ajustada!
      label: 'Buscar Prontuário', 
    },
    {
      key: '/hospitalizations',
      icon: <MedicineBoxOutlined />,
      label: 'Internações',
    },
    {
      key: '/assistance',
      icon: <HeartOutlined />,
      label: 'Assistência ao Paciente',
    },
    {
      key: '/medication',
      icon: <MedicineBoxOutlined />,
      label: 'Medicações',
    },
    {
      key: '/pharmacy',
      icon: <MedicineBoxOutlined />,
      label: 'Farmácia',
    },
    {
      key: '/surgical-center',
      icon: <ScissorOutlined />,
      label: 'Bloco Cirúrgico',
    },
    {
      key: '/exams',
      icon: <FileSearchOutlined />,
      label: 'Central de Exames',
    },
    {
      key: '/lab', 
      icon: <ExperimentOutlined />,
      label: 'Laboratório (LIS)',
    },
    {
      key: 'billing-group',
      icon: <ContainerOutlined />,
      label: 'Faturamento',
      children: [
        { 
          key: '/hospital-billing', 
          icon: <WalletOutlined />, 
          label: 'Conta & Faturação' 
        },
        { 
          key: '/billing', 
          label: 'Guias TISS' 
        },
      ]
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
      children: [
        { key: '/professionals', label: 'Profissionais' }, 
        { key: '/companies', label: 'Minhas Unidades' },
        { key: '/admin', label: 'Estrutura Hospitalar' },
        { key: '/exam-catalog', label: 'Catálogo de Exames' },
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
          if (key !== 'admin-group' && key !== 'billing-group') {
            navigate(key);
          }
        }}
      />
    </Sider>
  );
};