# PROMPT — CORREÇÃO DO MÓDULO DE PRESCRIÇÕES (TELA EM BRANCO)
## Para usar no Gemini Pro

---

## DIAGNÓSTICO COMPLETO

O módulo de prescrições **existe e está implementado** no projeto, tanto no backend quanto no frontend. A tela em branco não é falta de implementação — são **4 bugs críticos** que impedem o funcionamento. Analise e corrija cada um deles.

---

## CONTEXTO DO PROJETO

**Backend:** NestJS + Prisma + PostgreSQL + Redis  
**Frontend:** React + TypeScript + Ant Design 5 + React Hook Form + Zod  
**Arquitetura:** Multi-tenant, Clean Architecture, RBAC por módulo/ação

**Fluxo do usuário afetado:**  
`Pacientes → Gestão de Pacientes → Ações → Acessar Prontuário → aba "Prescrições"` → Tela em branco

---

## BUG 1 — CRÍTICO: `role` no JWT é um UUID, não a string `'MEDICO'`

### Onde está o problema
**Arquivo:** `src/shared/application/use-cases/prescriptions/prescriptions.use-cases.ts`  
**Método:** `checkPrescriberPermission(userId, userRole, tenantId)`

### Por que quebra
No `LoginUseCase`, o payload JWT é gerado assim:
```typescript
// src/shared/application/use-cases/auth/login.use-case.ts
const payload = {
  sub: mainAccount.id,
  email: mainAccount.email,
  role: currentAccount.roleId,  // ← ENVIA O UUID DO ROLE, ex: "a1b2c3-..."
  tenantId: finalTenantId
};
```

O `JwtStrategy.validate()` devolve `payload.role` diretamente para `req.user.role`.  
O controller passa esse valor para o use-case como `userRole`:
```typescript
const userRole = (req as any).user.role; // → "a1b2c3-..." (UUID, não 'MEDICO')
```

O use-case compara:
```typescript
// NUNCA SERÁ VERDADE — userRole é um UUID, não a string 'MEDICO'
if (userRole === 'MEDICO') return;
if (userRole === 'ENFERMEIRO') { ... }
throw new ForbiddenException('Apenas médicos e enfermeiros autorizados...');
```

**Resultado:** Todo usuário recebe `403 Forbidden` ao tentar criar ou listar prescrições.

### Correção — `src/shared/application/use-cases/prescriptions/prescriptions.use-cases.ts`

Substituir o método `checkPrescriberPermission` por uma versão que busca o Role no banco pelo `userId`, em vez de comparar a string do JWT:

```typescript
// Adicionar PrismaService ao construtor do use-case
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';

// No construtor, adicionar:
constructor(
  @Inject(PRESCRIPTION_REPOSITORY_TOKEN) private readonly prescriptionRepo: IPrescriptionRepository,
  @Inject(MEDICAL_RECORD_REPOSITORY_TOKEN) private readonly medicalRecordRepo: IMedicalRecordRepository,
  @Inject(NURSE_REPOSITORY_TOKEN) private readonly nurseRepo: INurseRepository,
  private readonly prisma: PrismaService, // ← ADICIONAR
) {}

// Substituir checkPrescriberPermission completo:
private async checkPrescriberPermission(userId: string, tenantId: string): Promise<{ isMedico: boolean; isNurse: boolean; nurseCanPrescribe: boolean }> {
  // Busca o Role real do usuário no banco pelo userId
  const user = await this.prisma.user.findFirst({
    where: { id: userId, tenantId, deletedAt: null },
    include: { role: { select: { nome: true, permissoes: true } } }
  });

  if (!user) throw new ForbiddenException('Usuário não encontrado.');

  const roleName = user.role?.nome?.toUpperCase() || '';
  const permissoes = (user.role?.permissoes as any) || {};

  // Verifica se tem permissão de criar prescrição via RBAC
  const hasPermission = permissoes?.prescricao?.criar === true;

  if (!hasPermission) {
    throw new ForbiddenException('Você não possui permissão para criar prescrições.');
  }

  const isMedico = roleName.includes('MEDICO') || roleName.includes('MÉDICO');
  const isNurse = roleName.includes('ENFERMEIRO') || roleName.includes('TECNICO') || roleName.includes('AUXILIAR');

  if (isNurse) {
    const nurse = await this.nurseRepo.findByUserId(userId, tenantId);
    if (!nurse?.podePrescrever) {
      throw new ForbiddenException('Este enfermeiro não possui permissão para prescrever.');
    }
  }

  return { isMedico, isNurse, nurseCanPrescribe: isNurse };
}
```

