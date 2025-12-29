"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

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

  const filteredLogs = auditLogs;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <main className="min-h-screen bg-gray-50">
        {/* Official Header */}
        <div className="bg-white border-b-2 border-emerald-600 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                تسجيل الخروج
              </button>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                <img
                  src="/logo.png"
                  alt="شعار دائرة صحة كركوك"
                  className="h-20 w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                دائرة صحة كركوك
              </h2>
              <p className="text-lg text-gray-700 mb-1">قطاع كركوك الأول</p>
              <p className="text-base text-gray-600 mb-4">وحدة تعزيز الصحة</p>
              <h1 className="text-xl font-semibold text-emerald-700 border-t border-gray-200 pt-4">
                سجل التدقيق - تتبع الإجراءات
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-emerald-700">تصفية السجلات</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">نوع الإجراء</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-sm font-medium mb-2">الشهر</label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-sm font-medium mb-2">السنة</label>
                <input
                  type="number"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">جاري التحميل...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p className="text-lg">لا توجد سجلات تدقيق</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-emerald-600 text-white">
                      <th className="border border-gray-300 px-4 py-3 text-right">التاريخ والوقت</th>
                      <th className="border border-gray-300 px-4 py-3 text-right">المستخدم</th>
                      <th className="border border-gray-300 px-4 py-3 text-right">المركز الصحي</th>
                      <th className="border border-gray-300 px-4 py-3 text-right">الإجراء</th>
                      <th className="border border-gray-300 px-4 py-3 text-right">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {log.user_name || "غير معروف"}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {log.health_center_name || "-"}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                              log.action
                            )}`}
                          >
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {log.details ? (
                            <div className="text-xs text-gray-600">
                              {log.details.month && log.details.year && (
                                <div>
                                  {log.details.month} / {log.details.year}
                                </div>
                              )}
                              {log.details.rejection_reason && (
                                <div className="text-red-600 mt-1">
                                  سبب: {log.details.rejection_reason}
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

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> هذا السجل للقراءة فقط. جميع الإجراءات الحساسة يتم تسجيلها تلقائياً
              لضمان الشفافية والمساءلة.
            </p>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

