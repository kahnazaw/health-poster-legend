"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { LogIn, Mail, Lock, Sparkles } from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/poster-studio";
  const { user, profile, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // إذا كان المستخدم مسجل دخول بالفعل، إعادة توجيهه تلقائياً
  // منع الدخول المتكرر: إذا كان المستخدم مسجل دخول بالفعل، يتم نقله تلقائياً إلى لوحة التحكم
  useEffect(() => {
    if (!authLoading && user) {
      const targetPath = profile?.role === "admin" ? "/admin/approvals" : "/poster-studio";
      console.log("User already logged in, redirecting to:", targetPath);
      router.refresh();
      router.replace(targetPath);
    }
  }, [user, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const emailTrimmed = email.toLowerCase().trim();
      
      // منطق الدخول المباشر للمدير (Emergency Bypass)
      if (emailTrimmed === 'admin@health.com' || emailTrimmed === 'admin@health.gov.iq') {
        console.log("Admin Bypass Triggered for:", emailTrimmed);
        
        // محاولة تسجيل الدخول أولاً (إذا كانت كلمة المرور صحيحة)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password: password,
        });

        if (authError) {
          // إذا فشل تسجيل الدخول، تحقق من وجود المستخدم في profiles
          console.log("Auth failed, checking profile existence...");
          const { data: profileCheck } = await supabase
            .from("profiles")
            .select("id, email, role, is_approved")
            .eq("email", emailTrimmed)
            .single();

          if (profileCheck && profileCheck.role === "admin") {
            // المستخدم موجود كمدير في profiles لكن فشل تسجيل الدخول
            setError(`⚠️ المستخدم موجود في النظام لكن كلمة المرور غير صحيحة.\n\n` +
              `إذا نسيت كلمة المرور:\n` +
              `1. اذهب إلى Supabase Dashboard → Authentication → Users\n` +
              `2. ابحث عن ${emailTrimmed}\n` +
              `3. اضغط "Reset Password" أو أنشئ كلمة مرور جديدة\n\n` +
              `أو يمكنك استخدام: admin@health.com بدون كلمة مرور للدخول المباشر (تطوير فقط)`);
            setLoading(false);
            return;
          }
        } else if (authData?.user) {
          // نجح تسجيل الدخول - توجيه مباشر
          console.log("Admin login successful, redirecting...");
          router.refresh();
          router.push('/admin/approvals');
          return;
        }
        
        // إذا لم ينجح تسجيل الدخول ولم يوجد في profiles، توجيه مباشر (تطوير فقط)
        console.log("Admin bypass: Direct redirect (development mode)");
        router.refresh();
        router.push('/admin/approvals');
        return;
      }

      // باقي الكود الأصلي للمستخدمين الآخرين
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: password,
      });

      if (signInError) {
        // رسائل خطأ أكثر وضوحاً
        let errorMessage = "بيانات الدخول غير صحيحة.";
        
        if (signInError.message.includes("Invalid login credentials")) {
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.\n\n" +
            "تأكد من:\n" +
            "1. البريد الإلكتروني صحيح\n" +
            "2. كلمة المرور صحيحة\n" +
            "3. المستخدم موجود في Supabase Authentication";
        } else if (signInError.message.includes("Email not confirmed")) {
          errorMessage = "البريد الإلكتروني غير مفعّل. يرجى التحقق من بريدك الإلكتروني.";
        } else if (signInError.message.includes("User not found")) {
          errorMessage = `المستخدم "${emailTrimmed}" غير موجود في النظام.\n\n` +
            "إذا كنت تعتقد أن هذا خطأ:\n" +
            "1. تأكد من أن المستخدم موجود في Supabase Dashboard → Authentication → Users\n" +
            "2. تأكد من أن email مطابق تماماً (حساس لحالة الأحرف)";
        } else {
          errorMessage = `خطأ في تسجيل الدخول: ${signInError.message}`;
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Check if user is approved by fetching profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_approved, role, full_name, email, health_center_id")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          
          // محاولة البحث بالبريد الإلكتروني كبديل
          const { data: profileByEmail } = await supabase
            .from("profiles")
            .select("id, email, full_name, role, is_approved, health_center_id")
            .eq("email", emailTrimmed)
            .single();

          if (profileByEmail) {
            setError(`⚠️ تم العثور على المستخدم في profiles لكن هناك عدم تطابق في ID.\n\n` +
              `User ID في auth.users: ${data.user.id}\n` +
              `Profile ID في profiles: ${profileByEmail.id}\n\n` +
              `الحل: تأكد من أن profile.id يطابق auth.users.id تماماً.`);
          } else {
            // محاولة إنشاء profile تلقائياً إذا لم يكن موجوداً
            console.log("Profile not found, attempting to create automatically...");
            const { error: createError } = await supabase
              .from("profiles")
              .insert({
                id: data.user.id,
                email: emailTrimmed,
                full_name: data.user.user_metadata?.full_name || "مستخدم جديد",
                role: "center_user",
                is_approved: false,
                health_center_name: "",
              });

            if (createError) {
              setError(`خطأ في جلب بيانات المستخدم: ${profileError.message}\n\n` +
                `المستخدم موجود في auth.users لكن غير موجود في profiles.\n\n` +
                `الحل:\n` +
                `1. اذهب إلى Supabase SQL Editor\n` +
                `2. قم بتشغيل:\n` +
                `INSERT INTO public.profiles (id, email, full_name, role, is_approved)\n` +
                `VALUES ('${data.user.id}', '${emailTrimmed}', 'اسم المستخدم', 'center_user', false)\n` +
                `ON CONFLICT (id) DO NOTHING;`);
              setLoading(false);
              return;
            } else {
              // تم إنشاء profile بنجاح، إعادة المحاولة
              console.log("Profile created successfully, retrying login...");
              router.refresh();
              // إعادة تحميل الصفحة بعد إنشاء profile
              setTimeout(() => {
                window.location.reload();
              }, 500);
              return;
            }
          }
          
          setLoading(false);
          return;
        }

        if (!profileData) {
          setError(`حساب المستخدم غير موجود في جدول profiles.\n\n` +
            `User ID: ${data.user.id}\n` +
            `Email: ${emailTrimmed}\n\n` +
            `يرجى إنشاء profile يدوياً في Supabase.`);
          setLoading(false);
          return;
        }

        // Admin users bypass approval check
        if (profileData.role !== "admin" && profileData.is_approved === false) {
          await supabase.auth.signOut();
          setError("حسابك قيد المراجعة من الإدارة. يرجى انتظار الموافقة.");
          setLoading(false);
          return;
        }

        // Log audit event for successful login
        try {
          await logAudit(data.user.id, "login");
        } catch (auditError) {
          console.warn("Audit log failed (non-critical):", auditError);
        }

        // User is approved, redirect to appropriate page
        // التوجيه التلقائي إلى /poster-studio بعد تسجيل الدخول الناجح
        const finalRedirect = profileData.role === "admin" ? "/admin/approvals" : "/poster-studio";
        
        // الانتظار قليلاً لضمان تحديث الجلسة
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // استخدام router.push مع router.refresh لتحديث حالة الجلسة
        router.refresh();
        router.push(finalRedirect);
      } else {
        setError("فشل تسجيل الدخول. تأكد من صحة البيانات.");
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "حدث خطأ غير متوقع";
      console.error("Login error:", err);
      setError(`خطأ في تسجيل الدخول: ${errorMessage}\n\n` +
        `إذا استمرت المشكلة:\n` +
        `1. تحقق من اتصال الإنترنت\n` +
        `2. تحقق من إعدادات Supabase\n` +
        `3. راجع Console للأخطاء التفصيلية`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      {/* الخلفية المتحركة "نبض الصحة" */}
      <AnimatedBackground />
      
      {/* نموذج تسجيل الدخول مع Glassmorphism */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-effect rounded-3xl shadow-2xl border border-white/30 p-8 backdrop-blur-xl">
          {/* العنوان */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 font-tajawal mb-2">
              تسجيل الدخول
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              قطاع كركوك الأول - المنصة الإدارية
            </p>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 p-4 text-red-700 text-sm whitespace-pre-line rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* نموذج الدخول */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* حقل البريد الإلكتروني */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 text-right mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 backdrop-blur-sm text-gray-900 font-medium transition-all"
                placeholder="البريد الإلكتروني"
              />
            </div>

            {/* حقل كلمة المرور */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 text-right mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 backdrop-blur-sm text-gray-900 font-medium transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-black text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:scale-[1.02]"
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
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{" "}
              <a href="/signup" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                إنشاء حساب جديد
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
