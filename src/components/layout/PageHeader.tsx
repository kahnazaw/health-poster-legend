"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  logoSize?: "sm" | "md" | "lg";
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showLogo = false,
  logoSize = "md",
  actions,
  className = "",
}: PageHeaderProps) {
  const logoSizes = {
    sm: "h-12",
    md: "h-14",
    lg: "h-16",
  };

  return (
    <div className={`bg-white border-b-4 border-emerald-600 shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-5 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className={`flex items-center gap-4 ${showLogo ? "justify-center md:justify-start" : ""}`}>
            {showLogo && (
              <div className="flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="شعار دائرة صحة كركوك"
                  className={`${logoSizes[logoSize]} w-auto object-contain`}
                />
              </div>
            )}
            <div className={`text-center ${showLogo ? "md:text-right" : "md:text-right"} flex-1`}>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm md:text-base text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex-shrink-0 flex justify-center md:justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

