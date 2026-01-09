import axios from 'axios';
import { TokenStorage } from '../auth/TokenStorage';

// Placeholder URL - will be replaced by environment variable later
const BASE_URL = 'https://api.imagineread.com/v1';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Inject Token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await TokenStorage.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token for request:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 (Optional for now)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized (e.g., logout, clear token)
            // For now just reject
        }
        return Promise.reject(error);
    }
);
