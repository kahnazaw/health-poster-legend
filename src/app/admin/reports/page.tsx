"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusTimeline from "@/components/StatusTimeline";
import SkeletonLoader from "@/components/SkeletonLoader";

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

      // Get report details for audit log
      const report = reports.find((r) => r.id === reportId);
      if (report) {
        await logAudit(user.id, "report_approved", {
          targetType: "monthly_statistics",
          targetId: reportId,
          details: {
            month: getMonthName(report.month),
            year: report.year,
            health_center_name: report.health_center_name,
          },
        });
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

      // Get report details for audit log
      const report = reports.find((r) => r.id === selectedReportId);
      if (report) {
        await logAudit(user.id, "report_rejected", {
          targetType: "monthly_statistics",
          targetId: selectedReportId,
          details: {
            month: getMonthName(report.month),
            year: report.year,
            health_center_name: report.health_center_name,
            rejection_reason: rejectReason.trim(),
          },
        });
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

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (statusFilter === "all") return true;
      return report.status === statusFilter;
    });
  }, [reports, statusFilter]);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-0">
        {/* Official Header - Enhanced */}
        <div className="bg-white border-b-4 border-emerald-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">لوحة مراجعة التقارير</h1>
                  <p className="text-sm text-gray-600">مراجعة واعتماد التقارير الشهرية</p>
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
          {/* Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-800 flex items-center gap-3 shadow-md">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800 flex items-center gap-3 shadow-md">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Filter Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                تصفية حسب الحالة:
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "submitted" | "approved" | "rejected"
                  )
                }
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              >
                <option value="all">الكل</option>
                <option value="submitted">قيد المراجعة</option>
                <option value="approved">موافق عليه</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
          </div>

          {/* Reports Table Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">

            {loading ? (
              <div className="space-y-4">
                <SkeletonLoader type="card" count={3} />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">لا توجد تقارير</p>
              </div>
            ) : (
              <>
                {/* Mobile: Card Layout */}
                <div className="block md:hidden space-y-4 pb-20">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-3 active:scale-[0.98] transition-transform duration-150"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            {report.health_center_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getMonthName(report.month)} / {report.year}
                          </p>
                        </div>
                        <StatusBadge status={report.status as "draft" | "submitted" | "approved" | "rejected"} size="sm" />
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">أرسل بواسطة:</span>
                          <span className="text-gray-800 font-medium">{report.submitted_by_name || "غير معروف"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">تاريخ الإرسال:</span>
                          <span className="text-gray-800 font-medium">{formatDate(report.created_at)}</span>
                        </div>
                      </div>

                      {report.status === "rejected" && report.rejection_reason && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs font-semibold text-red-800 mb-1">سبب الرفض:</p>
                          <p className="text-sm text-red-700">{report.rejection_reason}</p>
                        </div>
                      )}

                      {report.status === "approved" && report.approved_at && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs font-semibold text-green-800">
                            اعتمد في: {formatDate(report.approved_at)}
                          </p>
                        </div>
                      )}

                      {report.status === "submitted" && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleApprove(report.id)}
                            disabled={approving === report.id}
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 active:scale-95 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            {approving === report.id ? (
                              <>
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>جاري الموافقة...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>موافقة</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openRejectModal(report.id)}
                            disabled={rejecting === report.id}
                            className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-200 active:scale-95 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            {rejecting === report.id ? (
                              <>
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>جاري الرفض...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>رفض</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                      <th className="px-6 py-4 text-right text-sm font-bold">
                        اسم المركز الصحي
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold">
                        الشهر / السنة
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold">
                        أرسل بواسطة
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold">
                        تاريخ الإرسال
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold">
                        الحالة
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold">
                        الإجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report, index) => (
                      <tr
                        key={report.id}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-emerald-50 transition-colors duration-150`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {report.health_center_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {getMonthName(report.month)} / {report.year}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {report.submitted_by_name || "غير معروف"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(report.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <StatusBadge status={report.status as "draft" | "submitted" | "approved" | "rejected"} size="md" />
                            {report.status === "rejected" && report.rejection_reason && (
                              <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded border border-red-200">
                                <span className="font-semibold">سبب:</span> {report.rejection_reason}
                              </div>
                            )}
                            {report.status === "approved" && report.approved_at && (
                              <div className="text-xs text-green-600 mt-1">
                                <span className="font-semibold">اعتمد في:</span> {formatDate(report.approved_at)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            {report.status === "submitted" && (
                              <>
                                <button
                                  onClick={() => handleApprove(report.id)}
                                  disabled={approving === report.id}
                                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 active:scale-95 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg group relative"
                                  title="موافقة"
                                >
                                  {approving === report.id ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => openRejectModal(report.id)}
                                  disabled={rejecting === report.id}
                                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-200 active:scale-95 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg group relative"
                                  title="رفض"
                                >
                                  {rejecting === report.id ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </button>
                              </>
                            )}
                            {report.status === "approved" && (
                              <StatusBadge status="approved" size="md" />
                            )}
                            {report.status === "rejected" && (
                              <StatusBadge status="rejected" size="md" />
                            )}
                            {report.status === "draft" && (
                              <StatusBadge status="draft" size="md" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reject Modal - Enhanced */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl border-2 border-red-200 p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">رفض التقرير</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                يرجى إدخال سبب رفض التقرير:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب الرفض..."
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-red-200 focus:border-red-500 mb-6 transition-all"
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
                  className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || rejecting !== null}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {rejecting ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      جاري الرفض...
                    </span>
                  ) : (
                    "رفض"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

