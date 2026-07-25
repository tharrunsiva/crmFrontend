import api from './api.js';

export const submitComplaint = async (formData) => {
  const { data } = await api.post('/complaints', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getMyComplaints = async () => {
  const { data } = await api.get('/complaints/my-complaints');
  return data;
};

export const getComplaintsAdmin = async (filters) => {
  const { data } = await api.get('/admin/complaints', { params: filters });
  return data;
};

export const replyToComplaint = async (id, message) => {
  const { data } = await api.post(`/complaints/${id}/reply`, { message });
  return data;
};

export const updateComplaintStatus = async (id, status) => {
  const { data } = await api.put(`/complaints/${id}/status`, { status });
  return data;
};
