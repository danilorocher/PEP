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
  WalletOutlined,
  HeartOutlined,
  ExperimentOutlined,
  ScissorOutlined
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
      key: 'attendance-group',
      icon: <IdcardOutlined />,
      label: 'Atendimento Clínico',
      children: [
        { key: '/attendance', label: 'Painel da Recepção' },
        { key: '/attendance/doctor', label: 'Fila do Médico' },
        { key: '/attendance/nurse', label: 'Fila da Enfermagem' },
      ]
    },
    {
      key: '/medical-records',
      icon: <SolutionOutlined />,
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
        {
          key: 'cadastro-group',
          label: 'Cadastro',
          children: [
            { key: '/professionals', label: 'Profissionais' }, 
            { key: '/occupations', label: 'Cargos / Funções' },
            { key: '/specialties', label: 'Especialidade Médica' },
            { key: '/admin', label: 'Estrutura Hospitalar' },
            { key: '/cid', label: 'CID' }, 
            { key: '/exam-catalog', label: 'Exames' }, 
          ]
        },
        { key: '/companies', label: 'Minhas Unidades' },
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
      {/* CABEÇALHO DO MENU (Fixo) */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#001529' }}>
        <h2 style={{ color: 'white', margin: 0 }}>{collapsed ? 'P+' : 'PEP+'}</h2>
      </div>

      {/* 🔥 CORREÇÃO DO SCROLL: Envolvemos o Menu numa div que calcula a altura da tela menos o cabeçalho e ativa a rolagem vertical */}
      <div style={{ height: 'calc(100vh - 64px)', overflowY: 'auto', overflowX: 'hidden' }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            const groupKeys = ['admin-group', 'billing-group', 'attendance-group', 'cadastro-group'];
            if (!groupKeys.includes(key)) {
              navigate(key);
            }
          }}
        />
      </div>
    </Sider>
  );
};