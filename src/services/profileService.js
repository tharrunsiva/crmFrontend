import api from './api.js';

export const getMyProfile = async () => {
  const { data } = await api.get('/employees/profile');
  return data;
};

export const updateMyProfile = async (profileData) => {
  const { data } = await api.put('/employees/profile', profileData);
  return data;
};

export const submitOnboarding = async (formData, onUploadProgress) => {
  const { data } = await api.post('/employees/onboarding', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return data;
};
