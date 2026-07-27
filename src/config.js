const getBackendURL = () => {
  if (import.meta.env.VITE_API_URL) {
    // Strip trailing /api if present to get clean base URL
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
  }
  // Default to localhost backend if frontend is running locally
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  return 'https://crmbackend-nq36.onrender.com';
};

export const BACKEND_URL = getBackendURL();
export const API_URL = `${BACKEND_URL}/api`;
