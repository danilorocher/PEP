import { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Spin, message, Space, Tag, Button, Tabs, Divider, Tooltip } from 'antd';
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  FileTextOutlined, 
  MedicineBoxOutlined, 
  FileSearchOutlined,
  SafetyOutlined,
  LineChartOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { EvolutionTimeline } from '../../components/EvolutionTimeline';
import { EvolutionFormModal } from '../../components/EvolutionFormModal';
import { EvolutionHistoryModal } from '../../components/EvolutionHistoryModal';
import { PrescriptionList } from '../../../prescriptions/components/PrescriptionList';
import { PatientExamList } from '../../../exams/components/PatientExamList';
import { VitalSigns } from '../../../assistance/components/VitalSigns';
import { FluidBalance } from '../../../assistance/components/FluidBalance';
import { ClinicalDashboard } from '../../../assistance/components/ClinicalDashboard';
import { RiskAssessments } from '../../../assistance/components/RiskAssessments'; 

const { Title, Text } = Typography;

export const MedicalRecordViewPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [record, setRecord] = useState<any>(null);
  const [evolutions, setEvolutions] = useState<any[]>([]);
  const [vitalHistory, setVitalHistory] = useState<any[]>([]);

  const [formModal, setFormModal] = useState({ visible: false, data: null });
  const [historyModal, setHistoryModal] = useState<{ visible: boolean; id: string | null }>({ visible: false, id: null });

  const fetchRecordData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/patients/${patientId}/medical-record`)
      ]);
      setPatient(pRes.data);
      setRecord(rRes.data);

      if (rRes.data?.id) {
        const [eRes, vRes] = await Promise.all([
          api.get(`/medical-records/${rRes.data.id}/evolutions`, { params: { page: 1, limit: 100 } }),
          api.get(`/assistance/vital-signs/patient/${patientId}`).catch(() => ({ data: { data: [] } }))
        ]);
        setEvolutions(eRes.data.data || eRes.data);
        setVitalHistory(vRes.data?.data || []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar os dados do prontuário.');
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  }, [patientId, navigate]);

  useEffect(() => {
    fetchRecordData();
  }, [fetchRecordData]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
  if (!patient || !record) return <div style={{ padding: 24 }}><Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>Voltar</Button><Divider /><h2>Prontuário indisponível</h2></div>;

  // 🔥 REGRA CLÍNICA: Verifica se o prontuário está apto para receber novas prescrições/evoluções
  const isRecordActive = ['ABERTO', 'EM_ANDAMENTO'].includes(record.status);

  const tabs = [
    {
      key: 'evolutions',
      label: <span><FileTextOutlined /> Evoluções Clínicas</span>,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Can module="prontuario" action="criar">
              {/* 🔥 BOTÃO BLINDADO: Só permite clicar se o paciente estiver no hospital (Ativo) */}
              <Tooltip title={!isRecordActive ? 'Modo Leitura: Inicie um atendimento na recepção para poder evoluir o paciente.' : ''}>
                <Button 
                  type="primary" 
                  icon={!isRecordActive ? <LockOutlined /> : <PlusOutlined />} 
                  onClick={() => setFormModal({ visible: true, data: null })}
                  disabled={!isRecordActive}
                  style={{ background: isRecordActive ? '#0F766E' : undefined }}
                >
                  Nova Evolução
                </Button>
              </Tooltip>
            </Can>
          </div>
          <EvolutionTimeline 
            evolutions={evolutions} 
            onEdit={(evo) => setFormModal({ visible: true, data: evo })}
            onViewHistory={(id) => setHistoryModal({ visible: true, id })}
          />
        </div>
      )
    },
    {
      key: 'assistance',
      label: <span><SafetyOutlined /> Assistência e Monitoramento</span>,
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card title={<Space><LineChartOutlined /> Monitoramento Clínico</Space>} size="small">
             <ClinicalDashboard data={vitalHistory} />
          </Card>
          <VitalSigns patientId={patientId!} hospitalizationId={record?.hospitalizationId} />
          <RiskAssessments patientId={patientId!} hospitalizationId={record?.hospitalizationId} />
          <FluidBalance patientId={patientId!} hospitalizationId={record?.hospitalizationId} />
        </Space>
      )
    },
    {
      key: 'prescriptions',
      label: <span><MedicineBoxOutlined /> Prescrições</span>,
      children: <PrescriptionList recordId={record.id} />
    },
    {
      key: 'exams',
      label: <span><FileSearchOutlined /> Exames</span>,
      children: <PatientExamList patientId={patientId!} recordId={record.id} hospitalizationId={record?.hospitalizationId} />
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} />
        <Title level={3} style={{ margin: 0, color: '#1E293B' }}>Prontuário Eletrônico</Title>
        {/* 🔥 TAG DE STATUS INTELIGENTE */}
        <Tag 
          color={isRecordActive ? 'green' : 'default'} 
          style={{ fontSize: '13px', padding: '4px 12px', fontWeight: 600, border: '1px solid', letterSpacing: '0.5px' }}
        >
          {isRecordActive ? 'ATIVO (EM ATENDIMENTO)' : 'MODO LEITURA (FECHADO)'}
        </Tag>
      </Space>

      <Card style={{ marginBottom: 24, border: '1px solid #E2E8F0', borderRadius: '6px' }}>
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: 18, color: '#0F766E' }}>{patient.nomeCompleto}</Text>
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary">CPF: {patient.cpf}</Text>
            <Text type="secondary">Registro PEP: {record.numero}</Text>
            <Text type="secondary">Nascimento: {new Date(patient.dataNascimento).toLocaleDateString()}</Text>
          </Space>
          <Space style={{ marginTop: 8 }}>
            {patient.alergias?.map((a: string) => <Tag color="red" key={a}>{a}</Tag>)}
            {patient.comorbidades?.map((c: string) => <Tag color="orange" key={c}>{c}</Tag>)}
          </Space>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: '0 24px 24px 24px' }} style={{ border: '1px solid #E2E8F0', borderRadius: '6px' }}>
        <Tabs defaultActiveKey="evolutions" items={tabs} />
      </Card>

      {record.id && (
        <EvolutionFormModal 
          visible={formModal.visible}
          recordId={record.id}
          initialValues={formModal.data}
          onCancel={() => setFormModal({ visible: false, data: null })}
          onSuccess={() => { setFormModal({ visible: false, data: null }); fetchRecordData(); }}
        />
      )}

      <EvolutionHistoryModal 
        visible={historyModal.visible}
        evolutionId={historyModal.id}
        onCancel={() => setHistoryModal({ visible: false, id: null })}
      />
    </div>
  );
};