"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, LayoutDashboard, ImagePlus, ChevronLeft, Sparkles } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
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

  const features = [
    { title: "إرسال الإحصائيات", icon: <FileText size={32} />, link: "/statistics", color: "bg-emerald-500" },
    { title: "لوحة المتابعة", icon: <LayoutDashboard size={32} />, link: "/sector-dashboard", color: "bg-blue-500" },
    { title: "منصة البوسترات AI", icon: <ImagePlus size={32} />, link: "/poster", color: "bg-orange-500" }
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="pt-20 pb-24 text-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-8 border border-emerald-100">
            <Sparkles size={14} /> منصة الذكاء الاصطناعي الأولى في كركوك
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 font-tajawal">
            نبض الصحة في <span className="text-[#059669]">كركوك</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 mb-12 leading-relaxed font-medium">
            النظام الرقمي المتكامل لخدمة 23 مركزاً صحياً في قطاع كركوك الأول. 
            إحصائيات دقيقة، تحليلات ذكية، وتصاميم توعوية فورية.
          </p>
        </motion.div>
      </section>

      {/* Legendary Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="legend-card p-10 group"
            >
              <div className={`${item.color} w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl transition-transform group-hover:rotate-12 duration-500`}>
                {item.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4 font-tajawal">{item.title}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">حلول رقمية متطورة لتسهيل العمل اليومي وتعزيز كفاءة الموظفين في القطاع.</p>
              <Link href={item.link} className="inline-flex items-center gap-2 text-[#059669] font-black text-sm group-hover:gap-4 transition-all">
                دخول القسم <ChevronLeft size={18} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
