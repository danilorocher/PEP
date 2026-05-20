import React from 'react';
import { Layout, Menu, Typography } from 'antd';
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
  ScissorOutlined,
  BankOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;
const { Title } = Typography;

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Matriz de Itens do Menu - Estruturada para Alta Densidade Enterprise
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: '15px' }} />,
      label: 'Dashboard',
    },
    {
      key: '/patients',
      icon: <TeamOutlined style={{ fontSize: '15px' }} />,
      label: 'Pacientes',
    },
    {
      key: '/scheduling',
      icon: <CalendarOutlined style={{ fontSize: '15px' }} />,
      label: 'Agendamento',
    },
    {
      key: 'attendance-group',
      icon: <IdcardOutlined style={{ fontSize: '15px' }} />,
      label: 'Atendimento Clínico',
      children: [
        { key: '/attendance', label: 'Painel da Recepção' },
        { key: '/attendance/doctor', label: 'Fila do Médico' },
        { key: '/attendance/nurse', label: 'Fila da Enfermagem' },
      ]
    },
    {
      key: '/medical-records',
      icon: <SolutionOutlined style={{ fontSize: '15px' }} />,
      label: 'Buscar Prontuário', 
    },
    {
      key: '/hospitalizations',
      icon: <MedicineBoxOutlined style={{ fontSize: '15px' }} />,
      label: 'Internações',
    },
    {
      key: '/assistance',
      icon: <HeartOutlined style={{ fontSize: '15px' }} />,
      label: 'Assistência ao Paciente',
    },
    {
      key: '/medication',
      icon: <MedicineBoxOutlined style={{ fontSize: '15px' }} />,
      label: 'Medicações',
    },
    {
      key: '/pharmacy',
      icon: <MedicineBoxOutlined style={{ fontSize: '15px' }} />,
      label: 'Farmácia',
    },
    {
      key: '/surgical-center',
      icon: <ScissorOutlined style={{ fontSize: '15px' }} />,
      label: 'Bloco Cirúrgico',
    },
    {
      key: '/exams',
      icon: <FileSearchOutlined style={{ fontSize: '15px' }} />,
      label: 'Central de Exames',
    },
    {
      key: '/lab', 
      icon: <ExperimentOutlined style={{ fontSize: '15px' }} />,
      label: 'Laboratório (LIS)',
    },
    {
      key: 'billing-group',
      icon: <ContainerOutlined style={{ fontSize: '15px' }} />,
      label: 'Faturamento',
      children: [
        { 
          key: '/hospital-billing', 
          icon: <WalletOutlined style={{ fontSize: '13px' }} />, 
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
      icon: <AuditOutlined style={{ fontSize: '15px' }} />,
      label: 'Relatórios',
    },
    {
      key: 'financial-group',
      icon: <BankOutlined style={{ fontSize: '15px' }} />,
      label: 'Financeiro',
      children: [
        { key: '/financial/cost-centers', label: 'Centros de Custo' },
        { key: '/financial/chart', label: 'Plano de Contas' },
        { key: '/financial/transactions', label: 'Lançamentos' },
      ]
    },
    {
      key: 'admin-group',
      icon: <SettingOutlined style={{ fontSize: '15px' }} />,
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
            // 🔥 NOVO: Rota e Item de Menu de Convênios
            { key: '/insurances', label: 'Convênios/Planos' }, 
          ]
        },
        { key: '/companies', label: 'Minhas Unidades' },
      ]
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={256}
      collapsedWidth={80}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 20,
        background: '#020617', // Slate 950 (Fundo Premium Clínico)
        borderRight: '1px solid #0F172A', // Divisória sutil Slate 900
        boxShadow: '4px 0 24px 0 rgb(0 0 0 / 0.15)'
      }}
    >
      {/* BRANDING LOGO (Fixo no Topo da Sidebar) */}
      <div 
        style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#020617',
          borderBottom: '1px solid #0F172A',
          padding: '0 16px',
          transition: 'all 0.2s'
        }}
      >
        <Title 
          level={4} 
          style={{ 
            color: '#F8FAFC', 
            margin: 0, 
            fontWeight: 800, 
            letterSpacing: collapsed ? '0.5px' : '1.5px',
            fontSize: collapsed ? '16px' : '18px',
            textTransform: 'uppercase'
          }}
        >
          {collapsed ? (
            <span style={{ color: '#2DD4BF' }}>P+</span>
          ) : (
            <>
              PEP<span style={{ color: '#2DD4BF', fontWeight: 400 }}>+</span>
            </>
          )}
        </Title>
      </div>

      {/* ÁREA DE SCROLL INDEPENDENTE DO MENU */}
      <div 
        style={{ 
          height: 'calc(100vh - 64px)', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          paddingBottom: '24px'
        }}
      >
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ background: 'transparent', border: 'none' }}
          onClick={({ key }) => {
            // 🔥 Evita navegação incorreta ao expandir nós estruturais vazios
            const groupKeys = ['admin-group', 'billing-group', 'attendance-group', 'cadastro-group', 'financial-group'];
            if (!groupKeys.includes(key)) {
              navigate(key);
            }
          }}
        />
      </div>
    </Sider>
  );
};