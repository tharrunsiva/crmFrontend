import api from './api.js';

export const getEmployeesList = async (filters) => {
  const { data } = await api.get('/admin/employees', { params: filters });
  return data;
};

export const getEmployeeById = async (id) => {
  const { data } = await api.get(`/admin/employees/${id}`);
  return data;
};

export const approveRejectEmployee = async (id, status, remarks, department, designation) => {
  const { data } = await api.put(`/admin/employees/${id}/approve`, { status, remarks, department, designation });
  return data;
};

export const toggleEmployeeStatus = async (id, status) => {
  const { data } = await api.put(`/admin/employees/${id}/status`, { status });
  return data;
};

export const resetEmployeePasswordAdmin = async (id, newPassword) => {
  const { data } = await api.put(`/admin/employees/${id}/reset-password`, { newPassword });
  return data;
};

export const bulkActionEmployees = async (ids, action) => {
  const { data } = await api.post('/admin/employees/bulk', { ids, action });
  return data;
};

export const getAdminDashboardAnalytics = async () => {
  const { data } = await api.get('/analytics/dashboard');
  return data;
};

export const getAttendanceAdmin = async (filters) => {
  const { data } = await api.get('/admin/attendance', { params: filters });
  return data;
};

export const editAttendanceAdmin = async (id, payload) => {
  const { data } = await api.put(`/admin/attendance/${id}`, payload);
  return data;
};

export const markAttendanceManualAdmin = async (payload) => {
  const { data } = await api.post('/admin/attendance', payload);
  return data;
};

export const deleteAttendanceAdmin = async (id) => {
  const { data } = await api.delete(`/admin/attendance/${id}`);
  return data;
};
