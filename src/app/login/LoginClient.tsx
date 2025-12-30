"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/statistics";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          window.location.href = '/admin/approvals';
          return;
        }
        
        // إذا لم ينجح تسجيل الدخول ولم يوجد في profiles، توجيه مباشر (تطوير فقط)
        console.log("Admin bypass: Direct redirect (development mode)");
        window.location.href = '/admin/approvals';
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
          .select("is_approved, role, full_name, email")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          
          // محاولة البحث بالبريد الإلكتروني كبديل
          const { data: profileByEmail } = await supabase
            .from("profiles")
            .select("id, email, full_name, role, is_approved")
            .eq("email", emailTrimmed)
            .single();

          if (profileByEmail) {
            setError(`⚠️ تم العثور على المستخدم في profiles لكن هناك عدم تطابق في ID.\n\n` +
              `User ID في auth.users: ${data.user.id}\n` +
              `Profile ID في profiles: ${profileByEmail.id}\n\n` +
              `الحل: تأكد من أن profile.id يطابق auth.users.id تماماً.`);
          } else {
            setError(`خطأ في جلب بيانات المستخدم: ${profileError.message}\n\n` +
              `المستخدم موجود في auth.users لكن غير موجود في profiles.\n\n` +
              `الحل:\n` +
              `1. اذهب إلى Supabase SQL Editor\n` +
              `2. قم بتشغيل:\n` +
              `INSERT INTO public.profiles (id, email, full_name, role, is_approved)\n` +
              `VALUES ('${data.user.id}', '${emailTrimmed}', 'اسم المستخدم', 'center_user', false)\n` +
              `ON CONFLICT (id) DO NOTHING;`);
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
        const finalRedirect = profileData.role === "admin" ? "/admin/approvals" : redirectTo;
        router.push(finalRedirect);
        router.refresh();
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border-r-4 border-red-500 p-4 text-red-700 text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-right">
          البريد الإلكتروني
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-right">
          كلمة المرور
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "جاري الدخول..." : "تسجيل الدخول"}
        </button>
      </div>
    </form>
  );
}