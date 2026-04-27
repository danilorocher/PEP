import { Card, Typography } from 'antd';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

const { Title } = Typography;

interface OccupancyData {
  ala: string;
  totalLeitos: number;
  ocupados: number;
  taxa: string;
}

export const OccupancyChart = ({ data }: { data: OccupancyData[] }) => {
  return (
    <Card bordered={false} style={{ marginTop: 24 }}>
      <Title level={4}>Taxa de Ocupação por Ala</Title>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="ala" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [value, name === 'ocupados' ? 'Leitos Ocupados' : 'Total de Leitos']}
            />
            <Legend />
            <Bar dataKey="totalLeitos" fill="#e6f7ff" name="Capacidade Total" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ocupados" name="Ocupação Atual" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => {
                const rate = parseFloat(entry.taxa);
                const color = rate > 90 ? '#ff4d4f' : rate > 70 ? '#faad14' : '#1890ff';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};