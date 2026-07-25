import api from './api.js';

export const requestPermission = async (permissionData) => {
  const { data } = await api.post('/permissions', permissionData);
  return data;
};

export const getMyPermissions = async () => {
  const { data } = await api.get('/permissions/my-permissions');
  return data;
};

export const getPermissionsAdmin = async (filters) => {
  const { data } = await api.get('/admin/permissions', { params: filters });
  return data;
};

export const approveRejectPermission = async (id, status, adminComments) => {
  const { data } = await api.put(`/admin/permissions/${id}/approve`, { status, adminComments });
  return data;
};
