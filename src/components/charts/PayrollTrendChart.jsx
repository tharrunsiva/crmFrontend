import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PayrollTrendChart = ({ data = [] }) => {
  const hasData = data.length > 0;

  return (
    <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
      <h5 className="text-main font-weight-bold mb-3">Payroll Expenditure Trend</h5>
      
      {!hasData ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: '240px' }}>
          <i className="bi bi-graph-up-arrow" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
          <p className="m-0 mt-3 font-weight-medium">No payroll data recorded yet</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
              <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--border-glass)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                }}
              />
              <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorPayroll)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PayrollTrendChart;
// Exporting default