Atualizar todas as chamadas do método nos métodos `create` e `addItem`:

```typescript
// ANTES (quebrado):
await this.checkPrescriberPermission(userId, userRole, tenantId);

// DEPOIS (correto):
await this.checkPrescriberPermission(userId, tenantId);
```

Também atualizar a criação do objeto `Prescription` para usar o tipo correto:
```typescript
// O campo tipoPrescrito deve ser determinado pelo Role, não pelo JWT
const { isMedico } = await this.checkPrescriberPermission(userId, tenantId);
const tipoPrescrito = isMedico ? 'MEDICO' : 'ENFERMEIRO';

const prescription = new Prescription(
  prescriptionId, tenantId, recordId, data.hospitalizationId || null,
  userId, tipoPrescrito, // ← usar tipoPrescrito determinado pelo banco
  ...
);
```

Registrar o `PrismaService` no `PrescriptionsModule` (já é global via `@Global()`, mas confirmar que o módulo pode acessá-lo):
```typescript
// src/modules/prescriptions/prescriptions.module.ts
// PrismaService é global (@Global no PrismaModule), não precisa adicionar no providers
// Apenas adicionar no construtor do use-case com injeção automática
```

---

## BUG 2 — CRÍTICO: `PrescriptionList` recebe objeto em vez de array

### Onde está o problema
**Arquivo:** `frontend/src/modules/prescriptions/components/PrescriptionList/index.tsx`

### Por que quebra
O backend retorna:
```json
{ "data": [...], "total": 10, "page": 1, "limit": 10 }
```

O frontend faz:
```typescript
const response = await api.get(`/medical-records/${recordId}/prescriptions`);
setPrescriptions(response.data); // ← seta o OBJETO inteiro, não o array
```

A tabela Ant Design recebe `{ data, total, page, limit }` onde espera um array → **tela em branco**.

### Correção — `frontend/src/modules/prescriptions/components/PrescriptionList/index.tsx`

```typescript
// ANTES (quebrado):
const response = await api.get(`/medical-records/${recordId}/prescriptions`);
setPrescriptions(response.data);

// DEPOIS (correto):
const response = await api.get(`/medical-records/${recordId}/prescriptions`);
setPrescriptions(response.data?.data || []); // ← extrair o array corretamente
```

Também adicionar tipagem correta no estado:
```typescript
// ANTES:
const [prescriptions, setPrescriptions] = useState([]);

// DEPOIS:
const [prescriptions, setPrescriptions] = useState<any[]>([]);
```

---

## BUG 3 — CRÍTICO: `POST /prescriptions` é a rota errada

### Onde está o problema
**Arquivo:** `frontend/src/modules/prescriptions/components/PrescriptionFormModal/index.tsx`

### Por que quebra
O controller do backend define a rota como:
```typescript
@Post('medical-records/:recordId/prescriptions')
```

O frontend chama:
```typescript
// ERRADO — rota inexistente no backend
await api.post('/prescriptions', payload);
```

**Resultado:** `404 Not Found` ao tentar salvar uma prescrição.

### Correção — `frontend/src/modules/prescriptions/components/PrescriptionFormModal/index.tsx`

```typescript
// ANTES (quebrado):
await api.post('/prescriptions', payload);

// DEPOIS (correto):
await api.post(`/medical-records/${recordId}/prescriptions`, payload);
```

---

## BUG 4 — CRÍTICO: `dataInicio` obrigatório no backend mas ausente no formulário

### Onde está o problema
**Arquivo:** `frontend/src/modules/prescriptions/components/PrescriptionFormModal/index.tsx`  
**Backend:** `src/modules/prescriptions/dto/prescription.dto.ts`

### Por que quebra
O DTO do backend exige `dataInicio` como campo obrigatório:
```typescript
// prescription.dto.ts
@ApiProperty()
@IsDateString()
@IsNotEmpty()
dataInicio: string; // ← OBRIGATÓRIO
```

O formulário do frontend:
1. Não tem campo `dataInicio` no formulário visual
2. Não inclui `dataInicio` no schema Zod
3. Não inclui `dataInicio` nos valores default do `append`

