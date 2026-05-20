import axios, { AxiosError } from 'axios';
import API_BASE_URL from '@config/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isNetworkError = !error.response;
    const status = error.response?.status;
    const message = error.message || 'API request failed';

    console.error('[API] Request failed', {
      url: error.config?.url,
      method: error.config?.method,
      status,
      message,
    });

    if (isNetworkError) {
      return Promise.reject(new Error('Network request failed. Backend may be unreachable.'));
    }

    if (status === 401) {
      return Promise.reject(new Error('Unauthorized request. Please sign in again.'));
    }

    if (status === 500) {
      return Promise.reject(new Error('Backend degraded. Please try again later.'));
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
