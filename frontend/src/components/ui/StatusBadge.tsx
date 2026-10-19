import React from "react";

export type StatusVariant =
  | "success"
  | "serving"
  | "pending"
  | "warning"
  | "danger"
  | "neutral";

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  showDot?: boolean;
}

const variantClasses: Record<
  StatusVariant,
  { badge: string; dot: string }
> = {
  success: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  serving: {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  pending: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  warning: {
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    dot: "bg-orange-600",
  },
  danger: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  neutral: {
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
};

export default function StatusBadge({
  label,
  variant = "neutral",
  showDot = true,
}: StatusBadgeProps) {
  const styles = variantClasses[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles.badge}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      )}
      {label}
    </span>
  );
}