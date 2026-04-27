import React from 'react';
import { Space, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  extra?: React.ReactNode;
}

export const PageHeader = ({ title, onBack, showBack = false, extra }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <Space>
        {showBack && <Button icon={<ArrowLeftOutlined />} onClick={handleBack} />}
        <Title level={2} style={{ margin: 0 }}>{title}</Title>
      </Space>
      {extra && <Space>{extra}</Space>}
    </div>
  );
};