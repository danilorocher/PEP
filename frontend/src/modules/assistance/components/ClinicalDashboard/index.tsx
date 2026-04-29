import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ResponsiveContainerProps } from 'recharts';
import dayjs from 'dayjs';

const { Title } = Typography;

interface Props {
  data: any[]; // Histórico de sinais vitais
}

export const ClinicalDashboard: React.FC<Props> = ({ data }) => {
  // Inverte os dados para ordem cronológica no gráfico
  const chartData = [...data].reverse().map(item => ({
    time: dayjs(item.dataHora).format('DD/MM HH:mm'),
    temp: item.temperature,
    sys: item.systolicPressure,
    dia: item.diastolicPressure,
    hr: item.heartRate
  }));

  return (
    <div style={{ marginTop: 24 }}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Curva Febril (°C)" size="small">
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" fontSize={10} />
                  <YAxis domain={[34, 42]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="temp" stroke="#ff4d4f" strokeWidth={2} name="Temperatura" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Pressão Arterial (mmHg)" size="small">
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" fontSize={10} />
                  <YAxis domain={[40, 200]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sys" stroke="#1890ff" name="Sistólica" dot={false} />
                  <Line type="monotone" dataKey="dia" stroke="#722ed1" name="Diastólica" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};