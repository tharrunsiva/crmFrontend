import api from './api.js';

export const generatePayroll = async (payrollData) => {
  const { data } = await api.post('/payroll/generate', payrollData);
  return data;
};

export const approvePayroll = async (id, status) => {
  const { data } = await api.put(`/payroll/${id}/approve`, { status });
  return data;
};

export const getMyPayrollHistory = async () => {
  const { data } = await api.get('/payroll/history');
  return data;
};

export const getPayrollAdmin = async (filters) => {
  const { data } = await api.get('/admin/payroll', { params: filters });
  return data;
};

export const downloadPayslipUrl = (id) => {
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:https://crmbackend-nq36.onrender.com/api';
  return `${baseUrl}/payroll/${id}/download?token=${token}`;
};
