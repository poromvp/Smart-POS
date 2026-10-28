"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const contextValue: ToastContextType = {
    showToast,
    success: (title, message) => showToast("success", title, message),
    error: (title, message) => showToast("error", title, message),
    warning: (title, message) => showToast("warning", title, message),
    info: (title, message) => showToast("info", title, message),
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          border: "border-emerald-500",
          bgIcon: "bg-emerald-50 text-emerald-600",
          icon: CheckCircle2,
        };
      case "warning":
        return {
          border: "border-orange-500",
          bgIcon: "bg-orange-50 text-orange-600",
          icon: AlertTriangle,
        };
      case "error":
        return {
          border: "border-red-500",
          bgIcon: "bg-red-50 text-red-600",
          icon: XCircle,
        };
      case "info":
      default:
        return {
          border: "border-blue-500",
          bgIcon: "bg-blue-50 text-blue-600",
          icon: Info,
        };
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const style = getToastStyles(t.type);
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto bg-white rounded-xl border border-gray-200 border-l-4 ${style.border} p-4 shadow-lg flex items-start gap-3 transition-all duration-200`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${style.bgIcon}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900">{t.title}</h4>
                {t.message && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}