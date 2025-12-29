"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { generateApprovedReportPDF } from "@/lib/pdfGenerator";
import { logAudit } from "@/lib/audit";
import StatusBadge from "@/components/StatusBadge";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import SectionCard from "@/components/layout/SectionCard";

/* =========================
   Constants
========================= */

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


/* =========================
   Types
========================= */

type TopicStats = {
  individualSessions: number;
  lectures: number;
  seminars: number;
};

type CategoryStats = {
  [topic: string]: TopicStats;
};

type MonthlyStatistics = {
  month: string;
  year: number;
  categories: {
    communicableDiseases: CategoryStats;
    nonCommunicableDiseases: CategoryStats;
  };
};

/* =========================
   Component
========================= */

type ReportStatus = "draft" | "submitted" | "approved" | "rejected";

interface ReportInfo {
  status: ReportStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;
  report_id: string | null;
  statistics_data: any;
}

export default function StatisticsPage() {
  const { user, profile, loading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(arabicMonths[0]);
  const [currentYear] = useState(new Date().getFullYear());
  const [reportInfo, setReportInfo] = useState<ReportInfo | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing report status
  useEffect(() => {
    const loadReportStatus = async () => {
      if (!user || !profile) {
        setLoadingReport(false);
        return;
      }

      try {
        const monthIndex = arabicMonths.indexOf(selectedMonth);
        const monthNumber = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, "0") : String(new Date().getMonth() + 1).padStart(2, "0");

        const { data, error } = await supabase
          .from("monthly_statistics")
          .select("id, status, rejection_reason, approved_at, approved_by, statistics_data")
          .eq("month", monthNumber)
          .eq("year", currentYear)
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
          console.error("Error loading report status:", error);
        } else if (data) {
          // Load approved_by name if exists
          let approvedByName = null;
          if (data.approved_by) {
            const { data: approverProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", data.approved_by)
              .single();
            approvedByName = approverProfile?.full_name || null;
          }

          setReportInfo({
            status: data.status as ReportStatus,
            rejection_reason: data.rejection_reason,
            approved_at: data.approved_at,
            approved_by: data.approved_by,
            report_id: data.id,
            statistics_data: data.statistics_data,
          });
        } else {
          setReportInfo({
            status: "draft",
            rejection_reason: null,
            approved_at: null,
            approved_by: null,
            report_id: null,
            statistics_data: null,
          });
        }
      } catch (error) {
        console.error("Error loading report status:", error);
        setReportInfo({
          status: "draft",
          rejection_reason: null,
          approved_at: null,
          approved_by: null,
          report_id: null,
          statistics_data: null,
        });
      } finally {
        setLoadingReport(false);
      }
    };

    if (!loading) {
      loadReportStatus();
    }
  }, [user, profile, selectedMonth, currentYear, loading]);

  // Security guard: Block page if user/profile is missing (health_center_name is now optional)
  if (!loading && (!user || !profile)) {
    return (
      <ProtectedRoute allowedRoles={["center_user"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">خطأ في الربط</h2>
              <p className="text-gray-700">
                لم يتم ربط حسابك بمركز صحي. يرجى مراجعة إدارة القطاع.
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // دالة التعامل مع رفع ملف الإكسل
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prevent submission if user is not authenticated
    if (!user || !profile) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }

    // Prevent editing if report is approved
    if (reportInfo?.status === "approved") {
      alert("لا يمكن تعديل التقرير بعد الموافقة عليه.");
      e.target.value = ""; // Reset file input
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        console.log("Data from Excel:", data);
        
        // Convert month name to number (1-12)
        const monthIndex = arabicMonths.indexOf(selectedMonth);
        const monthNumber = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, "0") : String(new Date().getMonth() + 1).padStart(2, "0");
        
        // Prepare statistics data
        const statisticsData = {
          month: selectedMonth,
          year: currentYear,
          data: data,
        };

        // Save to database with user.id automatically attached
        // First, check if record exists for this user, month, and year
        const { data: existingRecord } = await supabase
          .from("monthly_statistics")
          .select("id")
          .eq("month", monthNumber)
          .eq("year", currentYear)
          .eq("user_id", user.id)
          .single();

        // Determine status: if draft or rejected, allow editing; on submit, set to submitted
        const newStatus = reportInfo?.status === "draft" || reportInfo?.status === "rejected" 
          ? "submitted" 
          : "submitted";

        if (existingRecord) {
          // Update existing record - only if draft or rejected
          if (reportInfo?.status !== "draft" && reportInfo?.status !== "rejected") {
            alert("لا يمكن تعديل التقرير في حالته الحالية.");
            return;
          }

          const { error } = await supabase
            .from("monthly_statistics")
            .update({
              statistics_data: statisticsData,
              status: newStatus,
              updated_at: new Date().toISOString(),
              // Clear rejection reason when resubmitting
              rejection_reason: null,
            })
            .eq("id", existingRecord.id);

          if (error) {
            console.error("Error updating statistics:", error);
            alert("حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.");
            return;
          }
        } else {
          // Insert new record with status = "submitted"
          const { error } = await supabase
            .from("monthly_statistics")
            .insert({
              user_id: user.id,
              month: monthNumber,
              year: currentYear,
              statistics_data: statisticsData,
              status: "submitted",
            });

          if (error) {
            console.error("Error saving statistics:", error);
            alert("حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.");
            return;
          }
        }

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Reload report status (reuse monthNumber from above)
        const { data: updatedData } = await supabase
          .from("monthly_statistics")
          .select("id, status, rejection_reason, approved_at, approved_by, statistics_data")
          .eq("month", monthNumber)
          .eq("year", currentYear)
          .eq("user_id", user.id)
          .single();

        if (updatedData) {
          setReportInfo({
            status: updatedData.status as ReportStatus,
            rejection_reason: updatedData.rejection_reason,
            approved_at: updatedData.approved_at,
            approved_by: updatedData.approved_by,
            report_id: updatedData.id,
            statistics_data: updatedData.statistics_data,
          });

          // Log audit event for report submission
          await logAudit(user.id, "report_submitted", {
            targetType: "monthly_statistics",
            targetId: updatedData.id,
            details: {
              month: selectedMonth,
              year: currentYear,
            },
          });
        }

        alert("تم إرسال التقرير بنجاح! سيتم مراجعته من قبل إدارة القطاع.");
      } catch (error) {
        console.error("Error processing file:", error);
        alert("حدث خطأ أثناء معالجة الملف. يرجى التأكد من صحة تنسيق الملف.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadPDF = async () => {
    if (!reportInfo || !profile || !user || reportInfo.status !== "approved") {
      alert("التقرير غير معتمد بعد");
      return;
    }

    try {
      // Load approved_by name if not already loaded
      let approvedByName = null;
      if (reportInfo.approved_by) {
        const { data: approverProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", reportInfo.approved_by)
          .single();
        approvedByName = approverProfile?.full_name || null;
      }

      await generateApprovedReportPDF({
        healthCenterName: profile?.health_center_name || "",
        month: selectedMonth,
        year: currentYear,
        statisticsData: reportInfo.statistics_data,
        approvedAt: reportInfo.approved_at,
        approvedByName: approvedByName,
        userId: user.id,
        reportId: reportInfo.report_id,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["center_user"]}>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-8">
        <PageHeader
          title="إحصائيات المراكز الصحية"
          subtitle="نظام إدارة وتتبع الإحصائيات الشهرية"
        />
        <PageContainer maxWidth="md" className="dir-rtl" dir="rtl">
      
          {/* Report Status Display - Enhanced */}
          {!loadingReport && reportInfo && (
            <SectionCard className={`mb-4 md:mb-6 border-l-4 ${
              reportInfo.status === "approved" 
                ? "border-l-green-500 bg-green-50" 
                : reportInfo.status === "rejected"
                ? "border-l-red-500 bg-red-50"
                : reportInfo.status === "submitted"
                ? "border-l-yellow-500 bg-yellow-50"
                : "border-l-gray-400 bg-gray-50"
            }`}>
              <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                <StatusBadge status={reportInfo.status} size="lg" />
                <div className="flex-1">
                  <p className="font-bold text-base md:text-lg mb-1">
                    {reportInfo.status === "approved" && "تم اعتماد التقرير"}
                    {reportInfo.status === "rejected" && "تم رفض التقرير"}
                    {reportInfo.status === "submitted" && "قيد المراجعة"}
                    {reportInfo.status === "draft" && "مسودة"}
                  </p>
                  {reportInfo.status === "approved" && reportInfo.approved_at && (
                    <p className="text-sm text-gray-600">
                      تم الاعتماد في: {new Date(reportInfo.approved_at).toLocaleDateString("ar-IQ")}
                    </p>
                  )}
                </div>
              </div>
              {reportInfo.status === "rejected" && reportInfo.rejection_reason && (
                <div className="mt-3 md:mt-4 p-3 md:p-4 bg-white rounded-lg border-l-4 border-red-500">
                  <p className="font-semibold text-red-800 mb-1 md:mb-2 flex items-center gap-2 text-sm md:text-base">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    سبب الرفض:
                  </p>
                  <p className="text-xs md:text-sm text-red-700 leading-relaxed">{reportInfo.rejection_reason}</p>
                </div>
              )}
              {reportInfo.status === "approved" && (
                <div className="mt-3 md:mt-4">
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 md:px-6 py-2.5 min-h-[44px] bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 text-sm md:text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    تحميل PDF المعتمد
                  </button>
                </div>
              )}
            </SectionCard>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                معلومات التقرير
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* اختيار الشهر */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  الشهر
                </label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={reportInfo?.status === "approved"}
                  className={`w-full p-3 border-2 rounded-lg shadow-sm focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all ${
                    reportInfo?.status === "approved" 
                      ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500" 
                      : "border-gray-300 hover:border-emerald-400"
                  }`}
                >
                  {arabicMonths.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              {/* السنة */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  السنة
                </label>
                <input 
                  type="number" 
                  readOnly 
                  value={currentYear} 
                  className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-gray-700 font-medium"
                />
              </div>
            </div>
          </div>

          {/* File Upload Card */}
          <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 border-2 border-dashed transition-all ${
            reportInfo?.status === "approved" 
              ? "bg-gray-50 border-gray-300 opacity-60" 
              : "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-300 hover:border-emerald-400"
          }`}>
            <div className="text-center">
              <div className="mb-4">
                <div className={`inline-flex p-4 rounded-full ${
                  reportInfo?.status === "approved" 
                    ? "bg-gray-200" 
                    : "bg-blue-100"
                }`}>
                  <svg className={`w-8 h-8 ${
                    reportInfo?.status === "approved" 
                      ? "text-gray-400" 
                      : "text-blue-600"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              <label className={`block mb-4 font-bold text-lg ${
                reportInfo?.status === "approved" ? "text-gray-500" : "text-blue-700"
              }`}>
                {reportInfo?.status === "approved" 
                  ? "تم اعتماد التقرير - لا يمكن التعديل" 
                  : "ارفع ملف الإحصائيات (Excel)"}
              </label>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload}
                disabled={reportInfo?.status === "approved"}
                className={`mx-auto block text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:transition-all ${
                  reportInfo?.status === "approved"
                    ? "file:bg-gray-400 file:text-white cursor-not-allowed opacity-50"
                    : "file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:shadow-md hover:file:shadow-lg cursor-pointer"
                }`}
              />
              {reportInfo?.status !== "approved" && (
                <p className="mt-3 text-sm text-gray-600">
                  يرجى رفع ملف Excel يحتوي على البيانات الإحصائية
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              مشروع إدارة إحصائيات المراكز الصحية - صحة كركوك
            </p>
          </div>
        </PageContainer>
      </main>
    </ProtectedRoute>
  );
}