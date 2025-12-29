"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Award, TrendingUp, Calendar, Maximize2, Download, Zap, Users, Presentation, UsersRound, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { calculatePeriodScore } from "@/lib/analytics/scoringEngine";

interface CenterRanking {
  center_id: string;
  center_name: string;
  score: number;
  rank: number;
  total_meetings: number;
  total_lectures: number;
  total_seminars: number;
  total_posters: number;
  previousScore: number;
  scoreChange: number;
}

interface TopicDistribution {
  topic: string;
  category: string;
  value: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  totalScore: number;
  totalMeetings: number;
  totalLectures: number;
  totalSeminars: number;
}

export default function PresentationPage() {
  const { user, profile } = useAuth();
  const [rankings, setRankings] = useState<CenterRanking[]>([]);
  const [topicDistribution, setTopicDistribution] = useState<TopicDistribution[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalMeetings: 0,
    totalLectures: 0,
    totalSeminars: 0,
    totalPosters: 0,
    totalScore: 0,
  });

  useEffect(() => {
    if (user && profile?.role === "admin") {
      initializeMonths();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedMonth) {
      fetchPresentationData();
    }
  }, [selectedMonth]);

  const initializeMonths = () => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(currentMonth);
  };

  const fetchPresentationData = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);

      // جلب بيانات الشهر الحالي
      const currentData = await fetchMonthData(startDate, endDate);

      // جلب بيانات الشهر السابق للمقارنة
      const previousStartDate = new Date(parseInt(year), parseInt(month) - 2, 1);
      const previousEndDate = new Date(parseInt(year), parseInt(month) - 1, 0);
      const previousData = await fetchMonthData(previousStartDate, previousEndDate);

      // حساب التغييرات
      const rankingsWithChanges = currentData.rankings.map((current) => {
        const previous = previousData.rankings.find((p) => p.center_id === current.center_id);
        const previousScore = previous?.score || 0;
        return {
          ...current,
          previousScore,
          scoreChange: current.score - previousScore,
        };
      });

      setRankings(rankingsWithChanges);
      setTopicDistribution(currentData.topicDistribution);
      setTotalStats(currentData.totalStats);
    } catch (error: any) {
      console.error("Error fetching presentation data:", error);
      alert("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthData = async (startDate: Date, endDate: Date) => {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // جلب الإحصائيات
    const { data: statsData } = await supabase
      .from("daily_statistics")
      .select(`
        center_id,
        individual_meetings,
        lectures,
        seminars,
        profiles!inner(full_name, health_center_name),
        health_topics!inner(topic_name, category_name)
      `)
      .gte("entry_date", startDateStr)
      .lte("entry_date", endDateStr);

    // جلب البوسترات
    const { data: postersData } = await supabase
      .from("poster_analytics")
      .select("user_id")
      .gte("generated_at", startDate.toISOString())
      .lte("generated_at", endDate.toISOString());

    // تجميع البيانات
    const centerMap = new Map<string, any>();
    const topicMap = new Map<string, { topic: string; category: string; value: number }>();

    statsData?.forEach((stat: any) => {
      const centerId = stat.center_id;
      const centerName = stat.profiles?.health_center_name || stat.profiles?.full_name || "غير معروف";

      if (!centerMap.has(centerId)) {
        centerMap.set(centerId, {
          center_id: centerId,
          center_name: centerName,
          total_meetings: 0,
          total_lectures: 0,
          total_seminars: 0,
          total_posters: 0,
        });
      }

      const center = centerMap.get(centerId);
      center.total_meetings += stat.individual_meetings || 0;
      center.total_lectures += stat.lectures || 0;
      center.total_seminars += stat.seminars || 0;

      // تجميع المواضيع
      const topicName = stat.health_topics?.topic_name || "غير معروف";
      const category = stat.health_topics?.category_name || "عام";
      const activity = (stat.individual_meetings || 0) + (stat.lectures || 0) + (stat.seminars || 0);

      if (!topicMap.has(topicName)) {
        topicMap.set(topicName, { topic: topicName, category, value: 0 });
      }
      topicMap.get(topicName)!.value += activity;
    });

    // حساب البوسترات
    const postersMap = new Map<string, number>();
    postersData?.forEach((poster: any) => {
      const userId = poster.user_id;
      postersMap.set(userId, (postersMap.get(userId) || 0) + 1);
    });

    // حساب النقاط
    const rankings = Array.from(centerMap.values())
      .map((center) => {
        const postersCount = postersMap.get(center.center_id) || 0;
        center.total_posters = postersCount;

        const scoreResult = calculatePeriodScore({
          totalMeetings: center.total_meetings,
          totalLectures: center.total_lectures,
          totalSeminars: center.total_seminars,
          totalPosters: postersCount,
        });

        return {
          ...center,
          score: scoreResult.normalizedScore,
          rank: 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((center, index) => ({
        ...center,
        rank: index + 1,
      }));

    // توزيع المواضيع
    const totalActivity = Array.from(topicMap.values()).reduce((sum, t) => sum + t.value, 0);
    const topicDistribution = Array.from(topicMap.values())
      .map((t) => ({
        topic: t.topic,
        category: t.category,
        value: t.value,
        percentage: totalActivity > 0 ? (t.value / totalActivity) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // الإجماليات
    const totalStats = {
      totalMeetings: rankings.reduce((sum, c) => sum + c.total_meetings, 0),
      totalLectures: rankings.reduce((sum, c) => sum + c.total_lectures, 0),
      totalSeminars: rankings.reduce((sum, c) => sum + c.total_seminars, 0),
      totalPosters: rankings.reduce((sum, c) => sum + c.total_posters, 0),
      totalScore: rankings.reduce((sum, c) => sum + c.score, 0),
    };

    // الاتجاه الشهري سيتم حسابه منفصلاً
    const monthlyTrend: MonthlyTrend[] = [];

    return { rankings, topicDistribution, totalStats };
  };

  const fetchMonthlyTrend = async (year: number, month: number): Promise<MonthlyTrend[]> => {
    const trend: MonthlyTrend[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(year, month - 1 - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthStartStr = monthStart.toISOString().split("T")[0];
      const monthEndStr = monthEnd.toISOString().split("T")[0];

      // جلب بيانات الشهر
      const { data: statsData } = await supabase
        .from("daily_statistics")
        .select("individual_meetings, lectures, seminars")
        .gte("entry_date", monthStartStr)
        .lte("entry_date", monthEndStr);

      const { data: postersData } = await supabase
        .from("poster_analytics")
        .select("user_id")
        .gte("generated_at", monthStart.toISOString())
        .lte("generated_at", monthEnd.toISOString());

      const monthStats = {
        totalMeetings: statsData?.reduce((sum, s) => sum + (s.individual_meetings || 0), 0) || 0,
        totalLectures: statsData?.reduce((sum, s) => sum + (s.lectures || 0), 0) || 0,
        totalSeminars: statsData?.reduce((sum, s) => sum + (s.seminars || 0), 0) || 0,
        totalPosters: postersData?.length || 0,
      };

      const monthScore = calculatePeriodScore({
        totalMeetings: monthStats.totalMeetings,
        totalLectures: monthStats.totalLectures,
        totalSeminars: monthStats.totalSeminars,
        totalPosters: monthStats.totalPosters,
      });

      trend.push({
        month: monthDate.toLocaleDateString("ar", { month: "short", year: "numeric" }),
        totalScore: monthScore.normalizedScore * 23, // تقدير إجمالي القطاع
        totalMeetings: monthStats.totalMeetings,
        totalLectures: monthStats.totalLectures,
        totalSeminars: monthStats.totalSeminars,
      });
    }

    return trend;
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    // سيتم تنفيذ هذا لاحقاً
    alert("سيتم إضافة وظيفة التحميل قريباً");
  };

  const COLORS = ["#059669", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#10b981", "#f97316", "#6366f1"];

  const topThree = rankings.slice(0, 3);
  const champions = rankings
    .filter((c) => c.scoreChange > 0)
    .sort((a, b) => b.scoreChange - a.scoreChange)
    .slice(0, 5);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* الهيدر */}
      <header className="bg-black/40 backdrop-blur-lg border-b border-emerald-500/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-emerald-400 font-tajawal flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                لوحة عرض النتائج الشهرية
              </h1>
              <p className="text-sm text-gray-400 mt-1">قطاع كركوك الأول - عرض تفاعلي للاجتماعات</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-gray-800 border-2 border-emerald-500/30 rounded-xl text-emerald-400 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                  const label = date.toLocaleDateString("ar", { month: "long", year: "numeric" });
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleFullscreen}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <Maximize2 className="w-5 h-5" />
                ملء الشاشة
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                تحميل
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
              <p className="mt-4 text-gray-400">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* عدادات الإنجاز الكلي */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { label: "إجمالي النقاط", value: totalStats.totalScore.toFixed(0), icon: Trophy, color: "emerald" },
                { label: "اللقاءات الفردية", value: totalStats.totalMeetings.toLocaleString(), icon: Users, color: "blue" },
                { label: "المحاضرات", value: totalStats.totalLectures.toLocaleString(), icon: Presentation, color: "orange" },
                { label: "الندوات", value: totalStats.totalSeminars.toLocaleString(), icon: UsersRound, color: "purple" },
                { label: "البوسترات الذكية", value: totalStats.totalPosters.toLocaleString(), icon: Zap, color: "pink" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-emerald-500/20 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                    <span className="text-xs text-gray-400 font-semibold">{stat.label}</span>
                  </div>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                    className="text-4xl font-black text-white"
                  >
                    {stat.value}
                  </motion.p>
                </motion.div>
              ))}
            </div>

            {/* منصة التتويج */}
            {topThree.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-emerald-500/30 shadow-2xl">
                <h2 className="text-2xl font-black text-emerald-400 font-tajawal mb-8 text-center flex items-center justify-center gap-3">
                  <Trophy className="w-7 h-7" />
                  منصة التتويج - المراكز الثلاثة الأولى
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topThree.map((center, index) => {
                    const positions = [
                      { order: 2, height: "h-32", color: "from-yellow-600 to-yellow-500", medal: "🥇" },
                      { order: 1, height: "h-40", color: "from-gray-400 to-gray-500", medal: "🥈" },
                      { order: 3, height: "h-28", color: "from-orange-600 to-orange-500", medal: "🥉" },
                    ];
                    const pos = positions[index];

                    return (
                      <motion.div
                        key={center.center_id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2, type: "spring" }}
                        className={`order-${pos.order} flex flex-col items-center`}
                      >
                        <div className={`w-full ${pos.height} bg-gradient-to-b ${pos.color} rounded-t-2xl flex items-end justify-center pb-4 border-2 border-white/20 shadow-xl`}>
                          <div className="text-center">
                            <div className="text-4xl mb-2">{pos.medal}</div>
                            <div className="text-5xl font-black text-white">{center.rank}</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-800 rounded-b-2xl p-6 border-t-0 border-2 border-white/20">
                          <h3 className="text-xl font-black text-white text-center mb-2">{center.center_name}</h3>
                          <div className="text-center">
                            <p className="text-3xl font-black text-emerald-400 mb-1">{center.score.toFixed(1)}</p>
                            <p className="text-sm text-gray-400">نقطة</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* خريطة المواضيع */}
            {topicDistribution.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-emerald-500/20 shadow-2xl"
                >
                  <h2 className="text-xl font-black text-emerald-400 font-tajawal mb-6">توزيع المواضيع</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topicDistribution as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percentage }: any) => `${percentage.toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topicDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-emerald-500/20 shadow-2xl"
                >
                  <h2 className="text-xl font-black text-emerald-400 font-tajawal mb-6">مؤشر النبض الشهري</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #059669" }} />
                      <Legend />
                      <Line type="monotone" dataKey="totalScore" stroke="#059669" strokeWidth={3} dot={{ fill: "#059669" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            )}

            {/* أبطال الشهر */}
            {champions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-emerald-500/20 shadow-2xl"
              >
                <h2 className="text-xl font-black text-emerald-400 font-tajawal mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  أبطال الشهر - أعلى قفزة في الأداء
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {champions.map((champion, index) => (
                    <div
                      key={champion.center_id}
                      className="bg-gray-700/50 rounded-xl p-4 border border-emerald-500/20"
                    >
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-1">{champion.center_name}</p>
                        <p className="text-2xl font-black text-emerald-400">+{champion.scoreChange.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">نقطة إضافية</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
