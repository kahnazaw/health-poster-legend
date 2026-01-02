"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, TrendingUp, AlertTriangle, Calendar, BarChart3, Activity, Award, Zap, Crown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { calculatePeriodScore } from "@/lib/analytics/scoringEngine";
import { motion, useSpring, useTransform } from "framer-motion";

interface CenterRanking {
  center_id: string;
  center_name: string;
  total_meetings: number;
  total_lectures: number;
  total_seminars: number;
  total_posters: number;
  score: number;
  rank: number;
  lastActivityDate: string | null;
  daysInactive: number;
  isActive: boolean;
}

interface ActivityHeatmap {
  topic: string;
  category: string;
  totalActivity: number;
  percentage: number;
}

// Counter Animation Component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => Math.round(current));

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [rankings, setRankings] = useState<CenterRanking[]>([]);
  const [heatmap, setHeatmap] = useState<ActivityHeatmap[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");
  const [isLoading, setIsLoading] = useState(false);
  const [inactiveCenters, setInactiveCenters] = useState<CenterRanking[]>([]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchLeaderboard();
    }
  }, [user, profile, selectedPeriod]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
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

      // جلب جميع الإحصائيات
      const { data: statsData, error: statsError } = await supabase
        .from("daily_statistics")
        .select(`
          center_id,
          individual_meetings,
          lectures,
          seminars,
          entry_date,
          profiles!inner(full_name, health_center_name),
          health_topics!inner(topic_name, category_name)
        `)
        .gte("entry_date", startDate.toISOString().split("T")[0])
        .lte("entry_date", today.toISOString().split("T")[0]);

      if (statsError) throw statsError;

      // جلب البوسترات
      const { data: postersData } = await supabase
        .from("poster_analytics")
        .select("user_id")
        .gte("generated_at", startDate.toISOString())
        .lte("generated_at", today.toISOString());

      // تجميع البيانات حسب المركز
      const centerMap = new Map<string, CenterRanking>();
      const topicMap = new Map<string, { topic: string; category: string; activity: number }>();

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
            score: 0,
            rank: 0,
            lastActivityDate: null,
            daysInactive: 0,
            isActive: true,
          });
        }

        const center = centerMap.get(centerId)!;
        center.total_meetings += stat.individual_meetings || 0;
        center.total_lectures += stat.lectures || 0;
        center.total_seminars += stat.seminars || 0;

        // تحديث آخر نشاط
        const entryDate = new Date(stat.entry_date);
        if (!center.lastActivityDate || entryDate > new Date(center.lastActivityDate)) {
          center.lastActivityDate = stat.entry_date;
        }

        // تجميع النشاط حسب الموضوع
        const topicName = stat.health_topics?.topic_name || "غير معروف";
        const category = stat.health_topics?.category_name || "عام";
        const activity = (stat.individual_meetings || 0) + (stat.lectures || 0) + (stat.seminars || 0);

        if (!topicMap.has(topicName)) {
          topicMap.set(topicName, { topic: topicName, category, activity: 0 });
        }
        topicMap.get(topicName)!.activity += activity;
      });

      // حساب عدد البوسترات لكل مركز
      const postersMap = new Map<string, number>();
      postersData?.forEach((poster: any) => {
        const userId = poster.user_id;
        postersMap.set(userId, (postersMap.get(userId) || 0) + 1);
      });

      // حساب النقاط وتحديد الركود
      const rankingsList = Array.from(centerMap.values()).map((center) => {
        const postersCount = postersMap.get(center.center_id) || 0;
        center.total_posters = postersCount;

        const scoreResult = calculatePeriodScore({
          totalMeetings: center.total_meetings,
          totalLectures: center.total_lectures,
          totalSeminars: center.total_seminars,
          totalPosters: postersCount,
        });
        center.score = scoreResult.normalizedScore;

        // حساب أيام الركود
        if (center.lastActivityDate) {
          const lastDate = new Date(center.lastActivityDate);
          const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          center.daysInactive = daysDiff;
          center.isActive = daysDiff <= 2; // نشط إذا كان آخر نشاط خلال يومين
        } else {
          center.daysInactive = 999; // لم يبدأ بعد
          center.isActive = false;
        }

        return center;
      });

      // ترتيب حسب النقاط
      rankingsList.sort((a, b) => b.score - a.score);
      rankingsList.forEach((center, index) => {
        center.rank = index + 1;
      });

      setRankings(rankingsList);
      setInactiveCenters(rankingsList.filter((c) => !c.isActive));

      // إنشاء خريطة النشاط
      const totalActivity = Array.from(topicMap.values()).reduce((sum, t) => sum + t.activity, 0);
      const heatmapData = Array.from(topicMap.values())
        .map((t) => ({
          topic: t.topic,
          category: t.category,
          totalActivity: t.activity,
          percentage: totalActivity > 0 ? (t.activity / totalActivity) * 100 : 0,
        }))
        .sort((a, b) => b.totalActivity - a.totalActivity)
        .slice(0, 10); // أعلى 10 مواضيع

      setHeatmap(heatmapData);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      alert("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-300";
    if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-white text-gray-700 border-gray-200";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl"
        />
      </motion.div>
    );
    if (rank === 2) return <Award className="w-5 h-5 text-gray-600" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
    return null;
  };

  const chartData = rankings.slice(0, 10).map((center) => ({
    name: center.center_name.length > 15 ? center.center_name.substring(0, 15) + "..." : center.center_name,
    نقاط: center.score,
    لقاءات: center.total_meetings,
    محاضرات: center.total_lectures,
    ندوات: center.total_seminars,
    بوسترات: center.total_posters,
  }));

  const COLORS = ["#059669", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* الهيدر */}
      <header className="glass-effect border-b border-emerald-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black text-emerald-400 font-tajawal flex items-center gap-3"
              >
                <Trophy className="w-8 h-8 neon-glow" />
                لوحة المقارنة والتقييم
              </motion.h1>
              <p className="text-sm text-slate-400 mt-2">ترتيب المراكز الـ 23 حسب الأداء والنشاط</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as "today" | "week" | "month")}
                className="px-4 py-2 bg-slate-900/50 border-2 border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-slate-100"
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
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-2xl p-6 border-emerald-500/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-semibold">إجمالي النقاط</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">
                      <AnimatedCounter value={rankings.reduce((sum, c) => sum + c.score, 0)} />
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-emerald-400 neon-glow" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-effect rounded-2xl p-6 border-emerald-500/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-semibold">المراكز النشطة</p>
                    <p className="text-3xl font-black text-blue-400 mt-2">
                      <AnimatedCounter value={rankings.filter((c) => c.isActive).length} />
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-8 h-8 text-blue-400 neon-glow" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-effect rounded-2xl p-6 border-emerald-500/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-semibold">المراكز الراكدة</p>
                    <p className="text-3xl font-black text-orange-400 mt-2">
                      <AnimatedCounter value={inactiveCenters.length} />
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-orange-400 neon-glow" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-effect rounded-2xl p-6 border-emerald-500/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-semibold">إجمالي البوسترات</p>
                    <p className="text-3xl font-black text-purple-400 mt-2">
                      <AnimatedCounter value={rankings.reduce((sum, c) => sum + c.total_posters, 0)} />
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-purple-400 neon-glow" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* تنبيهات الركود */}
            {inactiveCenters.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-effect border-2 border-orange-500/30 rounded-2xl p-6 bg-orange-500/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-black text-orange-400 font-tajawal">تنبيه: مراكز غير نشطة</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {inactiveCenters.slice(0, 6).map((center) => (
                    <motion.div
                      key={center.center_id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-effect rounded-xl p-4 border border-orange-500/30 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-100">{center.center_name}</p>
                        <p className="text-sm text-slate-400">
                          آخر نشاط: {center.daysInactive === 999 ? "لم يبدأ" : `منذ ${center.daysInactive} يوم`}
                        </p>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-orange-400 neon-glow" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* الرسم البياني للمراكز العشرة الأولى */}
            {chartData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-2xl p-6 border-emerald-500/20"
              >
                <h2 className="text-xl font-black text-emerald-400 font-tajawal mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-emerald-400 neon-glow" />
                  المراكز العشرة الأولى
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="نقاط" fill="#059669" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* خريطة النشاط (Activity Heatmap) */}
            {heatmap.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-2xl p-6 border-emerald-500/20"
              >
                <h2 className="text-xl font-black text-emerald-400 font-tajawal mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-emerald-400 neon-glow" />
                  خريطة النشاط - المواضيع الأكثر تركيزاً
                </h2>
                <div className="space-y-4">
                  {heatmap.map((item, index) => (
                    <div key={item.topic} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                          <span className="font-semibold text-slate-100">{item.topic}</span>
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-400">{item.totalActivity}</span>
                          <span className="text-sm text-slate-400 mr-2">نشاط</span>
                          <span className="font-bold text-slate-300">{item.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                        ></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* جدول الترتيب الكامل */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-2xl overflow-hidden border-emerald-500/20"
            >
              <div className="p-6 border-b border-emerald-500/30 bg-gradient-to-r from-emerald-600/80 to-emerald-700/80 backdrop-blur-sm">
                <h2 className="text-2xl font-black text-white font-tajawal flex items-center gap-2">
                  <Trophy className="w-7 h-7 neon-glow" />
                  الترتيب الكامل للمراكز
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-center font-black text-sm text-emerald-400">الترتيب</th>
                      <th className="px-6 py-4 text-right font-black text-sm text-emerald-400">اسم المركز</th>
                      <th className="px-6 py-4 text-center font-black text-sm text-emerald-400">اللقاءات</th>
                      <th className="px-6 py-4 text-center font-black text-sm text-emerald-400">المحاضرات</th>
                      <th className="px-6 py-4 text-center font-black text-sm text-emerald-400">الندوات</th>
                      <th className="px-6 py-4 text-center font-black text-sm text-emerald-400">البوسترات</th>
                      <th className="px-6 py-4 text-center font-black text-sm text-emerald-400">النقاط</th>
                      <th className="px-6 py-4 text-center font-black text-sm text-emerald-400">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {rankings.map((center) => (
                      <motion.tr
                        key={center.center_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: center.rank * 0.03 }}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          center.rank === 1 ? "bg-yellow-500/10 border-l-4 border-yellow-500" : ""
                        } ${center.rank === 2 ? "bg-gray-500/10 border-l-4 border-gray-400" : ""}
                        ${center.rank === 3 ? "bg-orange-500/10 border-l-4 border-orange-400" : ""}
                        ${!center.isActive ? "bg-orange-500/5" : ""}`}
                      >
                        <td className="px-6 py-4 text-center">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: center.rank * 0.05 }}
                            className="flex items-center justify-center gap-2"
                          >
                            {getRankIcon(center.rank)}
                            <span
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-black ${
                                center.rank === 1 
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-500 shadow-lg shadow-yellow-500/50" 
                                  : center.rank === 2
                                  ? "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 border-gray-400"
                                  : center.rank === 3
                                  ? "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 border-orange-400"
                                  : "bg-slate-800 text-slate-300 border-slate-600"
                              }`}
                            >
                              {center.rank}
                            </span>
                          </motion.div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {center.rank === 1 && (
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                              >
                                <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                              </motion.div>
                            )}
                            <span className={`font-semibold ${center.rank === 1 ? "text-yellow-400" : "text-slate-100"}`}>
                              {center.center_name}
                            </span>
                            {!center.isActive && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                راكد
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-300">
                          {center.total_meetings}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-300">
                          {center.total_lectures}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-300">
                          {center.total_seminars}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-300">
                          {center.total_posters}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: center.rank * 0.05, type: "spring" }}
                            className="inline-flex items-center px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full font-black text-lg border border-emerald-500/30"
                          >
                            <AnimatedCounter value={center.score} duration={1.5} />
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {center.isActive ? (
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                              نشط
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                              راكد ({center.daysInactive === 999 ? "لم يبدأ" : `${center.daysInactive} يوم`})
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

