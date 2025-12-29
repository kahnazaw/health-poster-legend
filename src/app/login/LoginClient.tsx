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
      // Development backdoor: Allow admin@health.com to bypass password check
      const isDevAdmin = email.toLowerCase().trim() === "admin@health.com";
      
      let data, signInError;
      
      if (isDevAdmin) {
        // Try normal login first
        const result = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        data = result.data;
        signInError = result.error;
        
        // If login fails for dev admin, log warning but don't block
        // This allows development testing even with password issues
        if (signInError) {
          console.warn("Dev admin login: Password validation bypassed (development mode)");
          // Continue to check if user exists and proceed
        }
      } else {
        const result = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        data = result.data;
        signInError = result.error;
      }

      if (signInError && !isDevAdmin) {
        setError("بيانات الدخول غير صحيحة");
        setLoading(false);
        return;
      }
      
      // For dev admin, if login failed but user exists, try to get user
      if (signInError && isDevAdmin) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // User exists, create data object manually for dev admin
          data = { user };
        } else {
          setError("حساب المدير غير موجود. يرجى إنشاؤه في Supabase Dashboard أولاً.");
          setLoading(false);
          return;
        }
      }

      if (data.user) {
        // Check if user is approved by fetching profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_approved")
          .eq("id", data.user.id)
          .single();

        if (profileData && profileData.is_approved === false) {
          // User is not approved, redirect to pending approval page
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
      }
    } catch (err) {
      setError("حدث خطأ أثناء محاولة تسجيل الدخول");
      console.error(err);
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