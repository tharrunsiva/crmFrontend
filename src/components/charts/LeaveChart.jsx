import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const LeaveChart = ({ data = {} }) => {
  const categories = Object.keys(data).length > 0 ? Object.keys(data) : ['Annual', 'Medical', 'Emergency', 'Permission', 'Custom'];
  
  const chartData = categories.map((cat) => ({
    name: cat,
    count: data[cat] || 0,
  }));

  // Standard fallback
  const finalData = chartData.some(d => d.count > 0) ? chartData : [
    { name: 'Annual', count: 5 },
    { name: 'Medical', count: 2 },
    { name: 'Emergency', count: 1 },
    { name: 'Permission', count: 3 },
    { name: 'Custom', count: 0 },
  ];

  const COLORS = ['#2563EB', '#4F46E5', '#22C55E', '#F59E0B', '#EF4444'];

  return (
    <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
      <h5 className="text-main font-weight-bold mb-3">Leave Category Distribution</h5>
      <div style={{ width: '100%', height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={finalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--border-glass)',
                borderRadius: '8px',
                color: 'var(--text-main)',
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {finalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LeaveChart;
