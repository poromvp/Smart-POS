"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "./token-manager";

export interface CurrentUser {
  id: number;
  username: string;
  fullName: string;
  roleName: string;
  permissions: string[];
}

export interface AuthContextType {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async (token: string): Promise<CurrentUser | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as CurrentUser;
        setCurrentUser(data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          const me = await fetchMe(data.accessToken);
          return me !== null;
        }
      }
    } catch {
      // Ignore refresh error on unauthenticated visits
    }
    clearAccessToken();
    setCurrentUser(null);
    return false;
  }, [fetchMe]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await refreshSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  const login = useCallback(
    async (username: string, password: string): Promise<CurrentUser> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let msg = "Tên đăng nhập hoặc mật khẩu không chính xác.";
        try {
          const errData = await res.json();
          msg = errData.message || errData.detail || msg;
        } catch {
          // ignore parse error
        }
        throw new Error(msg);
      }

      const data = await res.json();
      setAccessToken(data.accessToken);

      const me = await fetchMe(data.accessToken);
      if (!me) {
        throw new Error("Không thể tải thông tin người dùng sau khi đăng nhập.");
      }
      return me;
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    const token = getAccessToken();
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
    } catch {
      // ignore network errors on logout
    } finally {
      clearAccessToken();
      setCurrentUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (roles: string | string[]): boolean => {
      if (!currentUser || !currentUser.roleName) return false;
      const targetRoles = Array.isArray(roles) ? roles : [roles];
      const currentRole = currentUser.roleName.toUpperCase().replace(/^ROLE_/, "");
      return targetRoles.some((r) => {
        const normalized = r.toUpperCase().replace(/^ROLE_/, "");
        return normalized === currentRole;
      });
    },
    [currentUser]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!currentUser) return false;
      if (hasRole("ADMIN")) return true;
      return (
        currentUser.permissions?.includes(permission) ||
        currentUser.permissions?.includes(permission.toUpperCase())
      );
    },
    [currentUser, hasRole]
  );

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: currentUser !== null,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
