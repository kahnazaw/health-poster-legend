"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // توجيه مباشر إلى لوحة التحكم (Dashboard)
    // يمكن تغيير المسار حسب الحاجة: /sector-dashboard أو /admin/approvals
    router.replace("/sector-dashboard");
  }, [router]);

  // عرض شاشة تحميل أثناء التوجيه
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
        <p className="mt-4 text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  );
}
