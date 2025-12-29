"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Report {
  id: string;
  health_center_name: string;
  month: string;
  year: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  submitted_by_name: string | null;
  approved_by_name: string | null;
}

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

export default function AdminReportsPage() {
  const { user, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "approved" | "rejected">("all");

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      // Load all reports
      let query = supabase
        .from("monthly_statistics")
        .select(`
          id,
          health_center_name,
          month,
          year,
          status,
          rejection_reason,
          approved_by,
          approved_at,
          created_at,
          updated_at,
          user_id
        `)
        .order("created_at", { ascending: false });

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: reportsData, error: reportsError } = await query;

      if (reportsError) {
        console.error("Error fetching reports:", reportsError);
        setError("حدث خطأ أثناء تحميل التقارير");
        setLoading(false);
        return;
      }

      // Load user names for submitted_by and approved_by
      const userIds = new Set<string>();
      reportsData?.forEach((report) => {
        userIds.add(report.user_id);
        if (report.approved_by) {
          userIds.add(report.approved_by);
        }
      });

      const userIdsArray = Array.from(userIds);
      if (userIdsArray.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIdsArray);

        const profilesMap = new Map(
          profilesData?.map((p) => [p.id, p.full_name]) || []
        );

        // Enrich reports with user names
        const enrichedReports: Report[] = (reportsData || []).map((report) => ({
          ...report,
          submitted_by_name: profilesMap.get(report.user_id) || null,
          approved_by_name: report.approved_by
            ? profilesMap.get(report.approved_by) || null
            : null,
        }));

        setReports(enrichedReports);
      } else {
        setReports(
          (reportsData || []).map((report) => ({
            ...report,
            submitted_by_name: null,
            approved_by_name: null,
          }))
        );
      }
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: string) => {
    if (!user) {
      setError("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      setApproving(reportId);
      setError("");
      setSuccessMessage("");

      const { error: updateError } = await supabase
        .from("monthly_statistics")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null, // Clear any previous rejection reason
        })
        .eq("id", reportId);

      if (updateError) {
        console.error("Error approving report:", updateError);
        setError("حدث خطأ أثناء الموافقة على التقرير");
        setApproving(null);
        return;
      }

      setSuccessMessage("تمت الموافقة على التقرير بنجاح");
      setApproving(null);
      await loadReports();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ غير متوقع");
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!selectedReportId || !user) {
      setError("يجب تحديد التقرير وتسجيل الدخول أولاً");
      return;
    }

    if (!rejectReason.trim()) {
      setError("يجب إدخال سبب الرفض");
      return;
    }

    try {
      setRejecting(selectedReportId);
      setError("");
      setSuccessMessage("");

      const { error: updateError } = await supabase
        .from("monthly_statistics")
        .update({
          status: "rejected",
          rejection_reason: rejectReason.trim(),
          approved_by: null,
          approved_at: null,
        })
        .eq("id", selectedReportId);

      if (updateError) {
        console.error("Error rejecting report:", updateError);
        setError("حدث خطأ أثناء رفض التقرير");
        setRejecting(null);
        return;
      }

      setSuccessMessage("تم رفض التقرير بنجاح");
      setRejecting(null);
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedReportId(null);
      await loadReports();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ غير متوقع");
      setRejecting(null);
    }
  };

  const openRejectModal = (reportId: string) => {
    setSelectedReportId(reportId);
    setRejectReason("");
    setShowRejectModal(true);
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

  const getMonthName = (monthNumber: string) => {
    const monthIndex = parseInt(monthNumber) - 1;
    return monthIndex >= 0 && monthIndex < arabicMonths.length
      ? arabicMonths[monthIndex]
      : monthNumber;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "مسودة", className: "bg-gray-100 text-gray-800" },
      submitted: { label: "قيد المراجعة", className: "bg-yellow-100 text-yellow-800" },
      approved: { label: "موافق عليه", className: "bg-green-100 text-green-800" },
      rejected: { label: "مرفوض", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filteredReports = reports.filter((report) => {
    if (statusFilter === "all") return true;
    return report.status === statusFilter;
  });

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
                لوحة مراجعة التقارير الشهرية
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Filter */}
            <div className="mb-6 flex gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700">تصفية حسب الحالة:</label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "submitted" | "approved" | "rejected"
                  )
                }
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">الكل</option>
                <option value="submitted">قيد المراجعة</option>
                <option value="approved">موافق عليه</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">جاري التحميل...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p className="text-lg">لا توجد تقارير</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        اسم المركز الصحي
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        الشهر / السنة
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        أرسل بواسطة
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        تاريخ الإرسال
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        الحالة
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        الإجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {report.health_center_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {getMonthName(report.month)} / {report.year}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {report.submitted_by_name || "غير معروف"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {formatDate(report.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(report.status)}
                          {report.status === "rejected" && report.rejection_reason && (
                            <div className="mt-1 text-xs text-red-600">
                              سبب: {report.rejection_reason}
                            </div>
                          )}
                          {report.status === "approved" && report.approved_at && (
                            <div className="mt-1 text-xs text-green-600">
                              اعتمد في: {formatDate(report.approved_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            {report.status === "submitted" && (
                              <>
                                <button
                                  onClick={() => handleApprove(report.id)}
                                  disabled={approving === report.id}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  {approving === report.id ? "..." : "✅ موافقة"}
                                </button>
                                <button
                                  onClick={() => openRejectModal(report.id)}
                                  disabled={rejecting === report.id}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  ❌ رفض
                                </button>
                              </>
                            )}
                            {report.status === "approved" && (
                              <span className="text-sm text-green-600 font-medium">
                                ✓ معتمد
                              </span>
                            )}
                            {report.status === "rejected" && (
                              <span className="text-sm text-red-600 font-medium">
                                ✗ مرفوض
                              </span>
                            )}
                            {report.status === "draft" && (
                              <span className="text-sm text-gray-500">مسودة</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">رفض التقرير</h3>
              <p className="text-sm text-gray-600 mb-4">
                يرجى إدخال سبب رفض التقرير:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب الرفض..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
                rows={4}
                dir="rtl"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setSelectedReportId(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || rejecting !== null}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {rejecting ? "جاري الرفض..." : "رفض"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

