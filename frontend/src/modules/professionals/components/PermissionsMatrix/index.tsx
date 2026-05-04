import React, { useMemo } from 'react';
import { Table, Switch, Badge, Typography, Space } from 'antd';
import { MODULES_DEFINITION } from '../../constants/permissions-definition';

const { Text } = Typography;

interface PermissionsMatrixProps {
  value?: Record<string, Record<string, boolean>>;
  onChange?: (value: Record<string, Record<string, boolean>>) => void;
  disabled?: boolean;
}

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({ value = {}, onChange, disabled = false }) => {
  
  const handleToggle = (moduloKey: string, acaoKey: string, checked: boolean) => {
    if (disabled) return;
    const currentModulePerms = value[moduloKey] || {};
    const newPerms = {
      ...value,
      [moduloKey]: { ...currentModulePerms, [acaoKey]: checked }
    };
    onChange?.(newPerms);
  };

  const getStatusBadge = (moduloKey: string) => {
    const modPerms = value[moduloKey] || {};
    const activeCount = Object.values(modPerms).filter(Boolean).length;
    const def = MODULES_DEFINITION.find(m => m.key === moduloKey);
    const totalCount = def?.acoes.length || 0;

    if (activeCount === 0) return <Badge status="error" text="Sem Acesso" />;
    if (activeCount === totalCount) return <Badge status="success" text="Acesso Total" />;
    return <Badge status="warning" text="Parcial" />;
  };

  // Prepara os dados agrupados para a tabela
  const dataSource = useMemo(() => {
    let currentGroup = '';
    const rows: any[] = [];
    
    MODULES_DEFINITION.forEach(mod => {
      if (mod.grupo !== currentGroup) {
        rows.push({ isGroup: true, key: `group_${mod.grupo}`, label: mod.grupo });
        currentGroup = mod.grupo;
      }
      rows.push({ ...mod, isGroup: false });
    });
    return rows;
  }, []);

  const renderSwitch = (record: any, colunaRef: string) => {
    if (record.isGroup) return null;
    const acao = record.acoes.find((a: any) => a.coluna === colunaRef);
    if (!acao) return <Text type="secondary">—</Text>;

    const isChecked = !!value[record.key]?.[acao.key];

    return (
      <Space direction="vertical" size={0} align="center">
        <Switch 
          size="small" 
          checked={isChecked} 
          disabled={disabled}
          onChange={(checked) => handleToggle(record.key, acao.key, checked)} 
        />
        {acao.labelEspecial && <Text style={{ fontSize: '10px' }} type="secondary">{acao.labelEspecial}</Text>}
      </Space>
    );
  };

  const columns = [
    {
      title: 'Módulo / Funcionalidade',
      dataIndex: 'label',
      key: 'label',
      width: 250,
      render: (text: string, record: any) => {
        if (record.isGroup) return <Text strong type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{text}</Text>;
        return <Text strong style={{ marginLeft: 16 }}>{text}</Text>;
      }
    },
    { title: 'Criar', key: 'criar', width: 80, align: 'center' as const, render: (_: any, r: any) => renderSwitch(r, 'criar') },
    { title: 'Editar', key: 'editar', width: 80, align: 'center' as const, render: (_: any, r: any) => renderSwitch(r, 'editar') },
    { title: 'Visualizar', key: 'visualizar', width: 90, align: 'center' as const, render: (_: any, r: any) => renderSwitch(r, 'visualizar') },
    { title: 'Excluir', key: 'excluir', width: 80, align: 'center' as const, render: (_: any, r: any) => renderSwitch(r, 'excluir') },
    { title: 'Ações Especiais', key: 'especiais', width: 160, render: (_: any, r: any) => (
        <Space>
          {renderSwitch(r, 'especial1')}
          {renderSwitch(r, 'especial2')}
        </Space>
      )
    },
    { title: 'Nível de Acesso', key: 'status', width: 120, render: (_: any, r: any) => !r.isGroup ? getStatusBadge(r.key) : null },
  ];

  return (
    <Table 
      dataSource={dataSource} 
      columns={columns} 
      pagination={false}
      rowKey="key"
      size="small"
      scroll={{ x: 800 }}
      rowClassName={(record) => record.isGroup ? 'group-row-bg' : ''}
    />
  );
};