import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

interface AlertBannerProps {
  variant?: "warning" | "error" | "success" | "info";
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function AlertBanner({
  variant = "warning",
  title,
  description,
  actionText,
  onAction,
}: AlertBannerProps) {
  const styles = {
    warning: {
      wrapper: "bg-orange-50/90 border-orange-200 text-orange-900",
      iconColor: "text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
      Icon: AlertTriangle,
    },
    error: {
      wrapper: "bg-red-50 border-red-200 text-red-900",
      iconColor: "text-red-600",
      button: "bg-red-600 hover:bg-red-700 text-white",
      Icon: XCircle,
    },
    success: {
      wrapper: "bg-emerald-50 border-emerald-200 text-emerald-900",
      iconColor: "text-emerald-600",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
      Icon: CheckCircle2,
    },
    info: {
      wrapper: "bg-blue-50 border-blue-200 text-blue-900",
      iconColor: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      Icon: Info,
    },
  }[variant];

  const IconComponent = styles.Icon;

  return (
    <div
      className={`w-full rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${styles.wrapper}`}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${styles.iconColor}`} />
        <div>
          <h4 className="text-sm font-bold">{title}</h4>
          {description && (
            <p className="text-xs opacity-85 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${styles.button}`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}