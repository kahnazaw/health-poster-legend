"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { generateApprovedReportPDF } from "@/lib/pdfGenerator";
import { logAudit } from "@/lib/audit";

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
  healthCenterName: string;
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
      if (!user || !profile || !profile.health_center_name) {
        setLoadingReport(false);
        return;
      }

      try {
        const monthIndex = arabicMonths.indexOf(selectedMonth);
        const monthNumber = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, "0") : String(new Date().getMonth() + 1).padStart(2, "0");

        const { data, error } = await supabase
          .from("monthly_statistics")
          .select("id, status, rejection_reason, approved_at, approved_by, statistics_data")
          .eq("health_center_name", profile.health_center_name)
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

  // Security guard: Block page if health_center_name is missing
  if (!loading && (!user || !profile || !profile.health_center_name || profile.health_center_name.trim() === "")) {
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
    if (!user || !profile || !profile.health_center_name) {
      alert("يجب تسجيل الدخول وربط حسابك بمركز صحي أولاً");
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
        
        // Always use profile.health_center_name (ignore any form-based center value)
        const healthCenterName = profile.health_center_name;
        
        // Convert month name to number (1-12)
        const monthIndex = arabicMonths.indexOf(selectedMonth);
        const monthNumber = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, "0") : String(new Date().getMonth() + 1).padStart(2, "0");
        
        // Prepare statistics data
        const statisticsData = {
          healthCenterName,
          month: selectedMonth,
          year: currentYear,
          data: data,
        };

        // Save to database with user.id automatically attached
        // First, check if record exists for this health center, month, and year
        const { data: existingRecord } = await supabase
          .from("monthly_statistics")
          .select("id")
          .eq("health_center_name", healthCenterName)
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
              health_center_name: healthCenterName,
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
          .eq("health_center_name", healthCenterName)
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
              health_center_name: healthCenterName,
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
        healthCenterName: profile.health_center_name,
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
      <div className="p-6 max-w-4xl mx-auto dir-rtl" dir="rtl">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">إحصائيات المراكز الصحية</h1>
      
      {/* Report Status Display */}
      {!loadingReport && reportInfo && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          reportInfo.status === "approved" 
            ? "bg-green-50 border-green-300" 
            : reportInfo.status === "rejected"
            ? "bg-red-50 border-red-300"
            : reportInfo.status === "submitted"
            ? "bg-yellow-50 border-yellow-300"
            : "bg-gray-50 border-gray-300"
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-lg">
              {reportInfo.status === "approved" && "✓ تم اعتماد التقرير"}
              {reportInfo.status === "rejected" && "✗ تم رفض التقرير"}
              {reportInfo.status === "submitted" && "⏳ قيد المراجعة"}
              {reportInfo.status === "draft" && "📝 مسودة"}
            </span>
          </div>
          {reportInfo.status === "rejected" && reportInfo.rejection_reason && (
            <div className="mt-2 p-3 bg-white rounded border border-red-200">
              <p className="font-semibold text-red-800 mb-1">سبب الرفض:</p>
              <p className="text-red-700">{reportInfo.rejection_reason}</p>
            </div>
          )}
          {reportInfo.status === "approved" && reportInfo.approved_at && (
            <p className="text-sm text-gray-600 mt-2">
              تم الاعتماد في: {new Date(reportInfo.approved_at).toLocaleDateString("ar-IQ")}
            </p>
          )}
          {reportInfo.status === "approved" && (
            <div className="mt-4">
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md"
              >
                📄 تحميل PDF المعتمد
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* اسم المركز الصحي (قراءة فقط) */}
        <div>
          <label className="block mb-2 font-semibold">اسم المركز الصحي:</label>
          <input
            type="text"
            value={profile?.health_center_name || ""}
            disabled
            readOnly
            className="w-full p-2 border rounded bg-gray-50 cursor-not-allowed shadow-sm text-gray-700"
          />
        </div>

        {/* اختيار الشهر */}
        <div>
          <label className="block mb-2 font-semibold">الشهر:</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={reportInfo?.status === "approved"}
            className={`w-full p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 ${
              reportInfo?.status === "approved" ? "bg-gray-50 cursor-not-allowed" : ""
            }`}
          >
            {arabicMonths.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        {/* السنة */}
        <div>
          <label className="block mb-2 font-semibold">السنة:</label>
          <input 
            type="number" 
            readOnly 
            value={currentYear} 
            className="w-full p-2 border rounded bg-gray-50 cursor-not-allowed shadow-sm"
          />
        </div>
      </div>

      {/* قسم رفع الملفات */}
      <div className={`p-6 rounded-lg border-2 border-dashed text-center ${
        reportInfo?.status === "approved" 
          ? "bg-gray-50 border-gray-300 opacity-60" 
          : "bg-blue-50 border-blue-300"
      }`}>
        <label className={`block mb-4 font-bold ${
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
          className={`mx-auto block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
            reportInfo?.status === "approved"
              ? "file:bg-gray-400 file:text-white cursor-not-allowed opacity-50"
              : "file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          }`}
        />
      </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>مشروع إدارة إحصائيات المراكز الصحية - صحة كركوك</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}