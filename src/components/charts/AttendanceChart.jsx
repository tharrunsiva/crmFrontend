import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AttendanceChart = ({ data = [] }) => {
  const COLORS = ['#22C55E', '#F59E0B', '#EF4444', '#3B82F6'];

  const chartData = data.length > 0 ? data : [
    { status: 'Present', value: 20 },
    { status: 'Late', value: 3 },
    { status: 'Absent', value: 1 },
    { status: 'Half-Day', value: 2 },
  ];

  return (
    <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
      <h5 className="text-main font-weight-bold mb-3">Attendance Rate</h5>
      <div style={{ width: '100%', height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              nameKey="status"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--border-glass)',
                borderRadius: '8px',
                color: 'var(--text-main)',
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;
