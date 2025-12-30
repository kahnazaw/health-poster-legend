"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { LogIn, Mail, Lock, Sparkles } from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Redirect check - only after initial render and auth loading completes
  // This prevents blocking the initial render
  useEffect(() => {
    // Wait for auth to finish loading before checking redirect
    if (authLoading) return;
    
    // Only check redirect once
    if (redirectChecked) return;
    setRedirectChecked(true);

    // If user is already logged in, redirect them
    if (user) {
      const targetPath = profile?.role === "admin" ? "/admin/approvals" : "/poster-studio";
      console.log("User already logged in, redirecting to:", targetPath);
      // Use window.location.href for full page reload (bypass cache)
      window.location.href = targetPath;
    }
  }, [user, profile, authLoading, redirectChecked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const emailTrimmed = email.toLowerCase().trim();
      
      // 1. تسجيل الدخول
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: password,
      });

      if (authError) {
        // رسائل خطأ واضحة
        let errorMessage = "بيانات الدخول غير صحيحة.";
        
        if (authError.message.includes("Invalid login credentials")) {
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        } else if (authError.message.includes("Email not confirmed")) {
          errorMessage = "البريد الإلكتروني غير مفعّل. يرجى التحقق من بريدك الإلكتروني.";
        } else {
          errorMessage = `خطأ في تسجيل الدخول: ${authError.message}`;
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError("فشل تسجيل الدخول. تأكد من صحة البيانات.");
        setLoading(false);
        return;
      }

      // 2. التحقق من Profile والموافقة
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("is_approved, role, full_name, email, health_center_id")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profileData) {
        setError("حساب المستخدم غير موجود في النظام. يرجى التواصل مع الإدارة.");
        setLoading(false);
        return;
      }

      // التحقق من الموافقة (Admin يتجاوز هذا التحقق)
      if (profileData.role !== "admin" && profileData.is_approved === false) {
        await supabase.auth.signOut();
        setError("حسابك قيد المراجعة من الإدارة. يرجى انتظار الموافقة.");
        setLoading(false);
        return;
      }

      // 3. تسجيل حدث الدخول (غير حرج)
      try {
        await logAudit(data.user.id, "login");
      } catch (auditError) {
        console.warn("Audit log failed (non-critical):", auditError);
      }

      // 4. التحقق القسري من الجلسة وتخزينها في المتصفح
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 5. استخدام التحميل الكامل للصفحة لضمان قراءة ملفات الارتباط (Cookies)
        // هذا يحل مشكلة "جاري الدخول" الأبدية
        const finalRedirect = profileData.role === "admin" ? "/admin/approvals" : "/poster-studio";
        window.location.href = finalRedirect;
      } else {
        setError("فشل في التحقق من الجلسة. يرجى المحاولة مرة أخرى.");
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "حدث خطأ غير متوقع";
      console.error("Login error:", err);
      setError(`خطأ في تسجيل الدخول: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-slate-950">
      {/* الخلفية المتحركة "نبض الصحة" - محدثة للخلفية الداكنة */}
      <AnimatedBackground />
      
      {/* شعار قطاع كركوك الأول - ثابت في أعلى اليسار */}
      <div className="fixed top-6 left-6 z-50 glass-effect rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center neon-glow">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <p className="text-sm font-black text-emerald-400 font-tajawal">قطاع كركوك الأول</p>
            <p className="text-xs text-slate-400">المنصة الإدارية</p>
          </div>
        </div>
      </div>
      
      {/* نموذج تسجيل الدخول مع Glassmorphism - النسخة الأسطورية */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-effect rounded-3xl shadow-2xl p-8 backdrop-blur-xl border-emerald-500/30">
          {/* العنوان مع أيقونة متوهجة */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl mb-4 shadow-lg neon-glow">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-emerald-400 font-tajawal mb-2">
              تسجيل الدخول
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              مركز التحكم - المنصة الإدارية
            </p>
          </div>

          {/* رسالة النجاح */}
          {successMessage && (
            <div className="bg-emerald-500/20 border-r-4 border-emerald-500 p-4 text-emerald-400 text-sm whitespace-pre-line rounded-xl mb-6 flex items-center gap-2 backdrop-blur-sm">
              <svg className="w-5 h-5 flex-shrink-0 neon-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* رسالة الخطأ */}
          {error && (
            <div className="bg-red-500/20 border-r-4 border-red-500 p-4 text-red-400 text-sm whitespace-pre-line rounded-xl mb-6 backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* نموذج الدخول */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* حقل البريد الإلكتروني - Floating Label */}
            <div className="relative">
              <label htmlFor="email" className="absolute right-4 top-3 text-slate-400 text-sm font-medium flex items-center gap-2 pointer-events-none transition-all">
                <Mail className="w-4 h-4 text-emerald-500 neon-glow" />
                <span className={email ? "opacity-0" : ""}>البريد الإلكتروني</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-slate-100 font-medium transition-all placeholder:text-slate-500"
                placeholder=""
              />
            </div>

            {/* حقل كلمة المرور - Floating Label */}
            <div className="relative">
              <label htmlFor="password" className="absolute right-4 top-3 text-slate-400 text-sm font-medium flex items-center gap-2 pointer-events-none transition-all">
                <Lock className="w-4 h-4 text-emerald-500 neon-glow" />
                <span className={password ? "opacity-0" : ""}>كلمة المرور</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-slate-100 font-medium transition-all placeholder:text-slate-500"
                placeholder=""
              />
            </div>

            {/* زر تسجيل الدخول - مع Neon Glow */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-black text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:shadow-emerald-500/50 hover:scale-[1.02] neon-glow"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الدخول...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* رابط التسجيل */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              ليس لديك حساب؟{" "}
              <a href="/signup" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors neon-glow">
                إنشاء حساب جديد
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
