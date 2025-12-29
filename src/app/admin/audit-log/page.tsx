"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: any;
  timestamp: string;
  user_name: string | null;
  health_center_name: string | null;
}

const actionLabels: { [key: string]: string } = {
  signup: "تسجيل مستخدم جديد",
  approved: "موافقة على مستخدم",
  rejected: "رفض مستخدم",
  login: "تسجيل دخول",
  report_submitted: "إرسال تقرير",
  report_approved: "اعتماد تقرير",
  report_rejected: "رفض تقرير",
  pdf_generated: "إنشاء PDF معتمد",
};

const arabicMonths = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
];

export default function AdminAuditLogPage() {
  const { user, signOut } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, monthFilter, yearFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1000); // Limit to last 1000 records

      // Apply action filter
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading audit logs:", error);
        setLoading(false);
        return;
      }

      // Get user IDs to fetch names
      const userIds = new Set<string>();
      data?.forEach((log) => {
        if (log.user_id) {
          userIds.add(log.user_id);
        }
      });

      // Fetch user profiles
      const userIdsArray = Array.from(userIds);
      let profilesMap = new Map<string, { full_name: string; health_center_name: string }>();

      if (userIdsArray.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, health_center_name")
          .in("id", userIdsArray);

        profilesMap = new Map(
          profilesData?.map((p) => [
            p.id,
            { full_name: p.full_name, health_center_name: p.health_center_name },
          ]) || []
        );
      }

      // Enrich audit logs with user names and filter by month/year
      const enrichedLogs: AuditLog[] = (data || [])
        .map((log) => {
          const profile = log.user_id ? profilesMap.get(log.user_id) : null;
          return {
            ...log,
            user_name: profile?.full_name || null,
            health_center_name:
              log.details?.health_center_name || profile?.health_center_name || null,
          };
        })
        .filter((log) => {
          // Filter by month/year if specified
          if (monthFilter !== "all" && log.details?.month) {
            const monthIndex = arabicMonths.indexOf(log.details.month);
            const monthNumber = String(monthIndex + 1).padStart(2, "0");
            if (monthNumber !== monthFilter) return false;
          }
          if (log.details?.year && log.details.year !== yearFilter) {
            return false;
          }
          return true;
        });

      setAuditLogs(enrichedLogs);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionLabel = (action: string): string => {
    return actionLabels[action] || action;
  };

  const getActionColor = (action: string): string => {
    const colors: { [key: string]: string } = {
      report_submitted: "bg-yellow-100 text-yellow-800",
      report_approved: "bg-green-100 text-green-800",
      report_rejected: "bg-red-100 text-red-800",
      pdf_generated: "bg-blue-100 text-blue-800",
      signup: "bg-gray-100 text-gray-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      login: "bg-blue-100 text-blue-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Filter by month/year if specified
      if (monthFilter !== "all" && log.details?.month) {
        const monthIndex = arabicMonths.indexOf(log.details.month);
        const monthNumber = String(monthIndex + 1).padStart(2, "0");
        if (monthNumber !== monthFilter) return false;
      }
      if (log.details?.year && log.details.year !== yearFilter) {
        return false;
      }
      return true;
    });
  }, [auditLogs, monthFilter, yearFilter]);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Official Header - Enhanced */}
        <div className="bg-white border-b-4 border-emerald-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">سجل التدقيق</h1>
                  <p className="text-sm text-gray-600">تتبع جميع الإجراءات الحساسة</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                تسجيل الخروج
              </button>
            </div>
            <div className="text-center border-t border-gray-200 pt-4">
              <div className="flex justify-center items-center mb-3">
                <img
                  src="/logo.png"
                  alt="شعار دائرة صحة كركوك"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                دائرة صحة كركوك
              </h2>
              <p className="text-base text-gray-700">قطاع كركوك الأول - وحدة تعزيز الصحة</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Filters Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                تصفية السجلات
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">نوع الإجراء</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                >
                  <option value="all">الكل</option>
                  <option value="report_submitted">إرسال تقرير</option>
                  <option value="report_approved">اعتماد تقرير</option>
                  <option value="report_rejected">رفض تقرير</option>
                  <option value="pdf_generated">إنشاء PDF</option>
                  <option value="signup">تسجيل مستخدم</option>
                  <option value="approved">موافقة على مستخدم</option>
                  <option value="rejected">رفض مستخدم</option>
                  <option value="login">تسجيل دخول</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">الشهر</label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                >
                  <option value="all">الكل</option>
                  {arabicMonths.map((month, index) => (
                    <option key={month} value={String(index + 1).padStart(2, "0")}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">السنة</label>
                <input
                  type="number"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                  min="2020"
                  max="2100"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setActionFilter("all");
                    setMonthFilter("all");
                    setYearFilter(new Date().getFullYear());
                  }}
                  className="px-4 py-2 w-full bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            {loading ? (
              <LoadingSpinner size="md" text="جاري التحميل..." />
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-medium">لا توجد سجلات تدقيق</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                      <th className="px-6 py-4 text-right text-sm font-bold">التاريخ والوقت</th>
                      <th className="px-6 py-4 text-right text-sm font-bold">المستخدم</th>
                      <th className="px-6 py-4 text-right text-sm font-bold">المركز الصحي</th>
                      <th className="px-6 py-4 text-right text-sm font-bold">الإجراء</th>
                      <th className="px-6 py-4 text-right text-sm font-bold">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <tr
                        key={log.id}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-emerald-50 transition-colors duration-150`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {log.user_name || "غير معروف"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.health_center_name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}
                          >
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {log.details ? (
                            <div className="text-xs text-gray-600 space-y-1">
                              {log.details.month && log.details.year && (
                                <div className="font-medium">
                                  {log.details.month} / {log.details.year}
                                </div>
                              )}
                              {log.details.rejection_reason && (
                                <div className="text-red-600 mt-1">
                                  <span className="font-semibold">سبب:</span> {log.details.rejection_reason}
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box - Enhanced */}
          <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-100 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">ملاحظة مهمة</p>
                <p className="text-sm text-blue-800">
                  هذا السجل للقراءة فقط. جميع الإجراءات الحساسة يتم تسجيلها تلقائياً
                  لضمان الشفافية والمساءلة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

