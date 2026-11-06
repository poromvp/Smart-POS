// ==================== REQUEST ====================

export interface CreateUserRequest {
    username: string;
    password: string;
    fullName: string;
    phone: string;
    roleId: number;
}

export interface UpdateUserRequest {
    fullName: string;
    phone: string;
}

export interface UpdateUserStatusRequest {
    active: boolean;
}

export interface AssignRoleRequest {
    roleId: number;
}

export interface AdminResetPasswordRequest {
    newPassword: string;
}

export interface UserQueryParams {
    page?: number;     // Mặc định thường là 0
    size?: number;     // Mặc định 10 hoặc 20
    search?: string;   // Tìm theo tên/email
    role?: string;     // Lọc theo Role
    isActive?: boolean;
}

// ==================== RESPONSE ====================

export interface UserResponse {
    id: number;
    username: string;
    fullName: string;
    phone: string | null;
    active: boolean;
    createdAt: string;
    role: RoleResponse;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number; // Trang hiện tại (0-indexed)
}