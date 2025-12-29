"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      // إذا كان المستخدم مسجل دخول، إعادة توجيهه حسب دوره
      if (profile.is_approved) {
        if (profile.role === "admin") {
          router.push("/sector-dashboard");
        } else {
          router.push("/statistics");
        }
      } else {
        router.push("/pending-approval");
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

  // إذا كان المستخدم مسجل دخول، لا نعرض الصفحة الرئيسية
  if (user && profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#059669] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#059669]">
                دائرة صحة كركوك
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                قطاع كركوك الأول – وحدة تعزيز الصحة
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-6 py-2.5 bg-[#059669] text-white rounded-lg font-semibold hover:bg-[#047857] transition-all shadow-md hover:shadow-lg"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-white text-[#059669] border-2 border-[#059669] rounded-lg font-semibold hover:bg-emerald-50 transition-all"
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            منصة إدارة إحصائيات المراكز الصحية
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            نظام متكامل لإدارة وتتبع الإحصائيات الشهرية للمراكز الصحية وإنشاء البوسترات التوعوية
          </p>
        </div>

        {/* Features Grid - Improved Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-[#059669] hover:border-[#047857] hover:shadow-xl transition-all">
            <div className="w-20 h-20 bg-[#059669] rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">إرسال الإحصائيات</h3>
            <p className="text-gray-600 leading-relaxed">
              رفع ملفات Excel الشهرية بسهولة ومتابعة حالة التقرير حتى الاعتماد
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-[#059669] hover:border-[#047857] hover:shadow-xl transition-all">
            <div className="w-20 h-20 bg-[#059669] rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">لوحة متابعة القطاع</h3>
            <p className="text-gray-600 leading-relaxed">
              مراقبة جميع المراكز الصحية ومراجعة التقارير والموافقة عليها
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-[#059669] hover:border-[#047857] hover:shadow-xl transition-all">
            <div className="w-20 h-20 bg-[#059669] rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">إنشاء البوسترات</h3>
            <p className="text-gray-600 leading-relaxed">
              إنشاء بوسترات توعوية احترافية بتصميمات جاهزة وتصديرها بصيغ PNG و PDF
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-[#059669]">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">روابط سريعة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/poster"
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-[#059669] hover:border-[#047857] hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 bg-[#059669] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">إنشاء بوستر توعوي</h4>
                <p className="text-sm text-gray-600">ابدأ بإنشاء بوستر الآن</p>
              </div>
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-[#059669] hover:border-[#047857] hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 bg-[#059669] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">تسجيل الدخول</h4>
                <p className="text-sm text-gray-600">للوصول إلى حسابك</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600">
          <p className="mb-2">© {new Date().getFullYear()} دائرة صحة كركوك - جميع الحقوق محفوظة</p>
          <p className="text-sm">للاستخدام الرسمي فقط</p>
        </div>
      </div>
    </main>
  );
}
