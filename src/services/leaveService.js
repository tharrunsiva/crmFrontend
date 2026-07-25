import api from './api.js';

export const applyLeave = async (leaveData) => {
  const { data } = await api.post('/leaves', leaveData);
  return data;
};

export const getMyLeaves = async () => {
  const { data } = await api.get('/leaves/my-leaves');
  return data;
};

export const getLeaveAnalytics = async () => {
  const { data } = await api.get('/leaves/analytics');
  return data;
};

export const getLeavesAdmin = async (filters) => {
  const { data } = await api.get('/admin/leaves', { params: filters });
  return data;
};

export const approveRejectLeave = async (id, status, adminComments) => {
  const { data } = await api.put(`/admin/leaves/${id}/approve`, { status, adminComments });
  return data;
};
