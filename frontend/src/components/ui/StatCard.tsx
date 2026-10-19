import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  isWarning?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  isWarning = false,
}: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-orange-300 transition-all flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <h3
          className={`text-2xl font-bold tracking-tight ${
            isWarning ? "text-orange-600" : "text-gray-900"
          }`}
        >
          {value}
        </h3>
      </div>
      <div
        className={`p-2.5 rounded-lg ${
          isWarning
            ? "bg-orange-100 text-orange-600"
            : "bg-orange-50 text-orange-500"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}