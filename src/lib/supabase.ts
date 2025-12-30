import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables are not set");
  console.warn("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file");
}

// إنشاء Supabase Client مع إعدادات Persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // الحفاظ على الجلسة حتى بعد إغلاق المتصفح
    autoRefreshToken: true, // تحديث الـ Token تلقائياً
    detectSessionInUrl: true, // اكتشاف الجلسة من URL (لـ OAuth)
    storage: typeof window !== "undefined" ? window.localStorage : undefined, // استخدام localStorage
    storageKey: "kirkuk-health-auth", // مفتاح مخصص للتخزين
  },
});

