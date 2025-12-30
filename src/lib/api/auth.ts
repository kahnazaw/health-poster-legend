/**
 * API Authentication Helper
 * مساعد المصادقة لمسارات API
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * التحقق من جلسة المستخدم في API Route
 * يستخدم Authorization header أو Cookie
 */
export async function verifyAuth(request: NextRequest): Promise<{
  user: any;
  session: any;
  error?: string;
}> {
  try {
    // الحصول على Authorization header
    const authHeader = request.headers.get("authorization");
    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }

    // إنشاء Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      },
    });

    // محاولة الحصول على المستخدم
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        user: null,
        session: null,
        error: userError?.message || "Unauthorized: No valid authentication found",
      };
    }

    // الحصول على session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      // حتى لو فشل الحصول على session، إذا كان user موجوداً، نعتبره مصادقاً
      return { user, session: null };
    }

    return { user, session: session || null };
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: error?.message || "Authentication verification failed",
    };
  }
}

/**
 * التحقق من أن المستخدم لديه profile
 */
export async function verifyProfile(userId: string): Promise<{
  profile: any;
  error?: string;
}> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return {
        profile: null,
        error: "User profile not found",
      };
    }

    return { profile };
  } catch (error: any) {
    return {
      profile: null,
      error: error?.message || "Failed to fetch profile",
    };
  }
}
