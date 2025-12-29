"use client";

import React from "react";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-4xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export default function PageContainer({
  children,
  maxWidth = "xl",
  className = "",
  ...props
}: PageContainerProps) {
  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto py-6 md:py-8 px-4 sm:px-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

