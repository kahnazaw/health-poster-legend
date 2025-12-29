"use client";

import React from "react";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export default function SectionCard({
  children,
  title,
  subtitle,
  icon,
  className = "",
  headerClassName = "",
}: SectionCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6 ${className}`}>
      {(title || subtitle || icon) && (
        <div className={`border-b border-gray-200 pb-4 mb-4 md:mb-6 ${headerClassName}`}>
          {icon && (
            <div className="flex items-center gap-3 mb-2">
              {icon}
              {title && (
                <h2 className="text-lg md:text-xl font-bold text-emerald-700">{title}</h2>
              )}
            </div>
          )}
          {!icon && title && (
            <h2 className="text-lg md:text-xl font-bold text-emerald-700">{title}</h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

