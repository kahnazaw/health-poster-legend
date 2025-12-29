"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

// Arabic month names (Iraqi traditional)
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
  "كانون الأول"
];

// Health centers list - same as statistics page
const healthCenters = [
  "مركز صحي الحويجة",
  "مركز صحي الرشيد",
  "مركز صحي الشورجة",
  "مركز صحي العباسية",
  "مركز صحي الكرامة",
  "مركز صحي المأمون",
  "مركز صحي النصر",
  "مركز صحي الهاشمية",
  "مركز صحي الوحدة",
  "مركز صحي الحرية",
  "مركز صحي الشهداء",
  "مركز صحي السلام",
  "مركز صحي الجهاد",
  "مركز صحي الفردوس",
  "مركز صحي الزهراء",
  "مركز صحي الإخاء",
  "مركز صحي التضامن",
  "مركز صحي الأمل",
  "مركز صحي الفتح",
  "مركز صحي النهضة",
];

interface SubmissionStatus {
  centerName: string;
  submitted: boolean;
  submittedAt?: string;
  status?: "draft" | "submitted" | "approved" | "rejected";
  totals?: {
    individualSessions: number;
    lectures: number;
    seminars: number;
  };
}

const getReportKey = (healthCenterName: string, month: string, year: number): string => {
  return `health_report_${healthCenterName}_${year}_${month}`;
};

const parseReportKey = (key: string): { centerName: string; year: number; month: string } | null => {
  const prefix = "health_report_";
  if (!key.startsWith(prefix)) return null;
  
  const parts = key.substring(prefix.length).split("_");
  if (parts.length < 3) return null;
  
  const year = parseInt(parts[parts.length - 2]);
  const month = parts[parts.length - 1];
  const centerName = parts.slice(0, -2).join("_");
  
  if (isNaN(year) || !month) return null;
  
  return { centerName, year, month };
};

