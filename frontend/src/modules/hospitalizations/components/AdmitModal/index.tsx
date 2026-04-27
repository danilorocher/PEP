import { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, Input, message, Row, Col } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../../shared/services/api';

const admitSchema = z.object({
  patientId: z.string().min(1, 'Selecione o paciente'),
  wardId: z.string().min(1, 'Selecione a ala'),
  bedId: z.string().min(1, 'Selecione o leito'),
  medicoResponsavelId: z.string().min(1, 'Selecione o médico'),
  cid10AdmissaoId: z.string().min(1, 'Informe o CID-10'),
  convenioId: z.string().optional(),
  motivoInternacao: z.string().min(3, 'Informe o motivo'),
  tipoInternacao: z.enum(['ELETIVA', 'URGENCIA', 'EMERGENCIA']),
  tipoAcomodacao: z.enum(['ENFERMARIA', 'APARTAMENTO', 'UTI']),
  numeroGuiaInternacao: z.string().optional(),
  dataPrevistaAlta: z.any().optional(),
});

type AdmitFormData = z.infer<typeof admitSchema>;

interface AdmitModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export const AdmitModal = ({ visible, onCancel, onSuccess }: AdmitModalProps) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [cids, setCids] = useState([]);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<AdmitFormData>({
    resolver: zodResolver(admitSchema),
    defaultValues: {
      tipoInternacao: 'ELETIVA',
      tipoAcomodacao: 'ENFERMARIA',
    }
  });

  const selectedWard = watch('wardId');

  useEffect(() => {
    if (visible) {
      reset();
      fetchInitialData();
    }
  }, [visible, reset]);

  useEffect(() => {
    if (selectedWard) {
      api.get('/beds/available', { params: { wardId: selectedWard } })
        .then(res => setBeds(res.data))
        .catch(() => message.error('Erro ao carregar leitos disponíveis'));
    } else {
      setBeds([]);
    }
  }, [selectedWard]);

  const fetchInitialData = async () => {
    try {
      const [pRes, dRes, wRes, cRes] = await Promise.all([
        api.get('/patients', { params: { limit: 100, status: 'ATIVO' } }),
        api.get('/doctors', { params: { limit: 100, status: 'ATIVO' } }),
        api.get('/wards'),
        // No mundo real buscaria com paginação/busca, aqui simulamos uma lista para o select
        api.get('/admin/cid10').catch(() => ({ data: [] })) 
      ]);
      setPatients(pRes.data.data || []);
      setDoctors(dRes.data.data || []);
      setWards(wRes.data.data || []);
      setCids(cRes.data || [{ id: 'CID-MOCK', codigo: 'J18.9', descricao: 'Pneumonia não especificada' }]);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
    }
  };

  const onSubmit = async (data: AdmitFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        dataPrevistaAlta: data.dataPrevistaAlta ? data.dataPrevistaAlta.toISOString() : undefined,
      };
      await api.post('/hospitalizations/admit', payload);
      message.success('Paciente internado com sucesso');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao admitir paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Admitir Paciente (Internação)"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Paciente" required validateStatus={errors.patientId ? 'error' : ''} help={errors.patientId?.message}>
              <Controller name="patientId" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione">
                  {patients.map((p: any) => <Select.Option key={p.id} value={p.id}>{p.nomeCompleto}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Médico Responsável" required validateStatus={errors.medicoResponsavelId ? 'error' : ''} help={errors.medicoResponsavelId?.message}>
              <Controller name="medicoResponsavelId" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione">
                  {doctors.map((d: any) => <Select.Option key={d.id} value={d.id}>{d.nomeCompleto}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Ala" required validateStatus={errors.wardId ? 'error' : ''} help={errors.wardId?.message}>
              <Controller name="wardId" control={control} render={({ field }) => (
                <Select {...field} placeholder="Selecione a ala">
                  {wards.map((w: any) => <Select.Option key={w.id} value={w.id}>{w.nome}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Leito (Apenas Livres)" required validateStatus={errors.bedId ? 'error' : ''} help={errors.bedId?.message}>
              <Controller name="bedId" control={control} render={({ field }) => (
                <Select {...field} placeholder="Selecione o leito" disabled={!selectedWard}>
                  {beds.map((b: any) => <Select.Option key={b.id} value={b.id}>{b.numero} - {b.tipo}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="CID-10 Admissão" required validateStatus={errors.cid10AdmissaoId ? 'error' : ''} help={errors.cid10AdmissaoId?.message}>
              <Controller name="cid10AdmissaoId" control={control} render={({ field }) => (
                <Select {...field} showSearch optionFilterProp="children" placeholder="Selecione">
                  {cids.map((c: any) => <Select.Option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</Select.Option>)}
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Motivo da Internação" required validateStatus={errors.motivoInternacao ? 'error' : ''} help={errors.motivoInternacao?.message}>
              <Controller name="motivoInternacao" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Tipo Internação" required validateStatus={errors.tipoInternacao ? 'error' : ''}>
              <Controller name="tipoInternacao" control={control} render={({ field }) => (
                <Select {...field}>
                  <Select.Option value="ELETIVA">Eletiva</Select.Option>
                  <Select.Option value="URGENCIA">Urgência</Select.Option>
                  <Select.Option value="EMERGENCIA">Emergência</Select.Option>
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Acomodação" required validateStatus={errors.tipoAcomodacao ? 'error' : ''}>
              <Controller name="tipoAcomodacao" control={control} render={({ field }) => (
                <Select {...field}>
                  <Select.Option value="ENFERMARIA">Enfermaria</Select.Option>
                  <Select.Option value="APARTAMENTO">Apartamento</Select.Option>
                  <Select.Option value="UTI">UTI</Select.Option>
                </Select>
              )} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Data Prevista de Alta">
              <Controller name="dataPrevistaAlta" control={control} render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" />} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};