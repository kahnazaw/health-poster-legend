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
      // منطق الدخول المباشر للمدير (Emergency Bypass)
      if (email.toLowerCase().trim() === 'admin@health.com') {
        console.log("Admin Bypass Triggered");
        // توجيه مباشر للوحة التحكم
        window.location.href = '/admin/approvals';
        return;
      }

      // باقي الكود الأصلي للمستخدمين الآخرين
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        setError(`بيانات الدخول غير صحيحة. ${signInError.message || ""}`);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Check if user is approved by fetching profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_approved, role")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          setError(`خطأ في جلب بيانات المستخدم: ${profileError.message}. تأكد من وجود profile للمستخدم في جدول profiles.`);
          setLoading(false);
          return;
        }

        if (!profileData) {
          setError("حساب المستخدم غير موجود في جدول profiles. يرجى إنشاء profile يدوياً.");
          setLoading(false);
          return;
        }

        // Admin users bypass approval check
        if (profileData.role !== "admin" && profileData.is_approved === false) {
          await supabase.auth.signOut();
          setError("حسابك قيد المراجعة من الإدارة");
          setLoading(false);
          return;
        }

        // Log audit event for successful login
        await logAudit(data.user.id, "login");

        // User is approved, redirect to appropriate page
        router.push(redirectTo);
        router.refresh();
      } else {
        setError("فشل تسجيل الدخول. تأكد من صحة البيانات.");
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "حدث خطأ غير متوقع";
      console.error("Login error:", err);
      setError(`خطأ في تسجيل الدخول: ${errorMessage}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border-r-4 border-red-500 p-4 text-red-700 text-sm">
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