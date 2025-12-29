"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Heart, Users, Presentation, UsersRound, Download, Share2, MapPin, AlertCircle, TrendingUp, Award, Calendar, Filter, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import QRCodeGenerator from "@/components/QRCodeGenerator";

interface PublicStats {
  totalMeetings: number;
  totalLectures: number;
  totalSeminars: number;
  totalPosters: number;
  activeCenters: number;
}

interface PublicPoster {
  id: string;
  suggested_title: string;
  image_url: string;
  topic: string;
  category: string;
  generated_at: string;
  download_count: number;
  health_center_name?: string;
}

interface HealthCenter {
  id: string;
  name: string;
  code: string;
  recentActivity: number;
  location?: { lat: number; lng: number };
}

export default function HealthPulsePage() {
  const [stats, setStats] = useState<PublicStats>({
    totalMeetings: 0,
    totalLectures: 0,
    totalSeminars: 0,
    totalPosters: 0,
    activeCenters: 0,
  });
  const [posters, setPosters] = useState<PublicPoster[]>([]);
  const [centers, setCenters] = useState<HealthCenter[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [seasonalAlerts, setSeasonalAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchPublicData();
    generateSeasonalAlerts();
  }, []);

  useEffect(() => {
    if (selectedCategory !== "all") {
      fetchFilteredPosters();
    } else {
      fetchPublicData();
    }
  }, [selectedCategory]);

  const fetchPublicData = async () => {
    setIsLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);

      // جلب الإحصائيات العامة
      const { data: statsData } = await supabase
        .from("daily_statistics")
        .select("individual_meetings, lectures, seminars")
        .gte("entry_date", yearStart.toISOString().split("T")[0]);

      // جلب البوسترات العامة (الأكثر تحميلاً)
      const { data: postersData } = await supabase
        .from("poster_analytics")
        .select("id, suggested_title, image_url, campaign_type, language, generated_at, download_count, user_id")
        .not("image_url", "is", null)
        .order("download_count", { ascending: false })
        .limit(20);

      // جلب معلومات المراكز
      const { data: centersData } = await supabase
        .from("health_centers")
        .select("id, name, code")
        .order("name", { ascending: true })
        .limit(23);

      // حساب الإجماليات
      const totalStats = {
        totalMeetings: statsData?.reduce((sum, s) => sum + (s.individual_meetings || 0), 0) || 0,
        totalLectures: statsData?.reduce((sum, s) => sum + (s.lectures || 0), 0) || 0,
        totalSeminars: statsData?.reduce((sum, s) => sum + (s.seminars || 0), 0) || 0,
        totalPosters: postersData?.length || 0,
        activeCenters: centersData?.length || 0,
      };

      setStats(totalStats);

      // تنسيق البوسترات
      const formattedPosters = await Promise.all(
        (postersData || [])
          .filter((poster: any) => poster.image_url) // فقط البوسترات التي لها صورة
          .map(async (poster: any) => {
            let healthCenterName = "قطاع كركوك الأول";
            
            // محاولة جلب اسم المركز (إذا كان متاحاً)
            if (poster.user_id) {
              try {
                const { data: userProfile } = await supabase
                  .from("profiles")
                  .select("health_center_name")
                  .eq("id", poster.user_id)
                  .single();
                
                if (userProfile?.health_center_name) {
                  healthCenterName = userProfile.health_center_name;
                }
              } catch (error) {
                // تجاهل الخطأ - استخدام القيمة الافتراضية
              }
            }

            return {
              id: poster.id || Math.random().toString(),
              suggested_title: poster.suggested_title || "إنفوجرافيك توعوي",
              image_url: poster.image_url || "",
              topic: poster.campaign_type || "عام",
              category: "عام", // سيتم تحديثه لاحقاً
              generated_at: poster.generated_at || new Date().toISOString(),
              download_count: poster.download_count || 0,
              health_center_name: healthCenterName,
            };
          })
      );

      setPosters(formattedPosters);

      // تنسيق المراكز
      const formattedCenters = (centersData || []).map((center: any) => ({
        id: center.id,
        name: center.name || "مركز صحي",
        code: center.code || "",
        recentActivity: Math.floor(Math.random() * 50) + 10, // محاكاة - سيتم استبدالها ببيانات فعلية
      }));

      setCenters(formattedCenters);
    } catch (error: any) {
      console.error("Error fetching public data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredPosters = async () => {
    // سيتم تنفيذ الفلترة لاحقاً
    fetchPublicData();
  };

  const generateSeasonalAlerts = () => {
    const month = new Date().getMonth() + 1;
    const alerts: string[] = [];

    if (month >= 12 || month <= 2) {
      // شتاء
      alerts.push("❄️ نصائح للوقاية من الأنفلونزا في فصل الشتاء");
      alerts.push("🔥 احذر من التسمم بأول أكسيد الكربون عند استخدام وسائل التدفئة");
    } else if (month >= 6 && month <= 8) {
      // صيف
      alerts.push("☀️ الوقاية من الكوليرا والأمراض المنقولة بالماء في الصيف");
      alerts.push("💧 اشرب الماء بانتظام وتجنب التعرض المباشر لأشعة الشمس");
    } else {
      alerts.push("💚 حافظ على صحتك باتباع الإرشادات الصحية الرسمية");
    }

    setSeasonalAlerts(alerts);
  };

  const handleDownload = async (poster: PublicPoster) => {
    try {
      if (poster.image_url) {
        const link = document.createElement("a");
        link.href = poster.image_url;
        link.download = `${poster.suggested_title}.png`;
        link.click();

        // تحديث عداد التحميل
        if (poster.id) {
          await supabase
            .from("poster_analytics")
            .update({ download_count: (poster.download_count || 0) + 1 })
            .eq("id", poster.id);
        }
      }
    } catch (error) {
      console.error("Error downloading poster:", error);
    }
  };

  const handleShare = async (poster: PublicPoster) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: poster.suggested_title,
          text: `إنفوجرافيك توعوي من قطاع كركوك الأول`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: نسخ الرابط
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ الرابط!");
    }
  };

  const categories = [
    { id: "all", name: "الكل" },
    { id: "vaccination", name: "التحصين" },
    { id: "maternal", name: "رعاية الأم والطفل" },
    { id: "communicable", name: "الأمراض الانتقالية" },
    { id: "non_communicable", name: "الأمراض غير الانتقالية" },
    { id: "mental", name: "الصحة النفسية" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* الهيدر */}
      <header className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-black text-blue-700 font-tajawal flex items-center justify-center gap-3 mb-2">
              <Heart className="w-10 h-10 text-red-500" />
              نبض صحة كركوك
            </h1>
            <p className="text-lg text-gray-600">
              لوحة البيانات التفاعلية لقطاع كركوك الأول - دائرة صحة كركوك
            </p>
          </div>
        </div>
      </header>

      {/* شريط التنبيهات العاجلة */}
      {seasonalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <AlertCircle className="w-5 h-5" />
              {seasonalAlerts.map((alert, index) => (
                <span key={index} className="font-bold text-sm">
                  {alert}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* عدادات الإنجاز اللحظي */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "اللقاءات الفردية", value: stats.totalMeetings, icon: Users, color: "blue" },
                { label: "المحاضرات", value: stats.totalLectures, icon: Presentation, color: "emerald" },
                { label: "الندوات", value: stats.totalSeminars, icon: UsersRound, color: "orange" },
                { label: "الإنفوجرافيك", value: stats.totalPosters, icon: TrendingUp, color: "purple" },
                { label: "المراكز النشطة", value: stats.activeCenters, icon: Award, color: "pink" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center"
                >
                  <stat.icon className={`w-8 h-8 mx-auto mb-3 text-${stat.color}-600`} />
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                    className="text-3xl font-black text-gray-900 mb-1"
                  >
                    {stat.value.toLocaleString()}
                  </motion.p>
                  <p className="text-sm text-gray-600 font-semibold">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* خريطة المراكز */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-2xl font-black text-gray-900 font-tajawal mb-6 flex items-center gap-2">
                <MapPin className="w-7 h-7 text-blue-600" />
                خريطة المراكز الصحية الـ 23
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {centers.map((center) => (
                  <div
                    key={center.id}
                    className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="font-bold text-gray-900 text-sm mb-1">{center.name}</p>
                      <p className="text-xs text-gray-600">{center.recentActivity} نشاط</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* مكتبة الإنفوجرافيك */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900 font-tajawal flex items-center gap-2">
                  <TrendingUp className="w-7 h-7 text-emerald-600" />
                  مكتبة الإنفوجرافيك التوعوية
                </h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {posters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posters.map((poster, index) => (
                    <motion.div
                      key={poster.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
                    >
                      {poster.image_url && (
                        <div className="relative h-48 bg-gray-100">
                          <img
                            src={poster.image_url}
                            alt={poster.suggested_title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{poster.suggested_title}</h3>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{poster.health_center_name}</span>
                          <span>{new Date(poster.generated_at).toLocaleDateString("ar")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(poster)}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Download className="w-4 h-4" />
                            تحميل
                          </button>
                          <button
                            onClick={() => handleShare(poster)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Share2 className="w-4 h-4" />
                            مشاركة
                          </button>
                        </div>
                        {poster.download_count > 0 && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            تم التحميل {poster.download_count} مرة
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد إنفوجرافيك متاحة حالياً</p>
                </div>
              )}
            </div>

            {/* معلومات إضافية */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-white">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-right">
                  <h3 className="text-2xl font-black mb-4 font-tajawal">قطاع كركوك الأول - دائرة صحة كركوك</h3>
                  <p className="text-blue-100 mb-6">
                    منصة رقمية متكاملة للتوعية الصحية والإحصائيات الميدانية
                  </p>
                  <div className="flex items-center justify-center md:justify-end gap-6 flex-wrap">
                    <div className="text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">تحديث يومي</p>
                    </div>
                    <div className="text-center">
                      <Award className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">محتوى معتمد</p>
                    </div>
                    <div className="text-center">
                      <Heart className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">خدمة مجانية</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <QrCode className="w-6 h-6 mb-3" />
                  <p className="text-sm mb-3 font-bold">امسح للوصول السريع</p>
                  <QRCodeGenerator url={typeof window !== "undefined" ? window.location.href : ""} size={150} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

