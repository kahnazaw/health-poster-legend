'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMagic, FaFilePdf, FaChartLine, FaHospitalSymbol } from 'react-icons/fa';

export default function PosterStudio() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [score, setScore] = useState(0);

  // 1. مزامنة الجلسة لضمان التعرف على هوية "مدير قطاع كركوك"
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        window.location.replace('/login'); // توجيه قسري لكسر حلقة التكرار
      } else {
        setSession(currentSession);
        // جلب النقاط بناءً على خوارزمية القطاع
        setScore(15); // قيمة افتراضية لأول بوستر
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) window.location.replace('/login');
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">جاري تحميل الأسطورة...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-tajawal">
      {/* شعار قطاع كركوك الأول الثابت */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3 bg-slate-900/50 backdrop-blur-xl p-3 rounded-2xl border border-emerald-500/20">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          <FaHospitalSymbol className="text-white text-xl" />
        </div>
        <span className="font-bold text-sm tracking-tight text-emerald-400">قطاع كركوك الأول</span>
      </div>

      <div className="max-w-7xl mx-auto mt-16 grid grid-cols-12 gap-6">
        
        {/* الخلية الكبرى: معاينة البوستر (8 أعمدة) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 lg:col-span-8 bg-slate-900/40 backdrop-blur-md border border-emerald-500/20 rounded-3xl p-6 min-h-[600px] relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaMagic className="text-emerald-500" /> معاينة البوستر الذكي
            </h2>
            <button className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
              <FaFilePdf /> تصدير PDF للطباعة
            </button>
          </div>
          
          <div className="aspect-[3/4] bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center">
            {generating ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-emerald-400">ذكاء Gemini يصمم الآن...</p>
              </div>
            ) : (
              <p className="text-slate-500">اكتب موضوعاً واضغط على 'توليد' للبدء</p>
            )}
          </div>
        </motion.div>

        {/* الخلية الجانبية: الإعدادات (4 أعمدة) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* لوحة التحكم */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6"
          >
            <h3 className="text-lg font-bold mb-4 text-emerald-400">إعدادات المحتوى</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">موضوع البوستر</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:border-emerald-500 outline-none transition-all resize-none h-32"
                  placeholder="مثال: أهمية غسل اليدين للوقاية من الكوليرا في كركوك"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">المركز الصحي (من الـ 23 مركزاً)</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:border-emerald-500 outline-none transition-all">
                  <option>مركز صحي العروبة</option>
                  <option>مركز صحي تسعين</option>
                  {/* سيتم ملء البقية آلياً */}
                </select>
              </div>
              <button 
                onClick={() => setGenerating(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform"
              >
                توليد الإنفوجرافيك الآن
              </button>
            </div>
          </motion.div>

          {/* إحصائيات سريعة بنظام Bento */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-emerald-400/80">نقاط المركز الحالية</p>
              <h4 className="text-3xl font-bold text-emerald-400">{score}</h4>
            </div>
            <FaChartLine className="text-4xl text-emerald-500/40" />
          </motion.div>

        </div>
      </div>
    </main>
  );
}
