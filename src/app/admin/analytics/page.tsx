"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, TrendingUp, Award, Download, Calendar, Users, Presentation, UsersRound, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { calculatePeriodScore } from "@/lib/analytics/scoringEngine";

interface CenterStats {
  center_id: string;
  center_name: string;
  total_meetings: number;
  total_lectures: number;
  total_seminars: number;
  total_posters: number;
  score: number;
  rank: number;
}

interface DailyComparison {
  date: string;
  [key: string]: string | number;
}

export default function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [centerStats, setCenterStats] = useState<CenterStats[]>([]);
  const [dailyComparison, setDailyComparison] = useState<DailyComparison[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchAnalytics();
    }
  }, [user, profile, selectedPeriod]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // حساب الفترة الزمنية
      const today = new Date();
      let startDate: Date;

      if (selectedPeriod === "today") {
        startDate = today;
      } else if (selectedPeriod === "week") {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
      } else {
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
      }

      // جلب إحصائيات جميع المراكز
      const { data: statsData, error: statsError } = await supabase
        .from("daily_statistics")
        .select(`
          center_id,
          individual_meetings,
          lectures,
          seminars,
          entry_date,
          profiles!inner(full_name, health_center_name)
        `)
        .gte("entry_date", startDate.toISOString().split("T")[0])
        .lte("entry_date", today.toISOString().split("T")[0]);

      if (statsError) throw statsError;

      // تجميع الإحصائيات حسب المركز
      const centerMap = new Map<string, CenterStats>();

      statsData?.forEach((stat: any) => {
        const centerId = stat.center_id;
        if (!centerMap.has(centerId)) {
          centerMap.set(centerId, {
            center_id: centerId,
            center_name: stat.profiles?.health_center_name || stat.profiles?.full_name || "غير معروف",
            total_meetings: 0,
            total_lectures: 0,
            total_seminars: 0,
            total_posters: 0,
            score: 0,
            rank: 0,
          });
        }

        const center = centerMap.get(centerId)!;
        center.total_meetings += stat.individual_meetings || 0;
        center.total_lectures += stat.lectures || 0;
        center.total_seminars += stat.seminars || 0;
      });

      // جلب عدد البوسترات المولدة لكل مركز (من poster_analytics)
      const { data: postersData } = await supabase
        .from("poster_analytics")
        .select("user_id")
        .gte("generated_at", startDate.toISOString())
        .lte("generated_at", today.toISOString());

      // حساب عدد البوسترات لكل مركز
      const postersMap = new Map<string, number>();
      postersData?.forEach((poster: any) => {
        const userId = poster.user_id;
        postersMap.set(userId, (postersMap.get(userId) || 0) + 1);
      });

      // حساب النقاط لكل مركز باستخدام المعادلة الرسمية
      const centers = Array.from(centerMap.values()).map((center) => {
        const postersCount = postersMap.get(center.center_id) || 0;
        const scoreResult = calculatePeriodScore({
          totalMeetings: center.total_meetings,
          totalLectures: center.total_lectures,
          totalSeminars: center.total_seminars,
          totalPosters: postersCount,
        });
        return {
          ...center,
          total_posters: postersCount,
          score: scoreResult.normalizedScore,
        };
      });

      // ترتيب حسب النقاط
      centers.sort((a, b) => b.score - a.score);
      centers.forEach((center, index) => {
        center.rank = index + 1;
      });

      setCenterStats(centers);

      // جلب المقارنة اليومية
      await fetchDailyComparison(startDate, today);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      alert("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyComparison = async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from("daily_statistics")
        .select(`
          entry_date,
          individual_meetings,
          lectures,
          seminars,
          profiles!inner(health_center_name)
        `)
        .gte("entry_date", startDate.toISOString().split("T")[0])
        .lte("entry_date", endDate.toISOString().split("T")[0]);

      if (error) throw error;

      // تجميع حسب التاريخ
      const dateMap = new Map<string, { meetings: number; lectures: number; seminars: number }>();

      data?.forEach((stat: any) => {
        const date = stat.entry_date;
        if (!dateMap.has(date)) {
          dateMap.set(date, { meetings: 0, lectures: 0, seminars: 0 });
        }

        const day = dateMap.get(date)!;
        day.meetings += stat.individual_meetings || 0;
        day.lectures += stat.lectures || 0;
        day.seminars += stat.seminars || 0;
      });

      const comparison = Array.from(dateMap.entries())
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString("ar", { month: "short", day: "numeric" }),
          لقاءات: stats.meetings,
          محاضرات: stats.lectures,
          ندوات: stats.seminars,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setDailyComparison(comparison);
    } catch (error: any) {
      console.error("Error fetching daily comparison:", error);
    }
  };

  // تم حذف calculateScore - نستخدم calculatePeriodScore مباشرة

  const handleExportReport = async (type: "weekly" | "monthly") => {
    // سيتم تنفيذ هذا لاحقاً
    alert(`سيتم إنشاء التقرير ${type === "weekly" ? "الأسبوعي" : "الشهري"} قريباً`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* الهيدر */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#059669] font-tajawal">
                لوحة التحليل والمقارنة
              </h1>
              <p className="text-sm text-gray-600 mt-1">مقارنة حية بين المراكز الـ 23</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as "today" | "week" | "month")}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="today">اليوم</option>
                <option value="week">آخر أسبوع</option>
                <option value="month">آخر شهر</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
              <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* بطاقات الإحصائيات السريعة */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">إجمالي اللقاءات</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">
                      {centerStats.reduce((sum, c) => sum + c.total_meetings, 0)}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-emerald-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">إجمالي المحاضرات</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">
                      {centerStats.reduce((sum, c) => sum + c.total_lectures, 0)}
                    </p>
                  </div>
                  <Presentation className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">إجمالي الندوات</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">
                      {centerStats.reduce((sum, c) => sum + c.total_seminars, 0)}
                    </p>
                  </div>
                  <UsersRound className="w-12 h-12 text-orange-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">المراكز النشطة</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">
                      {centerStats.filter((c) => c.score > 0).length}
                    </p>
                  </div>
                  <Award className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* جدول التصنيف */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-black text-gray-900 font-tajawal flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                  تصنيف المراكز حسب الأداء
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                    <tr>
                      <th className="px-6 py-4 text-center font-black text-sm">الترتيب</th>
                      <th className="px-6 py-4 text-right font-black text-sm">اسم المركز</th>
                      <th className="px-6 py-4 text-center font-black text-sm">اللقاءات</th>
                      <th className="px-6 py-4 text-center font-black text-sm">المحاضرات</th>
                      <th className="px-6 py-4 text-center font-black text-sm">الندوات</th>
                      <th className="px-6 py-4 text-center font-black text-sm">البوسترات</th>
                      <th className="px-6 py-4 text-center font-black text-sm">النقاط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {centerStats.map((center, index) => (
                      <tr
                        key={center.center_id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index < 3 ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-center">
                          {index < 3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full font-black">
                              {index + 1}
                            </span>
                          ) : (
                            <span className="text-gray-600 font-bold">{index + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {center.center_name}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-700">
                          {center.total_meetings}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-700">
                          {center.total_lectures}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-700">
                          {center.total_seminars}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-700">
                          {center.total_posters || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-black">
                            {center.score.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* الرسم البياني للمقارنة اليومية */}
            {dailyComparison.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-black text-gray-900 font-tajawal mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  المقارنة اليومية
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="لقاءات" stroke="#059669" strokeWidth={2} />
                    <Line type="monotone" dataKey="محاضرات" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="ندوات" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* أزرار التصدير */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleExportReport("weekly")}
                className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg font-black text-gray-900">التقرير الأسبوعي</h3>
                  <p className="text-sm text-gray-600 mt-1">تصدير بيانات الأسبوع الحالي</p>
                </div>
                <Download className="w-6 h-6 text-gray-400" />
              </button>

              <button
                onClick={() => handleExportReport("monthly")}
                className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg font-black text-gray-900">التقرير الشهري الموحد</h3>
                  <p className="text-sm text-gray-600 mt-1">تصدير تقرير موحد للقطاع</p>
                </div>
                <Download className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

