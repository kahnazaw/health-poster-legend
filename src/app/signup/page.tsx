"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [healthCenterName, setHealthCenterName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!fullName.trim()) {
      setError("يرجى إدخال الاسم الرباعي");
      return;
    }

    if (!healthCenterName.trim()) {
      setError("يرجى إدخال اسم المركز الصحي");
      return;
    }

    if (!email.trim()) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            health_center_name: healthCenterName,
            role: "center_user",
            is_approved: false,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
          setError("هذا البريد الإلكتروني مسجل بالفعل");
        } else {
          setError("حدث خطأ أثناء إنشاء الحساب: " + signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Profile will be created automatically by trigger
        setSuccess(true);
        setError("");
        // Clear form
        setFullName("");
        setHealthCenterName("");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إنشاء حساب جديد</h1>
            <p className="text-gray-600">دائرة صحة كركوك - قطاع كركوك الأول</p>
          </div>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
              <p className="font-semibold">تم إنشاء الحساب بنجاح، وهو قيد المراجعة من الإدارة</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الرباعي <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="أدخل الاسم الرباعي"
              />
            </div>

            <div>
              <label htmlFor="healthCenterName" className="block text-sm font-medium text-gray-700 mb-2">
                اسم المركز الصحي <span className="text-red-500">*</span>
              </label>
              <input
                id="healthCenterName"
                type="text"
                value={healthCenterName}
                onChange={(e) => setHealthCenterName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="أدخل اسم المركز الصحي"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="example@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="6 أحرف على الأقل"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </button>
          </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              لديك حساب بالفعل؟{" "}
              <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                تسجيل الدخول
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

