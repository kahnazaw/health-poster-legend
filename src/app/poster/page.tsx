"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * إعادة توجيه صفحة /poster القديمة إلى /poster-studio الجديدة
 * الصفحة الجديدة تحتوي على جميع الميزات المحدثة:
 * - حقل نصي ذكي للموضوع
 * - اقتراحات موسمية
 * - مبدل القوالب
 * - إنفوجرافيك مكوّني
 * - API الجديد /api/generate-infographic
 */
export default function PosterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/poster-studio");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
        <p className="mt-4 text-gray-600">جاري التوجيه إلى استوديو الإنفوجرافيك...</p>
      </div>
    </div>
  );
}
