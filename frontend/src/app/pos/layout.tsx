import type { ReactNode } from "react";
import RoleGate from "@/components/auth/RoleGate";

const ALLOWED_ROLES = ["cashier"] as const;

export default function PosLayout({ children }: { children: ReactNode }) {
  return <RoleGate allowedRoles={ALLOWED_ROLES}>{children}</RoleGate>;
}