**Resultado:** `400 Bad Request` ao tentar salvar — `dataInicio should not be empty`.

### Correção completa — `frontend/src/modules/prescriptions/components/PrescriptionFormModal/index.tsx`

**1. Adicionar `dataInicio` ao schema Zod:**
```typescript
const prescriptionItemSchema = z.object({
  medicationId: z.string().min(1, 'Selecione o medicamento'),
  dosagem: z.string().min(1, 'Informe a dosagem'),
  viaAdministracao: z.enum(['ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INALATORIA', 'OUTRO']),
  frequencia: z.string().min(1, 'Informe a frequência'),
  horariosProgramados: z.array(z.string()).min(1, 'Adicione pelo menos um horário'),
  duracaoDias: z.number().min(1).optional(),
  dataInicio: z.string().min(1, 'Informe a data de início'), // ← ADICIONAR
  observacoes: z.string().optional(),
});
```

**2. Atualizar o valor default do `useForm`:**
```typescript
const { control, handleSubmit, reset, formState: { errors } } = useForm<PrescriptionFormData>({
  resolver: zodResolver(prescriptionSchema),
  defaultValues: {
    items: [{
      dosagem: '',
      viaAdministracao: 'ORAL',
      frequencia: '',
      horariosProgramados: [],
      dataInicio: new Date().toISOString().split('T')[0], // ← hoje como default
    }]
  }
});
```

**3. Atualizar o `append` do `useFieldArray`:**
```typescript
onClick={() => append({
  medicationId: '',
  dosagem: '',
  viaAdministracao: 'ORAL',
  frequencia: '',
  horariosProgramados: [],
  dataInicio: new Date().toISOString().split('T')[0], // ← ADICIONAR
})}
```

**4. Adicionar o campo visual no formulário** (dentro do `Card` de cada item, na `Row` de frequência):
```tsx
<Col span={6}>
  <Form.Item
    label="Data de Início"
    required
    validateStatus={errors.items?.[index]?.dataInicio ? 'error' : ''}
    help={errors.items?.[index]?.dataInicio?.message}
  >
    <Controller
      name={`items.${index}.dataInicio`}
      control={control as any}
      render={({ field }) => (
        <Input
          {...field}
          type="date"
          min={new Date().toISOString().split('T')[0]}
        />
      )}
    />
  </Form.Item>
</Col>
```

---

## ARQUIVO COMPLETO CORRIGIDO — `PrescriptionList/index.tsx`

Reescrever o arquivo completo com todas as correções aplicadas:

