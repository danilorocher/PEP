import React, { useMemo } from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const MODULE_DESCRIPTIONS: Record<string, { pode: string, naoPode: string }> = {
  pacientes:   { pode: 'Cadastrar e editar pacientes',          naoPode: 'Gerenciar pacientes' },
  prontuario:  { pode: 'Gerenciar Prontuário Eletrônico',       naoPode: 'Acessar prontuários' },
  prescricao:  { pode: 'Criar e assinar prescrições médicas',   naoPode: 'Acessar prescrições médicas'     },
  medicacao:   { pode: 'Administrar medicação aos pacientes',   naoPode: 'Administrar medicação'           },
  exames:      { pode: 'Solicitar e liberar exames',            naoPode: 'Acessar módulo de exames'        },
  internacao:  { pode: 'Admitir pacientes e registrar altas',   naoPode: 'Acessar internações'             },
  faturamento: { pode: 'Gerenciar faturamento e convênios',     naoPode: 'Acessar faturamento'             },
  relatorios:  { pode: 'Visualizar e exportar relatórios',      naoPode: 'Acessar relatórios'              },
  usuarios:    { pode: 'Gerenciar usuários do sistema',         naoPode: 'Gerenciar usuários'              },
  sistema:     { pode: 'Administração total do sistema',        naoPode: 'Administrar configurações'       },
};

interface PermissionsPreviewProps {
  permissoes: Record<string, Record<string, boolean>>;
}

export const PermissionsPreview: React.FC<PermissionsPreviewProps> = ({ permissoes = {} }) => {
  const { permitidos, negados } = useMemo(() => {
    const p: string[] = [];
    const n: string[] = [];

    Object.entries(MODULE_DESCRIPTIONS).forEach(([modKey, desc]) => {
      const perms = permissoes[modKey] || {};
      const hasAnyAccess = Object.values(perms).some(Boolean);
      
      if (hasAnyAccess) {
        p.push(desc.pode);
      } else {
        n.push(desc.naoPode);
      }
    });

    return { permitidos: p, negados: n };
  }, [permissoes]);

  return (
    <Card 
      size="small" 
      title="📋 Resumo do Perfil Configurado" 
      style={{ marginTop: 16, background: '#f0f5ff', borderColor: '#bae0ff' }}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Title level={5} style={{ color: '#389e0d', marginTop: 0 }}>
            <CheckCircleOutlined /> Este usuário PODERÁ:
          </Title>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {permitidos.map((txt, i) => <li key={i}><Text>{txt}</Text></li>)}
            {permitidos.length === 0 && <li><Text type="secondary">Nenhum acesso concedido.</Text></li>}
          </ul>
        </Col>
        <Col span={12}>
          <Title level={5} style={{ color: '#cf1322', marginTop: 0 }}>
            <CloseCircleOutlined /> Este usuário NÃO PODERÁ:
          </Title>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {negados.map((txt, i) => <li key={i}><Text>{txt}</Text></li>)}
            {negados.length === 0 && <li><Text type="secondary">O usuário tem acesso irrestrito.</Text></li>}
          </ul>
        </Col>
      </Row>
    </Card>
  );
};