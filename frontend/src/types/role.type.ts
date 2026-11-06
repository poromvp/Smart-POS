// ==================== REQUEST ====================

export interface CreateRoleRequest {
    name: string;
    description?: string | null;
}

export interface UpdateRolePermissionsRequest {
    permissionIds: number[];
}

export interface UpdateRoleRequest {
    name: string;
    description?: string | null;
}

export interface UpdateRoleStatusRequest {
    active: boolean;
}

// ==================== RESPONSE ====================

export interface RoleResponse {
    id: number;
    name: string;
    description: string | null;
    // isSystem: boolean;
    // isActive: boolean;
    permissions: PermissionResponse[];
}

export interface PermissionResponse {
    id: number;
    name: string; // VD: USER_READ, MENU_CREATE
    description?: string;
    module?: string; // Phân nhóm (VD: USER, ORDER, MENU)
}