```tsx
import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Empty } from 'antd';
import { PlusOutlined, StopOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';
import { Can } from '../../../../shared/hooks/usePermission';
import { PrescriptionFormModal } from '../PrescriptionFormModal';

interface PrescriptionListProps {
  recordId: string;
}

export const PrescriptionList = ({ recordId }: PrescriptionListProps) => {
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]); // ← tipagem correta
  const [modalVisible, setModalVisible] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const response = await api.get(`/medical-records/${recordId}/prescriptions`);
      // ← BUG 2 CORRIGIDO: extrair o array do objeto paginado
      setPrescriptions(response.data?.data || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.warning('Você não tem permissão para visualizar as prescrições.');
      } else {
        message.error('Erro ao carregar prescrições');
      }
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleSuspend = async (prescriptionId: string) => {
    try {
      await api.patch(`/prescriptions/${prescriptionId}/suspend`, {
        observacao: 'Suspensa pelo médico'
      });
      message.success('Prescrição suspensa com sucesso');
      fetchPrescriptions();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Erro ao suspender prescrição');
    }
  };

  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'dataHora',
      key: 'dataHora',
      width: 140,
      render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Prescritor',
      key: 'prescritor',
      render: (rec: any) => rec.prescritor?.nomeCompleto || '—',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoPrescrito',
      key: 'tipo',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'MEDICO' ? 'blue' : 'cyan'}>
          {val === 'MEDICO' ? 'Médica' : 'Enfermagem'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val: string) => (
        <Tag color={val === 'ATIVA' ? 'green' : val === 'SUSPENSA' ? 'red' : 'default'}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (rec: any) => (
        <Space>
          <Button size="small" icon={<PrinterOutlined />}>PDF</Button>
          {rec.status === 'ATIVA' && (
            <Can module="prescricao" action="editar">
              <Popconfirm
                title="Suspender esta prescrição?"
                description="Todas as administrações pendentes serão canceladas."
                onConfirm={() => handleSuspend(rec.id)}
                okText="Suspender"
                cancelText="Cancelar"
              >
                <Button size="small" danger icon={<StopOutlined />}>Suspender</Button>
              </Popconfirm>
            </Can>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: any) => {
    const itemColumns = [
      {
        title: 'Medicamento',
        key: 'med',
        render: (rec: any) => <strong>{rec.medication?.nome || rec.medicationId}</strong>
      },
      { title: 'Dosagem', dataIndex: 'dosagem', key: 'dosagem' },
      { title: 'Via', dataIndex: 'viaAdministracao', key: 'via' },
      { title: 'Frequência', dataIndex: 'frequencia', key: 'freq' },
      { title: 'Início', dataIndex: 'dataInicio', key: 'inicio', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
      { title: 'Dias', dataIndex: 'duracaoDias', key: 'dias', render: (v: number) => v ? `${v}d` : '—' },
      {
        title: 'Horários',
        key: 'hours',
        render: (rec: any) => rec.horariosProgramados?.map((h: string) => (
          <Tag key={h} style={{ marginBottom: 2 }}>{h}</Tag>
        )) || '—'
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (val: string) => (
          <Tag color={val === 'ATIVO' ? 'blue' : val === 'CANCELADO' ? 'red' : 'default'}>
            {val}
          </Tag>
        )
      },
    ];

    return (
      <Table
        columns={itemColumns}
        dataSource={record.items || []}
        pagination={false}
        rowKey="id"
        size="small"
        locale={{ emptyText: 'Nenhum item nesta prescrição' }}
      />
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Can module="prescricao" action="criar">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Nova Prescrição
          </Button>
        </Can>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={prescriptions}
        rowKey="id"
        expandable={{ expandedRowRender }}
        locale={{ emptyText: <Empty description="Nenhuma prescrição registrada" /> }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />

      <PrescriptionFormModal
        visible={modalVisible}
        recordId={recordId}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          fetchPrescriptions();
        }}
      />
    </div>
  );
};
```

---

## ARQUIVO COMPLETO CORRIGIDO — `PrescriptionFormModal/index.tsx`

Reescrever o arquivo completo com todos os bugs corrigidos:

