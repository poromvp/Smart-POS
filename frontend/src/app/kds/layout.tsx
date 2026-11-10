import type { ReactNode } from "react";
import RoleGate from "@/components/auth/RoleGate";
import { WORKSPACE_PERMISSIONS } from "@/lib/auth-routing";

export default function KdsLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate requiredPermissions={WORKSPACE_PERMISSIONS.kds}>
      {children}
    </RoleGate>
  );
}
