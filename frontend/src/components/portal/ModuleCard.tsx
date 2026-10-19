"use client";

import React from "react";
import { LucideIcon, ArrowUpRight } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  isDanger?: boolean;
  onClick: () => void;
}

export default function ModuleCard({
  title,
  description,
  icon: Icon,
  badge,
  isDanger = false,
  onClick,
}: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full bg-white p-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-center min-h-[180px] shadow-xs hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] ${
        isDanger
          ? "border-gray-200 hover:border-red-400 hover:bg-red-50/20"
          : "border-gray-200/90 hover:border-orange-500 hover:shadow-orange-500/10"
      }`}
    >
      {badge && (
        <span className="absolute top-3.5 right-3.5 px-2.5 py-0.5 text-[11px] font-semibold bg-orange-100 text-orange-700 rounded-full">
          {badge}
        </span>
      )}

      {!badge && !isDanger && (
        <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-orange-500 transition-all" />
      )}

      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 ${
          isDanger
            ? "bg-red-50 text-red-500 group-hover:bg-red-600 group-hover:text-white"
            : "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-orange-500/25"
        }`}
      >
        <Icon className="w-7 h-7" />
      </div>

      <h3
        className={`text-base font-bold transition-colors ${
          isDanger
            ? "text-gray-800 group-hover:text-red-600"
            : "text-gray-800 group-hover:text-orange-600"
        }`}
      >
        {title}
      </h3>

      <p className="text-xs text-gray-400 mt-1 font-medium group-hover:text-gray-500 transition-colors">
        {description}
      </p>
    </button>
  );
}