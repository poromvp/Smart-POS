import type { ReactNode } from "react";
import RoleGate from "@/components/auth/RoleGate";

const ALLOWED_ROLES = ["waiter"] as const;

export default function OrderTakingLayout({ children }: { children: ReactNode }) {
  return <RoleGate allowedRoles={ALLOWED_ROLES}>{children}</RoleGate>;
}
