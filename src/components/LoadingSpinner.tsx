"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 border-2",
  md: "h-12 w-12 border-4",
  lg: "h-16 w-16 border-4",
};

export default function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} border-emerald-200 border-t-emerald-600 rounded-full animate-spin`}
      ></div>
      {text && <p className="mt-4 text-gray-600 font-medium">{text}</p>}
    </div>
  );
}

