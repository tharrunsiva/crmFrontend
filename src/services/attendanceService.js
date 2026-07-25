import api from './api.js';

export const checkIn = async () => {
  const { data } = await api.post('/attendance/checkin');
  return data;
};

export const checkOut = async () => {
  const { data } = await api.post('/attendance/checkout');
  return data;
};

export const getTodayStatus = async () => {
  const { data } = await api.get('/attendance/status');
  return data;
};

export const getMyAttendanceHistory = async (month, year) => {
  const params = month && year ? { month, year } : {};
  const { data } = await api.get('/attendance/history', { params });
  return data;
};

export const getEmployeesAttendanceAdmin = async (filters) => {
  const { data } = await api.get('/admin/attendance', { params: filters });
  return data;
};

export const editAttendanceRecordAdmin = async (id, updateData) => {
  const { data } = await api.put(`/admin/attendance/${id}`, updateData);
  return data;
};
