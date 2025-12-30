// =====================================================
// MIDDLEWARE - Login Loop Prevention
// =====================================================
// منع حلقة تسجيل الدخول: إذا كان المستخدم مسجل دخول بالفعل
// وحاول الوصول إلى /login، يتم توجيهه تلقائياً

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // إذا كان المسار هو /login، نتحقق من وجود جلسة نشطة
  // لكن لا نتحقق من Supabase هنا (لأنه server-side)
  // بدلاً من ذلك، نعتمد على Client-side redirect في LoginClient.tsx
  
  // السماح بجميع المسارات الأخرى بدون تدخل
  // (الحماية تتم في Client-side لتجنب مشاكل Cache)
  
  return NextResponse.next();
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

