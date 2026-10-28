import type { ReactNode } from "react";
import RoleGate from "@/components/auth/RoleGate";

const ALLOWED_ROLES = ["chef"] as const;

export default function KdsLayout({ children }: { children: ReactNode }) {
  return <RoleGate allowedRoles={ALLOWED_ROLES}>{children}</RoleGate>;
}