```tsx
import { useEffect, useState } from 'react';
import {
  Modal, Form, Select, Input, InputNumber, Button, Space,
  message, Divider, Card, Row, Col, DatePicker
} from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import api from '../../../../shared/services/api';

const TODAY = dayjs().format('YYYY-MM-DD');

const prescriptionItemSchema = z.object({
  medicationId: z.string().min(1, 'Selecione o medicamento'),
  dosagem: z.string().min(1, 'Informe a dosagem'),
  viaAdministracao: z.enum(['ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INALATORIA', 'OUTRO']),
  frequencia: z.string().min(1, 'Informe a frequência'),
  horariosProgramados: z.array(z.string()).min(1, 'Adicione pelo menos um horário'),
  duracaoDias: z.number().min(1).optional(),
  dataInicio: z.string().min(1, 'Informe a data de início'), // ← BUG 4 CORRIGIDO
  observacoes: z.string().optional(),
});

const prescriptionSchema = z.object({
  observacoes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'Adicione pelo menos um medicamento'),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

const DEFAULT_ITEM = {
  medicationId: '',
  dosagem: '',
  viaAdministracao: 'ORAL' as const,
  frequencia: '',
  horariosProgramados: [] as string[],
  duracaoDias: 1,
  dataInicio: TODAY, // ← BUG 4 CORRIGIDO
  observacoes: '',
};

interface PrescriptionFormModalProps {
  visible: boolean;
  recordId: string;
  hospitalizationId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const PrescriptionFormModal = ({
  visible, recordId, hospitalizationId, onCancel, onSuccess
}: PrescriptionFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);

  const { control: ctrl, handleSubmit, reset, formState: { errors } } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: { items: [{ ...DEFAULT_ITEM }] }
  });
  const control = ctrl as any;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (visible) {
      reset({ items: [{ ...DEFAULT_ITEM }] });
      fetchMedications();
    }
  }, [visible, reset]);

  const fetchMedications = async () => {
    try {
      const response = await api.get('/medications', { params: { limit: 500 } });
      setMedications(response.data?.data || []);
    } catch {
      message.error('Erro ao carregar lista de medicamentos');
    }
  };

  const onSubmit = async (data: PrescriptionFormData) => {
    setLoading(true);
    try {
      const payload = {
        hospitalizationId: hospitalizationId || undefined,
        observacoes: data.observacoes,
        items: data.items.map(item => ({
          ...item,
          dataInicio: item.dataInicio, // ex: "2025-01-15"
        })),
      };

      // ← BUG 3 CORRIGIDO: rota correta com recordId no path
      await api.post(`/medical-records/${recordId}/prescriptions`, payload);
      message.success('Prescrição registrada com sucesso!');
      onSuccess();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) {
        message.error(msg.join(', '));
      } else {
        message.error(msg || 'Erro ao salvar prescrição');
      }
    } finally {
      setLoading(false);
    }
  };

  const VIA_OPTIONS = [
    { value: 'ORAL', label: 'Oral' },
    { value: 'INTRAVENOSA', label: 'Intravenosa (IV)' },
    { value: 'INTRAMUSCULAR', label: 'Intramuscular (IM)' },
    { value: 'SUBCUTANEA', label: 'Subcutânea (SC)' },
    { value: 'TOPICA', label: 'Tópica' },
    { value: 'INALATORIA', label: 'Inalatória' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  return (
    <Modal
      title="Nova Prescrição Médica"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      width={1000}
      destroyOnClose
      okText="Salvar Prescrição"
      cancelText="Cancelar"
    >
      <Form layout="vertical">
        <Form.Item label="Observações Gerais (Opcional)">
          <Controller
            name="observacoes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                placeholder="Orientações gerais para a equipe de enfermagem"
              />
            )}
          />
        </Form.Item>

        <Divider orientation="left">Itens da Prescrição</Divider>

        {errors.items?.root && (
          <p style={{ color: 'red' }}>{errors.items.root.message}</p>
        )}

        {fields.map((field, index) => (
          <Card
            key={field.id}
            size="small"
            style={{ marginBottom: 16, background: '#fafafa', border: '1px solid #d9d9d9' }}
            title={`Medicamento ${index + 1}`}
            extra={
              fields.length > 1 && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => remove(index)}
                >
                  Remover
                </Button>
              )
            }
          >
            <Row gutter={16}>
              <Col span={14}>
                <Form.Item
                  label="Medicamento"
                  required
                  validateStatus={errors.items?.[index]?.medicationId ? 'error' : ''}
                  help={errors.items?.[index]?.medicationId?.message}
                >
                  <Controller
                    name={`items.${index}.medicationId`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        showSearch
                        optionFilterProp="label"
                        placeholder="Buscar medicamento pelo nome..."
                        onChange={(value) => {
                          const med = medications.find((m: any) => m.id === value);
                          if (med && (med.totalStock ?? 1) <= 0) {
                            Modal.confirm({
                              title: 'Medicamento sem estoque',
                              icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                              content: `${med.nome} não possui estoque. Deseja prescrever assim mesmo?`,
                              okText: 'Sim, prescrever',
                              cancelText: 'Cancelar',
                              onOk: () => field.onChange(value),
                            });
                          } else {
                            field.onChange(value);
                          }
                        }}
                        options={medications.map((m: any) => ({
                          value: m.id,
                          label: `${m.nome} ${m.concentracao ? `(${m.concentracao})` : ''} — ${m.formaFarmaceutica || ''}`,
                        }))}
                        notFoundContent="Nenhum medicamento encontrado"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  label="Dosagem"
                  required
                  validateStatus={errors.items?.[index]?.dosagem ? 'error' : ''}
                  help={errors.items?.[index]?.dosagem?.message}
                >
                  <Controller
                    name={`items.${index}.dosagem`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Ex: 500mg" />}
                  />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  label="Via de Administração"
                  required
                >
                  <Controller
                    name={`items.${index}.viaAdministracao`}
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={VIA_OPTIONS} />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={5}>
                <Form.Item
                  label="Frequência"
                  required
                  validateStatus={errors.items?.[index]?.frequencia ? 'error' : ''}
                  help={errors.items?.[index]?.frequencia?.message}
                >
                  <Controller
                    name={`items.${index}.frequencia`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        showSearch
                        placeholder="Ex: 8/8h"
                        options={[
                          { value: '1x/dia', label: '1x/dia' },
                          { value: '2x/dia', label: '2x/dia (12/12h)' },
                          { value: '3x/dia', label: '3x/dia (8/8h)' },
                          { value: '4x/dia', label: '4x/dia (6/6h)' },
                          { value: '6x/dia', label: '6x/dia (4/4h)' },
                          { value: 'S/N', label: 'Se necessário (S/N)' },
                          { value: 'Dose única', label: 'Dose única' },
                        ]}
                        allowClear
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item
                  label="Horários Programados"
                  required
                  validateStatus={errors.items?.[index]?.horariosProgramados ? 'error' : ''}
                  help={(errors.items?.[index]?.horariosProgramados as any)?.message}
                >
                  <Controller
                    name={`items.${index}.horariosProgramados`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        mode="tags"
                        placeholder="Digite o horário (ex: 08:00) e pressione Enter"
                        tokenSeparators={[',', ' ']}
                        options={[
                          { value: '06:00', label: '06:00' },
                          { value: '08:00', label: '08:00' },
                          { value: '10:00', label: '10:00' },
                          { value: '12:00', label: '12:00' },
                          { value: '14:00', label: '14:00' },
                          { value: '16:00', label: '16:00' },
                          { value: '18:00', label: '18:00' },
                          { value: '20:00', label: '20:00' },
                          { value: '22:00', label: '22:00' },
                          { value: '00:00', label: '00:00' },
                        ]}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Duração (dias)">
                  <Controller
                    name={`items.${index}.duracaoDias`}
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        min={1}
                        max={365}
                        style={{ width: '100%' }}
                        placeholder="7"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                {/* ← BUG 4 CORRIGIDO: campo dataInicio adicionado */}
                <Form.Item
                  label="Data de Início"
                  required
                  validateStatus={errors.items?.[index]?.dataInicio ? 'error' : ''}
                  help={errors.items?.[index]?.dataInicio?.message}
                >
                  <Controller
                    name={`items.${index}.dataInicio`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="date"
                        min={TODAY}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Observações">
                  <Controller
                    name={`items.${index}.observacoes`}
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Obs. específicas" />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}

        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={() => append({ ...DEFAULT_ITEM })}
          style={{ marginTop: 8 }}
        >
          Adicionar Medicamento
        </Button>
      </Form>
    </Modal>
  );
};
```

