"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApprovalPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If not logged in, redirect to login
      if (!user) {
        router.push("/login");
        return;
      }
      // If approved, redirect to appropriate page
      if (profile && profile.is_approved) {
        if (profile.role === "admin") {
          router.push("/sector-dashboard");
        } else {
          router.push("/statistics");
        }
        return;
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || (profile && profile.is_approved)) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <img 
                src="/logo.png" 
                alt="شعار دائرة صحة كركوك" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">دائرة صحة كركوك</h1>
            <p className="text-gray-600 mb-6">قطاع كركوك الأول</p>
          </div>

          <div className="text-center space-y-6">
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                تم إنشاء حسابك بنجاح.
              </p>
              <p className="text-base text-gray-700 mb-2">
                حسابك قيد المراجعة من قبل إدارة القطاع.
              </p>
              <p className="text-base text-gray-700">
                سيتم تفعيل الحساب بعد الموافقة الرسمية.
              </p>
            </div>

            <button
              onClick={signOut}
              className="w-full py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

