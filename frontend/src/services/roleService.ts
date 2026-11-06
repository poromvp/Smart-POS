import authApiClient from '@/lib/authApi';
import {
    RoleResponse,
    CreateRoleRequest,
    UpdateRoleRequest,
    PermissionResponse,
    UpdateRolePermissionsRequest,
    RoleQueryParams
} from '@/types/role.type';
import { UserResponse, PageResponse } from '@/types/user.type'; // Import type User cho API getRoleUsers

export const roleService = {

    // 1. [POST] /api/roles - Tạo role mới
    async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
        const response = await authApiClient.post<RoleResponse>('/roles', data);
        return response.data;
    },

    // 2. [GET] /api/roles - Lấy danh sách role
    // Tùy backend của bạn trả về mảng RoleResponse[] hay phân trang PageResponse<RoleResponse>
    async getRoles(params?: RoleQueryParams): Promise<RoleResponse[]> {
        const response = await authApiClient.get<RoleResponse[]>('/roles', {
            params
        });
        return response.data;
    },

    // 3. [GET] /api/roles/{id} - Lấy chi tiết role
    async getRoleById(id: number): Promise<RoleResponse> {
        const response = await authApiClient.get<RoleResponse>(`/roles/${id}`);
        return response.data;
    },

    // 4. [PATCH] /api/roles/{id} - Sửa tên hoặc mô tả role
    async updateRole(id: number, data: UpdateRoleRequest): Promise<RoleResponse> {
        const response = await authApiClient.patch<RoleResponse>(`/roles/${id}`, data);
        return response.data;
    },

    // 5. [DELETE] /api/roles/{id} - Xóa role không còn sử dụng
    async deleteRole(id: number): Promise<void> {
        await authApiClient.delete(`/roles/${id}`);
    },

    // 6. [GET] /api/roles/{id}/permissions - Xem danh sách permission của role
    async getRolePermissions(id: number): Promise<PermissionResponse[]> {
        const response = await authApiClient.get<PermissionResponse[]>(`/roles/${id}/permissions`);
        return response.data;
    },

    // 7. [PUT] /api/roles/{id}/permissions - Thay thế toàn bộ permission của role
    async updateRolePermissions(id: number, data: UpdateRolePermissionsRequest): Promise<void> {
        await authApiClient.put(`/roles/${id}/permissions`, data);
    },

    // 8. [GET] /api/roles/{id}/users - Lấy danh sách user đang sở hữu role này (Thường có phân trang)
    async getRoleUsers(id: number, params?: RoleQueryParams): Promise<PageResponse<UserResponse>> {
        const response = await authApiClient.get<PageResponse<UserResponse>>(`/roles/${id}/users`, {
            params
        });
        return response.data;
    },

    // (Tính năng phụ) API lấy toàn bộ permission có trong hệ thống để render giao diện check-box phân quyền
    async getAllPermissions(): Promise<PermissionResponse[]> {
        const response = await authApiClient.get<PermissionResponse[]>('/permissions');
        return response.data;
    }
};