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
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5 ${className}`}>
      {(title || subtitle || icon) && (
        <div className={`border-b border-gray-200 pb-3 md:pb-4 mb-3 md:mb-4 ${headerClassName}`}>
          {icon && (
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              {icon}
              {title && (
                <h2 className="text-base md:text-lg font-bold text-emerald-700">{title}</h2>
              )}
            </div>
          )}
          {!icon && title && (
            <h2 className="text-base md:text-lg font-bold text-emerald-700">{title}</h2>
          )}
          {subtitle && (
            <p className="text-xs md:text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

