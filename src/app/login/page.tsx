import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-2">قطاع كركوك الأول - المنصة الإدارية</h1>
        <h2 className="text-xl text-gray-600">تسجيل الدخول للنظام</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {/* تغليف المكون بـ Suspense ضروري جداً هنا */}
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500">جاري تحميل صفحة الدخول...</p>
            </div>
          }>
            <LoginClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}