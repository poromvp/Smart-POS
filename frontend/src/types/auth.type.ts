// ==================== REQUEST ====================

export interface LoginRequest {
    username: string;
    password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ForgotPasswordRequest {
    username: string;
    phone: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

// ==================== RESPONSE ====================

export interface AuthResponse {
    accessToken: string;
    user: UserProfile;
    permissions: string[];
}

export interface AccessTokenPayload {
    sub: string;
    userId: number;
    role: string;
    permissions: string[];
    iat: number;
    exp: number;
}