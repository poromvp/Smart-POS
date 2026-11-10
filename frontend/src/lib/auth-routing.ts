export interface AccessSubject {
  roleName?: string | null;
  permissions?: readonly string[] | null;
}

export const WORKSPACE_PERMISSIONS = {
  admin: [
    "ADMIN_DASHBOARD",
    "USER_READ",
    "ROLE_READ",
    "MENU_CREATE",
    "INVENTORY_IMPORT",
  ],
  pos: ["POS_ACCESS"],
  kds: ["KDS_VIEW"],
  orderTaking: ["ORDER_TAKING_ACCESS"],
} as const;

export function normalizeRoleName(roleName?: string | null): string {
  return (roleName || "")
    .toUpperCase()
    .replace(/^ROLE_/, "")
    .trim();
}

export function hasAnyPermission(
  userPermissions: readonly string[] | null | undefined,
  requiredPermissions: readonly string[]
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  const permSet = new Set(userPermissions.map((p) => p.toUpperCase().trim()));
  return requiredPermissions.some((req) => permSet.has(req.toUpperCase().trim()));
}

export interface AccessibleWorkspaces {
  admin: boolean;
  pos: boolean;
  kds: boolean;
  orderTaking: boolean;
  count: number;
}

export function getAccessibleWorkspaces(
  subject: AccessSubject
): AccessibleWorkspaces {
  if (normalizeRoleName(subject.roleName) === "ADMIN") {
    return {
      admin: true,
      pos: true,
      kds: true,
      orderTaking: true,
      count: 4,
    };
  }

  const admin = hasAnyPermission(subject.permissions, WORKSPACE_PERMISSIONS.admin);
  const pos = hasAnyPermission(subject.permissions, WORKSPACE_PERMISSIONS.pos);
  const kds = hasAnyPermission(subject.permissions, WORKSPACE_PERMISSIONS.kds);
  const orderTaking = hasAnyPermission(
    subject.permissions,
    WORKSPACE_PERMISSIONS.orderTaking
  );

  const count = [admin, pos, kds, orderTaking].filter(Boolean).length;

  return { admin, pos, kds, orderTaking, count };
}

/**
 * Resolves the post-login destination route dynamically from the user's permissions:
 * - ADMIN or users with ADMIN_DASHBOARD -> /admin
 * - Custom/multi-workspace roles without ADMIN_DASHBOARD (e.g., SHIFT_LEAD with POS + KDS) -> / (Portal)
 * - Single operational workspace -> direct route (/pos, /kds, /order-taking, or /admin)
 * - No operational workspace permissions -> / (Portal with prompt to contact Admin)
 */
export function resolveLandingRoute(subject: AccessSubject): string {
  if (normalizeRoleName(subject.roleName) === "ADMIN") {
    return "/admin";
  }

  if (hasAnyPermission(subject.permissions, ["ADMIN_DASHBOARD"])) {
    return "/admin";
  }

  const workspaces = getAccessibleWorkspaces(subject);

  if (workspaces.count === 1) {
    if (workspaces.admin) return "/admin";
    if (workspaces.pos) return "/pos";
    if (workspaces.kds) return "/kds";
    if (workspaces.orderTaking) return "/order-taking";
  }

  return "/";
}
