import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api';

const authApiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Bắt buộc bật để gửi và nhận Refresh Token qua HttpOnly Cookie
});

// Biến quản lý trạng thái refresh token để tránh gửi nhiều request refresh cùng lúc
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// 1. Request Interceptor: Đính kèm Access Token vào Authorization header
authApiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Response Interceptor: Bắt lỗi 401 và tự động dùng HttpOnly Cookie để refresh
authApiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Bỏ qua nếu không có response hoặc URL bị 401 chính là route auth/login hay auth/refresh
        const isAuthRoute =
            originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
            if (isRefreshing) {
                // Nếu đang trong quá trình refresh, đưa request hiện tại vào hàng đợi
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return authApiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Dùng axios cơ bản để tránh bị lặp vô hạn vào interceptor
                const response = await axios.post<{ accessToken: string }>(
                    `${BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true } // Trình duyệt tự đính kèm Refresh Token từ HttpOnly Cookie
                );

                const newAccessToken = response.data.accessToken;

                if (typeof window !== 'undefined') {
                    localStorage.setItem('access_token', newAccessToken);
                }

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                // Giải phóng các request đang chờ trong queue
                processQueue(null, newAccessToken);

                return authApiClient(originalRequest);
            } catch (refreshError) {
                // Refresh token trong cookie hết hạn hoặc không hợp lệ -> Logout
                processQueue(refreshError, null);

                if (typeof window !== 'undefined') {
                    localStorage.removeItem('access_token');
                    // Điều hướng về login nếu chạy trên Client
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default authApiClient;