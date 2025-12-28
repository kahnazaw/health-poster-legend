"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "center_user")[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Check if user is approved
      if (profile && !profile.is_approved) {
        router.push("/pending-approval");
        return;
      }

      if (allowedRoles.length > 0 && profile) {
        if (!allowedRoles.includes(profile.role)) {
          // Redirect based on role
          if (profile.role === "center_user") {
            router.push("/statistics");
          } else if (profile.role === "admin") {
            router.push("/sector-dashboard");
          } else {
            router.push(redirectTo);
          }
        }
      }
    }
  }, [user, profile, loading, allowedRoles, redirectTo, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Block unapproved users
  if (profile && !profile.is_approved) {
    return null;
  }

  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}

