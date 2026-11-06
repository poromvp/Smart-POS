import authApiClient from '@/lib/authApi';
import {
    UserResponse,
    PageResponse,
    CreateUserRequest,
    UpdateUserRequest,
    UserQueryParams,
    AdminResetPasswordRequest
} from '@/types/user.type';

export const userService = {

    // 1. [POST] /api/users - Tạo tài khoản mới
    async createUser(data: CreateUserRequest): Promise<UserResponse> {
        const response = await authApiClient.post<UserResponse>('/users', data);
        return response.data;
    },

    // 2. [GET] /api/users - Lấy danh sách (có phân trang, lọc, tìm kiếm)
    async getUsers(params?: UserQueryParams): Promise<PageResponse<UserResponse>> {
        const response = await authApiClient.get<PageResponse<UserResponse>>('/users', {
            params: params // Axios sẽ tự động nối params thành query string (vd: ?page=0&size=10&search=abc)
        });
        return response.data;
    },

    // 3. [GET] /api/users/{id} - Lấy chi tiết một tài khoản
    async getUserById(id: number): Promise<UserResponse> {
        const response = await authApiClient.get<UserResponse>(`/users/${id}`);
        return response.data;
    },

    // 4. [PATCH] /api/users/{id} - Sửa thông tin tài khoản (Tên, Email, SĐT...)
    async updateUser(id: number, data: UpdateUserRequest): Promise<UserResponse> {
        const response = await authApiClient.patch<UserResponse>(`/users/${id}`, data);
        return response.data;
    },

    // 5. [PATCH] /api/users/{id}/status - Kích hoạt hoặc vô hiệu hóa tài khoản
    // Truyền chuỗi rỗng / trạng thái vào body hoặc query tùy thiết kế Backend của bạn. Ở đây giả định body truyền boolean.
    async updateUserStatus(id: number, isActive: boolean): Promise<void> {
        await authApiClient.patch(`/users/${id}/status`, { isActive });
    },

    // 6. [PATCH] /api/users/{id}/role - Thay thế toàn bộ role của tài khoản
    async updateUserRole(id: number, role: string): Promise<void> {
        await authApiClient.patch(`/users/${id}/role`, { role });
    },

    // 7. [POST] /api/users/{id}/reset-password - Admin/Manager đặt lại mật khẩu
    async resetPassword(id: number, data: AdminResetPasswordRequest): Promise<void> {
        await authApiClient.post(`/users/${id}/reset-password`, data);
    }
};