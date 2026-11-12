import { normalizeRoleName } from "./auth-routing.ts";

export type GateAccessStatus = "allowed" | "redirect_login" | "forbidden";

export interface EvaluateGateInput {
  isAuthenticated: boolean;
  roleName?: string | null;
  permissions?: readonly string[] | null;
  allowedRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
}

export function evaluateGateAccess(
  input: EvaluateGateInput
): GateAccessStatus {
  if (!input.isAuthenticated) {
    return "redirect_login";
  }

  const currentRole = normalizeRoleName(input.roleName);
  if (currentRole === "ADMIN") {
    return "allowed";
  }

  const requiredPermissions = input.requiredPermissions;
  if (requiredPermissions && requiredPermissions.length > 0) {
    const permSet = new Set(
      (input.permissions || []).map((p) => p.toUpperCase().trim())
    );
    const normalizedReqs = requiredPermissions.map((p) =>
      p.toUpperCase().trim()
    );

    const hasPerm = input.requireAllPermissions
      ? normalizedReqs.every((req) => permSet.has(req))
      : normalizedReqs.some((req) => permSet.has(req));

    return hasPerm ? "allowed" : "forbidden";
  }

  if (input.allowedRoles && input.allowedRoles.length > 0) {
    const matchedRole = input.allowedRoles.some(
      (r) => normalizeRoleName(r) === currentRole
    );
    return matchedRole ? "allowed" : "forbidden";
  }

  return "allowed";
}
