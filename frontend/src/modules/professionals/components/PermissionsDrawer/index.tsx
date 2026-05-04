import React, { useEffect, useState } from 'react';
import { Drawer, Button, Space, Typography, Spin, message, Divider, Alert } from 'antd';
import { SaveOutlined, HistoryOutlined, LockOutlined } from '@ant-design/icons';
import api from '../../../../shared/services/api';
import { PermissionsMatrix } from '../PermissionsMatrix';
import { PermissionsPreview } from '../PermissionsPreview';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface PermissionsDrawerProps {
  open: boolean;
  onClose: () => void;
  roleId: string;
  userName: string;
  onSaved: () => void;
}

export const PermissionsDrawer: React.FC<PermissionsDrawerProps> = ({ open, onClose, roleId, userName, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roleData, setRoleData] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>({});

  useEffect(() => {
    if (open && roleId) {
      fetchRole();
    }
  }, [open, roleId]);

  const fetchRole = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/roles/${roleId}`);
      setRoleData(res.data);
      setPermissions(res.data.permissoes || {});
    } catch (err) {
      message.error('Erro ao carregar permissões atuais.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // O Guard do Backend validará se esta role não é o ADMIN protegido
      await api.patch(`/roles/${roleId}`, { permissoes: permissions });
      message.success('Permissões atualizadas com sucesso!');
      onSaved();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao guardar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = roleData?.nome === 'ADMIN' || roleData?.nome === 'MASTER';

  return (
    <Drawer
      title={<span><LockOutlined /> Gestão de Acessos: {userName}</span>}
      width={800}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={isAdmin}>
            Guardar Alterações
          </Button>
        </Space>
      }
    >
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div> : (
        <>
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary">
              <HistoryOutlined /> Última atualização em: {dayjs(roleData?.updatedAt).format('DD/MM/YYYY [às] HH:mm')}
            </Text>
          </div>

          {isAdmin && (
            <Alert 
              message="Perfil do Sistema Protegido" 
              description="Este utilizador possui um perfil de Administrador Master. Por razões de segurança e integridade do sistema, as permissões de administradores não podem ser editadas."
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Title level={5}>Matriz de Permissões</Title>
          <PermissionsMatrix 
            value={permissions} 
            onChange={setPermissions} 
            disabled={isAdmin}
          />
          
          <Divider />
          <PermissionsPreview permissoes={permissions} />
        </>
      )}
    </Drawer>
  );
};