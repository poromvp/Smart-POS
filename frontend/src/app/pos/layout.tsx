import type { ReactNode } from "react";
import RoleGate from "@/components/auth/RoleGate";
import { WORKSPACE_PERMISSIONS } from "@/lib/auth-routing";

export default function PosLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate requiredPermissions={WORKSPACE_PERMISSIONS.pos}>
      {children}
    </RoleGate>
  );
}
