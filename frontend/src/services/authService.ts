import authApiClient from '@/lib/authApi';
import { AuthResponse, LoginRequest } from '@/types/auth.type';
import { UserResponse } from "@/types/user.type"


export const authService = {

    // 1. [POST] /api/auth/login - Đăng nhập (Public)
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await authApiClient.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    // 2. [POST] /api/auth/refresh - Lấy access token mới (Public nhưng cần HttpOnly Cookie)
    // Hàm này thường được gọi ngầm trong axios interceptor hoặc authStore, nhưng có thể expose ra nếu cần gọi thủ công
    async refreshToken(): Promise<AuthResponse> {
        const response = await authApiClient.post<AuthResponse>('/auth/refresh', {}, {
            // Đảm bảo withCredentials luôn bật để gửi kèm Refresh Token cookie
            withCredentials: true
        });
        return response.data;
    },

    // 3. [POST] /api/auth/logout - Đăng xuất (Cần Auth)
    async logout(): Promise<void> {
        await authApiClient.post('/auth/logout');
    },

    // 4. [GET] /api/auth/me - Lấy thông tin tài khoản hiện tại (Cần Auth)
    async getCurrentUser(): Promise<UserResponse> {
        const response = await authApiClient.get<UserResponse>('/auth/me');
        return response.data;
    },

    // 5. [PATCH] /api/auth/password - Đổi mật khẩu tài khoản đang đăng nhập (Cần Auth)
    async changePassword(data: ChangePasswordRequest): Promise<void> {
        await authApiClient.patch('/auth/password', data);
    },

    // 6. [POST] /api/auth/forgot-password - Yêu cầu gửi email đặt lại mật khẩu (Public)
    async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
        await authApiClient.post('/auth/forgot-password', data);
    },

    // 7. [POST] /api/auth/reset-password - Đặt lại mật khẩu mới dựa trên mã xác nhận (Public)
    async resetPassword(data: ResetPasswordRequest): Promise<void> {
        await authApiClient.post('/auth/reset-password', data);
    }
};