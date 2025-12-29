"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, LayoutDashboard, ImagePlus, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppleLanding() {
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
      <div className="min-h-screen flex items-center justify-center">
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

  const services = [
    { title: "إرسال الإحصائيات", icon: <FileText size={32} />, color: "bg-emerald-500", desc: "رفع التقارير الشهرية لـ 23 مركزاً صحياً بذكاء.", link: "/statistics" },
    { title: "لوحة المتابعة", icon: <LayoutDashboard size={32} />, color: "bg-blue-500", desc: "تتبع مؤشرات الأداء الصحي في كركوك لحظة بلحظة.", link: "/sector-dashboard" },
    { title: "منصة البوسترات AI", icon: <ImagePlus size={32} />, color: "bg-amber-500", desc: "إنشاء تصاميم توعوية احترافية بالذكاء الاصطناعي.", link: "/poster" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Hero Section - Apple Spatial Style */}
      <section className="text-center py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/40 text-[11px] font-black text-emerald-700 mb-12 shadow-sm uppercase tracking-widest">
            <Sparkles size={14} /> قطاع كركوك الأول - التحول الرقمي
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight leading-[1.05] mb-10 font-tajawal">
            نبض الصحة <br /> في <span className="text-[#059669]">كركوك.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-16 px-4">
            منصة ذكية متكاملة لإدارة البيانات الصحية وتطوير المحتوى التوعوي لمراكزنا الصحية بأحدث التقنيات العالمية.
          </p>
        </motion.div>
      </section>

      {/* Grid Style - Apple Control Center Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {services.map((item, idx) => (
          <Link key={idx} href={item.link}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.8, ease: "easeOut" }}
              whileHover={{ y: -12, scale: 1.02 }}
              className="apple-card p-12 group cursor-pointer"
            >
              <div className={`${item.color} w-20 h-20 rounded-[2.2rem] flex items-center justify-center text-white mb-10 shadow-2xl transition-all duration-700 group-hover:rotate-[12deg] group-hover:scale-110`}>
                {item.icon}
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-4 font-tajawal">{item.title}</h3>
              <p className="text-slate-400 text-sm font-bold leading-relaxed mb-10 opacity-80 group-hover:opacity-100 transition-opacity">
                {item.desc}
              </p>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#059669] group-hover:text-white transition-all duration-300">
                <ChevronLeft size={24} />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
