/**
 * Design System - Single Source of Truth
 * Centralized design tokens and utilities
 */

export const DesignSystem = {
  colors: {
    primary: {
      main: "#059669", // emerald-600
      light: "#10b981", // emerald-500
      dark: "#047857", // emerald-700
      bg: "#d1fae5", // emerald-100
    },
    success: {
      main: "#10b981", // green-500
      light: "#34d399", // green-400
      bg: "#d1fae5", // green-100
    },
    warning: {
      main: "#f59e0b", // yellow-500
      light: "#fbbf24", // yellow-400
      bg: "#fef3c7", // yellow-100
    },
    danger: {
      main: "#ef4444", // red-500
      light: "#f87171", // red-400
      bg: "#fee2e2", // red-100
    },
    neutral: {
      main: "#6b7280", // gray-500
      light: "#9ca3af", // gray-400
      bg: "#f3f4f6", // gray-100
    },
  },
  
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },
  
  typography: {
    fontFamily: "'Cairo', system-ui, sans-serif",
    sizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },
    weights: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },
  
  status: {
    draft: {
      label: "مسودة",
      color: "neutral",
      icon: "edit",
    },
    submitted: {
      label: "قيد المراجعة",
      color: "warning",
      icon: "clock",
    },
    approved: {
      label: "موافق عليه",
      color: "success",
      icon: "check",
    },
    rejected: {
      label: "مرفوض",
      color: "danger",
      icon: "x",
    },
  },
} as const;

export type StatusType = keyof typeof DesignSystem.status;