---

## ARQUIVOS A MODIFICAR NO BACKEND

### `src/shared/application/use-cases/prescriptions/prescriptions.use-cases.ts`

As alterações já foram descritas no BUG 1. Resumo:
1. Adicionar `PrismaService` no construtor
2. Reescrever `checkPrescriberPermission` para buscar o Role real no banco via `userId`
3. Atualizar todas as chamadas de `checkPrescriberPermission` removendo o parâmetro `userRole`
4. Determinar `tipoPrescrito` pelo resultado do novo `checkPrescriberPermission`

### Verificar que `PrismaService` está acessível

O `PrismaModule` usa `@Global()`, portanto o `PrismaService` é injetável em qualquer módulo sem precisar declará-lo no `providers` do `PrescriptionsModule`.

---

## CHECKLIST DE VERIFICAÇÃO APÓS AS CORREÇÕES

Após aplicar todas as correções, verificar:

- [ ] `GET /medical-records/:recordId/prescriptions` retorna `{ data: [], total: 0, page: 1, limit: 10 }` — status 200
- [ ] `POST /medical-records/:recordId/prescriptions` com body válido (incluindo `dataInicio`) — status 201
- [ ] A aba "Prescrições" no prontuário exibe a tabela (mesmo vazia, sem erro)
- [ ] O botão "Nova Prescrição" abre o modal corretamente
- [ ] O formulário salva sem erro 400 (`dataInicio` preenchido)
- [ ] O formulário salva sem erro 403 (`checkPrescriberPermission` busca no banco)
- [ ] Expandir uma linha da tabela mostra os itens da prescrição
- [ ] O botão "Suspender" funciona e atualiza o status
- [ ] Zero erros TypeScript em `PrescriptionList/index.tsx` e `PrescriptionFormModal/index.tsx`