const getFullReportData = async (centerName: string, month: string, year: number): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("monthly_statistics")
      .select("statistics_data, created_at")
      .eq("health_center_name", centerName)
      .eq("month", month)
      .eq("year", year)
      .single();

    if (error || !data) {
      // Fallback to localStorage
      if (typeof window !== "undefined") {
        const dataKey = `health_report_data_${centerName}_${year}_${month}`;
        const localData = localStorage.getItem(dataKey);
        if (localData) {
          try {
            return JSON.parse(localData);
          } catch {
            return null;
          }
        }
      }
      return null;
    }

    return data.statistics_data;
  } catch {
    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const dataKey = `health_report_data_${centerName}_${year}_${month}`;
      const localData = localStorage.getItem(dataKey);
      if (localData) {
        try {
          return JSON.parse(localData);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
};

const calculateTotals = (reportData: any): { individualSessions: number; lectures: number; seminars: number } => {
  if (!reportData || !reportData.categories) {
    return { individualSessions: 0, lectures: 0, seminars: 0 };
  }

  let totals = { individualSessions: 0, lectures: 0, seminars: 0 };
  
  Object.values(reportData.categories).forEach((category: any) => {
    Object.values(category).forEach((topic: any) => {
      if (topic && typeof topic === "object") {
        totals.individualSessions += topic.individualSessions || 0;
        totals.lectures += topic.lectures || 0;
        totals.seminars += topic.seminars || 0;
      }
    });
  });

  return totals;
};

export default function SectorDashboardPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(currentDate.getMonth() + 1).padStart(2, "0")
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [submissions, setSubmissions] = useState<SubmissionStatus[]>([]);
  const [categoryActivity, setCategoryActivity] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadSubmissions();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    calculateCategoryActivity();
  }, [submissions, selectedMonth, selectedYear]);

  const loadSubmissions = async () => {
    if (typeof window === "undefined") return;

    try {
      // Load from database
      const { data: dbData, error } = await supabase
        .from("monthly_statistics")
        .select("health_center_name, created_at, statistics_data, status")
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      const dbSubmissions = new Map();
      if (!error && dbData) {
        dbData.forEach((record) => {
          dbSubmissions.set(record.health_center_name, {
            submitted: true,
            submittedAt: record.created_at,
            status: record.status || "submitted",
            totals: calculateTotals(record.statistics_data),
          });
        });
      }

      // Build statuses for all centers
      const statuses: SubmissionStatus[] = await Promise.all(
        healthCenters.map(async (center) => {
          const dbRecord = dbSubmissions.get(center);
          
          if (dbRecord) {
            return {
              centerName: center,
              submitted: true,
              submittedAt: dbRecord.submittedAt,
              status: dbRecord.status as "draft" | "submitted" | "approved" | "rejected" | undefined,
              totals: dbRecord.totals,
            };
          }

          // Fallback to localStorage check
          const key = getReportKey(center, selectedMonth, selectedYear);
          const submissionData = localStorage.getItem(key);
          
          if (submissionData) {
            try {
              const parsed = JSON.parse(submissionData);
              const fullData = await getFullReportData(center, selectedMonth, selectedYear);
              return {
                centerName: center,
                submitted: true,
                submittedAt: parsed.submittedAt,
                totals: fullData ? calculateTotals(fullData) : { individualSessions: 0, lectures: 0, seminars: 0 },
              };
            } catch {
              return {
                centerName: center,
                submitted: false,
                totals: { individualSessions: 0, lectures: 0, seminars: 0 },
              };
            }
          }

          return {
            centerName: center,
            submitted: false,
            totals: { individualSessions: 0, lectures: 0, seminars: 0 },
          };
        })
      );

      setSubmissions(statuses);
    } catch (err) {
      console.error("Error loading submissions:", err);
      // Fallback to localStorage only
      const statuses: SubmissionStatus[] = healthCenters.map((center) => {
        const key = getReportKey(center, selectedMonth, selectedYear);
        const submissionData = localStorage.getItem(key);
        
        let submitted = false;
        let submittedAt: string | undefined;
        let totals = { individualSessions: 0, lectures: 0, seminars: 0 };

        if (submissionData) {
          try {
            const parsed = JSON.parse(submissionData);
            submitted = true;
            submittedAt = parsed.submittedAt;
          } catch {
            submitted = false;
          }
        }

        return {
          centerName: center,
          submitted,
          submittedAt,
          totals,
        };
      });

      setSubmissions(statuses);
    }
  };

  const handleExportToExcel = () => {
    const excelData: Array<{
      "اسم المركز الصحي": string;
      "الحالة": string;
      "تاريخ ووقت الإرسال": string;
      "مجموع الجلسات الفردية": number;
      "مجموع المحاضرات": number;
      "مجموع الندوات": number;
    }> = [];

    submissions.forEach((submission) => {
      excelData.push({
        "اسم المركز الصحي": submission.centerName,
        "الحالة": (() => {
          const status = submission.status || (submission.submitted ? "submitted" : "draft");
          const statusLabels = {
            draft: "مسودة",
            submitted: "قيد المراجعة",
            approved: "معتمد",
            rejected: "مرفوض",
          };
          return statusLabels[status as keyof typeof statusLabels] || "غير معروف";
        })(),
        "تاريخ ووقت الإرسال": submission.submittedAt
          ? formatDate(submission.submittedAt)
          : "غير متوفر",
        "مجموع الجلسات الفردية": submission.totals?.individualSessions || 0,
        "مجموع المحاضرات": submission.totals?.lectures || 0,
        "مجموع الندوات": submission.totals?.seminars || 0,
      });
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "لوحة القطاع");

    // Add official header rows
    const monthName = arabicMonths[parseInt(selectedMonth) - 1] || selectedMonth;
    
    // Insert header rows at the beginning
    XLSX.utils.sheet_add_aoa(worksheet, [
      ["دائرة صحة كركوك"],
      ["قطاع كركوك الأول – وحدة تعزيز الصحة"],
      [`لوحة متابعة إحصائيات المراكز الصحية - ${monthName} ${selectedYear}`],
      [""], // Empty row
    ], { origin: "A1" });

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // اسم المركز الصحي
      { wch: 15 }, // حالة الإرسال
      { wch: 25 }, // تاريخ ووقت الإرسال
      { wch: 20 }, // مجموع الجلسات الفردية
      { wch: 18 }, // مجموع المحاضرات
      { wch: 18 }, // مجموع الندوات
    ];
    worksheet["!cols"] = columnWidths;

    // Merge header cells for better appearance
    if (!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Row 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Row 2
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }  // Row 3
    );

    // Generate Excel file and download
    const fileName = `لوحة_القطاع_${selectedYear}_${monthName}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const monthIndex = date.getMonth();
      const arabicMonth = arabicMonths[monthIndex] || "";
      const day = date.getDate();
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day} ${arabicMonth} ${year}، ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  // Statistics are now calculated above with approval status

  // Calculate center activity rankings - Memoized
  const { centerActivity, topPerformers, bottomPerformers } = useMemo(() => {
    const activity = submissions
      .map((submission) => {
        const totalActivity =
          (submission.totals?.individualSessions || 0) +
          (submission.totals?.lectures || 0) +
          (submission.totals?.seminars || 0);
        return {
          centerName: submission.centerName,
          totalActivity,
          individualSessions: submission.totals?.individualSessions || 0,
          lectures: submission.totals?.lectures || 0,
          seminars: submission.totals?.seminars || 0,
          submitted: submission.submitted,
        };
      })
      .sort((a, b) => b.totalActivity - a.totalActivity);

    const top = activity.filter((c) => c.submitted).slice(0, 5);
    const bottom = activity.filter((c) => c.submitted).slice(-5).reverse();

    return { centerActivity: activity, topPerformers: top, bottomPerformers: bottom };
  }, [submissions]);

  // Calculate category activity analysis
  const categoryNames: { [key: string]: string } = {
    communicableDiseases: "الوقاية من الأمراض المعدية",
    nonCommunicableDiseases: "الوقاية من الأمراض غير المعدية",
    maternalChildHealth: "صحة الأم والطفل",
    nutrition: "التثقيف الغذائي",
    environmentalHealth: "الصحة البيئية",
    schoolHealth: "برامج الصحة المدرسية",
    mentalHealth: "تعزيز الصحة النفسية",
    familyPlanning: "تنظيم الأسرة",
    immunization: "التطعيم",
    healthEducation: "حملات التثقيف الصحي",
  };

  const calculateCategoryActivity = async () => {
    const activity: { [key: string]: number } = {};

    for (const submission of submissions) {
      if (submission.submitted) {
        const fullData = await getFullReportData(
          submission.centerName,
          selectedMonth,
          selectedYear
        );
        if (fullData && fullData.categories) {
          Object.entries(fullData.categories).forEach(([categoryKey, category]: [string, any]) => {
            if (!activity[categoryKey]) {
              activity[categoryKey] = 0;
            }
            Object.values(category).forEach((topic: any) => {
              if (topic && typeof topic === "object") {
                activity[categoryKey] +=
                  (topic.individualSessions || 0) +
                  (topic.lectures || 0) +
                  (topic.seminars || 0);
              }
            });
          });
        }
      }
    }

    setCategoryActivity(activity);
  };

  const { categoryData, totalActivity } = useMemo(() => {
    const data = Object.entries(categoryActivity)
      .map(([key, value]) => ({
        name: categoryNames[key] || key,
        value,
      }))
      .sort((a, b) => b.value - a.value);
    const total = centerActivity.reduce((sum, c) => sum + c.totalActivity, 0);
    return { categoryData: data, totalActivity: total };
  }, [categoryActivity, centerActivity]);

  // Calculate approval statistics - Memoized
  const { totalCenters, submittedCount, approvedCount, rejectedCount, pendingCount, completionPercentage } = useMemo(() => {
    const total = healthCenters.length;
    const submitted = submissions.filter(s => s.submitted && s.status !== "draft").length;
    const approved = submissions.filter(s => s.status === "approved").length;
    const rejected = submissions.filter(s => s.status === "rejected").length;
    const pending = submissions.filter(s => s.status === "submitted").length;
    const percentage = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { totalCenters: total, submittedCount: submitted, approvedCount: approved, rejectedCount: rejected, pendingCount: pending, completionPercentage: percentage };
  }, [submissions]);

  const COLORS = [
    "#059669",
    "#10b981",
    "#34d399",
    "#6ee7b7",
    "#a7f3d0",
    "#d1fae5",
    "#ecfdf5",
    "#f0fdf4",
    "#f9fafb",
    "#f3f4f6",
  ];

  const currentYear = new Date().getFullYear();
  const { profile, signOut } = useAuth();

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">لوحة متابعة الإحصائيات</h1>
                <p className="text-sm text-gray-600">مراقبة وتتبع التقارير الشهرية</p>
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
            <p className="text-base text-gray-700">
              قطاع كركوك الأول - وحدة تعزيز الصحة
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Filters and Export Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                الشهر
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = String(i + 1).padStart(2, "0");
                  return (
                    <option key={monthNum} value={monthNum}>
                      {arabicMonths[i]}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                السنة
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || currentDate.getFullYear())}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                min="2020"
                max="2100"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExportToExcel}
                className="px-6 py-2.5 w-full bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تصدير Excel شامل
              </button>
            </div>
            <div className="flex items-end">
              <div className="w-full text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200">
                <div className="text-xs text-gray-600 mb-1 font-medium">نسبة الإكمال</div>
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {completionPercentage}%
                </div>
                <div className="text-xs text-gray-500">
                  {approvedCount} / {totalCenters} مركز
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Indicators with Approval Status - Enhanced */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              مؤشرات الحالة والموافقة
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-xs text-gray-600 mb-2 font-medium uppercase">إجمالي المراكز</div>
              <div className="text-4xl font-bold text-blue-600">{totalCenters}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border-2 border-yellow-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-xs text-gray-600 mb-2 font-medium uppercase">قيد المراجعة</div>
              <div className="text-4xl font-bold text-yellow-600">{pendingCount}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-xs text-gray-600 mb-2 font-medium uppercase">معتمد</div>
              <div className="text-4xl font-bold text-green-600">{approvedCount}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border-2 border-red-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-xs text-gray-600 mb-2 font-medium uppercase">مرفوض</div>
              <div className="text-4xl font-bold text-red-600">{rejectedCount}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-xs text-gray-600 mb-2 font-medium uppercase">لم يرسل</div>
              <div className="text-4xl font-bold text-gray-600">{totalCenters - submittedCount}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border-2 border-emerald-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-xs text-gray-600 mb-2 font-medium uppercase">نسبة الإكمال</div>
              <div className="text-4xl font-bold text-emerald-600">{completionPercentage}%</div>
            </div>
          </div>
        </div>

        {/* Center Activity Ranking - Enhanced */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              ترتيب نشاط المراكز
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                أعلى 5 مراكز أداء
              </h3>
              {topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {topPerformers.map((center, index) => (
                    <div
                      key={center.centerName}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-full font-bold shadow-md">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-800">{center.centerName}</span>
                      </div>
                      <span className="font-bold text-green-600 text-lg">{center.totalActivity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>لا توجد بيانات</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                أقل 5 مراكز أداء
              </h3>
              {bottomPerformers.length > 0 ? (
                <div className="space-y-3">
                  {bottomPerformers.map((center, index) => (
                    <div
                      key={center.centerName}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 text-white rounded-full font-bold shadow-md">
                          {bottomPerformers.length - index}
                        </span>
                        <span className="font-semibold text-gray-800">{center.centerName}</span>
                      </div>
                      <span className="font-bold text-red-600 text-lg">{center.totalActivity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>لا توجد بيانات</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Activity Analysis - Enhanced */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              تحليل نشاط الفئات
            </h2>
          </div>
          {categoryData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">إجمالي النشاط حسب الفئة</h3>
                <div className="space-y-2">
                  {categoryData.map((category, index) => {
                    const percentage = totalActivity > 0 
                      ? Math.round((category.value / totalActivity) * 100) 
                      : 0;
                    return (
                      <div key={category.name} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm font-bold text-emerald-600">
                            {category.value} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">رسم بياني</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد بيانات للتحليل</p>
          )}
        </div>

        {/* Dashboard Table - Enhanced */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                  <th className="px-6 py-4 text-right text-sm font-bold">
                    اسم المركز الصحي
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold">الحالة</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">تاريخ ووقت الإرسال</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">مجموع الجلسات الفردية</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">مجموع المحاضرات</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">مجموع الندوات</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="font-medium">لا توجد بيانات متاحة</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission, index) => (
                    <tr key={index} className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-emerald-50 transition-colors duration-150`}>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {submission.centerName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge 
                          status={(submission.status || (submission.submitted ? "submitted" : "draft")) as "draft" | "submitted" | "approved" | "rejected"} 
                          size="md" 
                        />
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {submission.submittedAt ? formatDate(submission.submittedAt) : "-"}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-700">
                        {submission.totals?.individualSessions || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-700">
                        {submission.totals?.lectures || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-700">
                        {submission.totals?.seminars || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <footer className="bg-white border-t-2 border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-700 mb-2">
            هذه البيانات أُعدّت وفق النموذج المعتمد من وزارة الصحة العراقية
          </p>
          <p className="text-xs text-gray-500 mb-1">
            للاستخدام الرسمي فقط
          </p>
          <p className="text-xs text-gray-400">
            © {currentYear} دائرة صحة كركوك
          </p>
        </div>
      </footer>
    </main>
    </ProtectedRoute>
  );
}

