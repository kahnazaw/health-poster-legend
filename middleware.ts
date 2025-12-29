import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح بالوصول إلى /admin إذا كان هناك cookie معين (للتطوير/الاختبار)
  const adminBypassCookie = request.cookies.get('admin_bypass');
  const isAdminBypass = adminBypassCookie?.value === 'true' || adminBypassCookie?.value === 'kirkuk-admin-2024';

  // إذا كان المسار يبدأ بـ /admin
  if (pathname.startsWith('/admin')) {
    // السماح بالوصول إذا كان هناك cookie bypass
    if (isAdminBypass) {
      console.log('Admin bypass enabled via cookie - allowing access to:', pathname);
      return NextResponse.next();
    }

    // تعطيل إعادة التوجيه التلقائي مؤقتاً للاختبار
    // يمكنك تعليق هذا الجزء إذا أردت إعادة تفعيل الحماية
    // return NextResponse.redirect(new URL('/login', request.url));

    // مؤقتاً: السماح بالوصول بدون إعادة توجيه (للتطوير)
    console.log('Admin route access allowed (development mode):', pathname);
    return NextResponse.next();
  }

  // السماح بجميع المسارات الأخرى
  return NextResponse.next();
}

// تحديد المسارات التي يجب تطبيق middleware عليها
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

