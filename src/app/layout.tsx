import type { Metadata } from "next";
import { Tajawal, Vazirmatn } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";

const vazirmatn = Vazirmatn({ subsets: ["arabic"], variable: "--font-vazirmatn" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ['700', '900'], variable: "--font-tajawal" });

export const metadata: Metadata = {
  title: "منصة تعزيز الصحة | كركوك",
  description: "المنصة الذكية لقطاع كركوك الأول",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${vazirmatn.variable} ${tajawal.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="إحصائيات صحة كركوك" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900">
        <AuthProvider>
          <nav className="fixed top-0 left-0 right-0 z-[100] glass-nav h-20">
            <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
              <Link href="/" className="flex items-center gap-4 flex-shrink-0">
                <div className="relative w-12 h-12 bg-white rounded-2xl p-1 shadow-sm border border-emerald-50">
                  <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-[#059669] leading-tight">دائرة صحة كركوك</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">قطاع كركوك الأول</span>
                </div>
              </Link>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-600 px-4 whitespace-nowrap">دخول</Link>
                <Link href="/signup" className="bg-[#059669] text-white px-6 py-2.5 rounded-full text-sm font-black shadow-lg shadow-emerald-500/20 whitespace-nowrap">ابدأ الآن</Link>
              </div>
            </div>
          </nav>
          <main className="pt-20">{children}</main>
          <BottomNav />
          <PWAInstallPrompt />
        </AuthProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('SW registered: ', registration);
                  })
                  .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
