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
  title: "قطاع كركوك الأول - المنصة الإدارية",
  description: "قطاع كركوك الأول - المنصة الإدارية",
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
      <body className="antialiased selection:bg-[#059669]/20">
        <AuthProvider>
          <div className="animated-bg" /> {/* الخلفية المتحركة */}
          
          {/* هيدر آبل العائم */}
          <nav className="fixed top-6 left-0 right-0 z-[100] px-6">
            <div className="max-w-4xl mx-auto h-16 apple-glass rounded-full px-8 flex justify-between items-center shadow-2xl shadow-black/5">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 bg-white rounded-xl p-1.5 shadow-sm border border-slate-100 group-hover:rotate-6 transition-transform">
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-sm md:text-base font-black text-[#059669] font-tajawal">صحة كركوك</span>
              </Link>
              
              <div className="flex items-center gap-2">
                <Link href="/health-pulse" className="hidden sm:block text-xs font-bold text-slate-600 px-4 hover:text-emerald-600 transition-colors">نبض الصحة</Link>
                <Link href="/login" className="hidden sm:block text-xs font-bold text-slate-500 px-4">دخول</Link>
                <Link href="/signup" className="bg-[#059669] text-white px-6 py-2 rounded-full text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform whitespace-nowrap">ابدأ الآن</Link>
              </div>
            </div>
          </nav>
          
          <main className="pt-32 pb-20">{children}</main>
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
