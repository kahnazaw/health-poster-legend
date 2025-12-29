"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
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
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#059669] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 opacity-5 rounded-full blur-3xl"></div>
      </div>

      {/* Sticky Navigation Header with Glass Effect */}
      <header className="sticky top-0 z-50 glass-effect border-b border-[#059669]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#059669]">
                  دائرة صحة كركوك
                </h1>
                <p className="text-xs md:text-sm text-gray-600">
                  قطاع كركوك الأول – وحدة تعزيز الصحة
                </p>
              </div>
            </div>

            {/* Navigation Links - Fixed with flex-shrink-0 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/login"
                className="px-5 py-2.5 bg-[#059669] text-white rounded-xl font-semibold hover:bg-[#047857] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap flex-shrink-0"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-white text-[#059669] border-2 border-[#059669] rounded-xl font-semibold hover:bg-[#059669] hover:text-white transition-all duration-300 whitespace-nowrap flex-shrink-0"
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Gradient Background */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block mb-6 px-4 py-2 bg-[#059669]/10 rounded-full border border-[#059669]/20">
              <span className="text-[#059669] font-semibold text-sm">منصة رقمية متكاملة</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              منصة إدارة
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#059669] to-[#047857]">
                إحصائيات المراكز الصحية
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              نظام متكامل لإدارة وتتبع الإحصائيات الشهرية للمراكز الصحية وإنشاء البوسترات التوعوية الاحترافية
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/poster"
                className="group px-8 py-4 bg-gradient-to-r from-[#059669] to-[#047857] text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-[#059669]/50 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <span>ابدأ الآن</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-[#059669] border-2 border-[#059669] rounded-xl font-bold text-lg hover:bg-[#059669] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                تسجيل الدخول
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid with Enhanced Cards */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ميزات المنصة
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              حلول متكاملة لإدارة المراكز الصحية بكفاءة واحترافية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <motion.div 
              className="group bg-white rounded-[32px] shadow-xl p-8 border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#059669] to-[#047857] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">إرسال الإحصائيات</h3>
              <p className="text-gray-600 leading-relaxed">
                رفع ملفات Excel الشهرية بسهولة ومتابعة حالة التقرير حتى الاعتماد النهائي
              </p>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div 
              className="group bg-white rounded-[32px] shadow-xl p-8 border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#059669] to-[#047857] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">لوحة متابعة القطاع</h3>
              <p className="text-gray-600 leading-relaxed">
                مراقبة جميع المراكز الصحية ومراجعة التقارير والموافقة عليها بسهولة
              </p>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div 
              className="group bg-white rounded-[32px] shadow-xl p-8 border border-gray-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#059669] to-[#047857] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">إنشاء البوسترات</h3>
              <p className="text-gray-600 leading-relaxed">
                إنشاء بوسترات توعوية احترافية بتصميمات جاهزة وتصديرها بصيغ PNG و PDF
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="bg-white rounded-[32px] shadow-xl p-10 border border-gray-100"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-10 text-center">روابط سريعة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/poster"
                className="group flex items-center gap-5 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-[#059669] hover:border-[#047857] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xl mb-1">إنشاء بوستر توعوي</h4>
                  <p className="text-sm text-gray-600">ابدأ بإنشاء بوستر احترافي الآن</p>
                </div>
              </Link>

              <Link
                href="/login"
                className="group flex items-center gap-5 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-[#059669] hover:border-[#047857] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xl mb-1">تسجيل الدخول</h4>
                  <p className="text-sm text-gray-600">للوصول إلى حسابك</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p className="mb-2 text-lg">© {new Date().getFullYear()} دائرة صحة كركوك - جميع الحقوق محفوظة</p>
          <p className="text-sm">للاستخدام الرسمي فقط</p>
        </div>
      </footer>
    </main>
  );
}
