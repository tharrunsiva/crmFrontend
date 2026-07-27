import api from './api.js';
import { API_URL } from '../config.js';

export const generatePayroll = async (payrollData) => {
  const { data } = await api.post('/payroll/generate', payrollData);
  return data;
};

export const approvePayroll = async (id, status) => {
  const { data } = await api.put(`/payroll/${id}/approve`, { status });
  return data;
};

export const getPayrollRecords = async (params) => {
  const { data } = await api.get('/payroll/records', { params });
  return data;
};

export const getMyPayroll = async () => {
  const { data } = await api.get('/payroll/my');
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
  return `${API_URL}/payroll/${id}/download?token=${token}`;
};
