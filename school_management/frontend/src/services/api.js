import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let onSessionExpiredHandler = null;

export const setSessionExpiredHandler = (handler) => {
  onSessionExpiredHandler = handler;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const isTeacherRoute = window.location.pathname.startsWith('/teacher');

    // Handle token expired (401 Unauthorized or 403 Forbidden)
    if ((status === 401 || status === 403) && isTeacherRoute) {
      // Don't intercept auth login requests themselves
      if (!error.config.url.includes('/auth/login')) {
        if (typeof onSessionExpiredHandler === 'function') {
          return new Promise((resolve, reject) => {
            onSessionExpiredHandler({
              resolve: (newToken) => {
                const retryConfig = { ...error.config };
                retryConfig.headers = {
                  ...retryConfig.headers,
                  Authorization: `Bearer ${newToken}`,
                };
                resolve(api(retryConfig));
              },
              reject: () => {
                reject(error);
              },
            });
          });
        }

        // Fallback if no modal handler registered
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/teacher/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

