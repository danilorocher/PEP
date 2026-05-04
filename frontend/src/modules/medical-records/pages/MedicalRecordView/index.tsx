import { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Spin, message, Space, Tag, Button, Tabs, Divider } from 'antd';
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  FileTextOutlined, 
  MedicineBoxOutlined, 
  FileSearchOutlined,
  SafetyOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { EvolutionTimeline } from '../../components/EvolutionTimeline';
import { EvolutionFormModal } from '../../components/EvolutionFormModal';
import { EvolutionHistoryModal } from '../../components/EvolutionHistoryModal';
import { PrescriptionList } from '../../../prescriptions/components/PrescriptionList';

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
        setEvolutions(eRes.data.data);
        setVitalHistory(vRes.data?.data || []);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        message.error('Prontuário ativo não encontrado para este paciente.');
      } else {
        message.error('Erro ao carregar prontuário');
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchRecordData();
  }, [fetchRecordData]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
  if (!patient || !record) return <div style={{ padding: 24 }}><Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>Voltar</Button><Divider /><h2>Prontuário indisponível</h2></div>;

  const tabs = [
    {
      key: 'evolutions',
      label: <span><FileTextOutlined /> Evoluções Clínicas</span>,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Can module="prontuario" action="criar">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormModal({ visible: true, data: null })}>
                Nova Evolução
              </Button>
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
      children: <div style={{ padding: 24, textAlign: 'center' }}>Módulo de Exames</div>
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} />
        <Title level={2} style={{ margin: 0 }}>Prontuário Eletrônico</Title>
        <Tag color={record.status === 'ABERTO' ? 'green' : 'red'}>{record.status}</Tag>
      </Space>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: 18 }}>{patient.nomeCompleto}</Text>
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

      <Card bodyStyle={{ padding: '0 24px 24px 24px' }}>
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