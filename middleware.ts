// =====================================================
// MIDDLEWARE - الإصلاح الجذري لحلقة تسجيل الدخول
// =====================================================
// استخدام Supabase Auth Helpers للتحقق من الجلسة في Server-side
// توجيه قسري بدون تعقيدات

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // إنشاء Supabase client للـ middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // التحقق من الجلسة
  const { data: { session } } = await supabase.auth.getSession();
  const pathname = req.nextUrl.pathname;

  // إذا كان المستخدم في صفحة الدخول ومعه جلسة، انقله فوراً للاستوديو
  if (session && pathname === '/login') {
    const redirectUrl = new URL('/poster-studio', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // حماية صفحات الإدارة والاستوديو
  if (!session && (pathname.startsWith('/poster-studio') || pathname.startsWith('/admin'))) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// تحديد المسارات التي يجب تطبيق middleware عليها
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public files (public folder)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

