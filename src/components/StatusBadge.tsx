"use client";

import React from "react";

export type StatusType = "draft" | "submitted" | "approved" | "rejected";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const statusConfig = {
  draft: {
    label: "مسودة",
    className: "bg-gray-100 text-gray-800 border-gray-200",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  submitted: {
    label: "قيد المراجعة",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  approved: {
    label: "موافق عليه",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  rejected: {
    label: "مرفوض",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

export default function StatusBadge({ status, size = "md", showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.className} ${sizeClass} transition-all duration-200`}
    >
      {showIcon && <span className="flex-shrink-0">{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}

