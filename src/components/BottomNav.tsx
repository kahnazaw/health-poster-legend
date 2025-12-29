"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const isAdmin = profile?.role === "admin";
  const isCenterUser = profile?.role === "center_user";

  // Hide on login/signup pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname === "/" || pathname?.startsWith("/pending-approval")) {
    return null;
  }

  const navItems = [];

  if (isAdmin) {
    navItems.push(
      { path: "/sector-dashboard", label: "لوحة التحكم", icon: "📊" },
      { path: "/admin/reports", label: "التقارير", icon: "📄" },
      { path: "/admin/audit-log", label: "سجل التدقيق", icon: "📋" }
    );
  } else if (isCenterUser) {
    navItems.push(
      { path: "/statistics", label: "الإحصائيات", icon: "📊" }
    );
  }

  if (navItems.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
              }`}
              aria-label={item.label}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className={`text-xs font-medium ${isActive ? "font-bold" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

