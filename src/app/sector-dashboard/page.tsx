"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

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
        .select("health_center_name, created_at, statistics_data")
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      const dbSubmissions = new Map();
      if (!error && dbData) {
        dbData.forEach((record) => {
          dbSubmissions.set(record.health_center_name, {
            submitted: true,
            submittedAt: record.created_at,
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
      "حالة الإرسال": string;
      "تاريخ ووقت الإرسال": string;
      "مجموع الجلسات الفردية": number;
      "مجموع المحاضرات": number;
      "مجموع الندوات": number;
    }> = [];

    submissions.forEach((submission) => {
      excelData.push({
        "اسم المركز الصحي": submission.centerName,
        "حالة الإرسال": submission.submitted ? "تم الإرسال" : "لم يتم الإرسال",
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

  const submittedCount = submissions.filter((s) => s.submitted).length;
  const totalCenters = submissions.length;
  const notSubmittedCount = totalCenters - submittedCount;
  const submissionRate = totalCenters > 0 ? Math.round((submittedCount / totalCenters) * 100) : 0;

  // Calculate center activity rankings
  const centerActivity = submissions
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

  const topPerformers = centerActivity.filter((c) => c.submitted).slice(0, 5);
  const bottomPerformers = centerActivity
    .filter((c) => c.submitted)
    .slice(-5)
    .reverse();

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

  const categoryData = Object.entries(categoryActivity)
    .map(([key, value]) => ({
      name: categoryNames[key] || key,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const totalActivity = centerActivity.reduce((sum, c) => sum + c.totalActivity, 0);

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
            <p className="text-lg text-gray-700 mb-1">
              قطاع كركوك الأول
            </p>
            <p className="text-base text-gray-600 mb-4">
              وحدة تعزيز الصحة
            </p>
            <h1 className="text-xl font-semibold text-emerald-700 border-t border-gray-200 pt-4">
              لوحة متابعة إحصائيات المراكز الصحية
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">

        {/* Filters and Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">الشهر</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              <label className="block text-sm font-medium mb-2">السنة</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || currentDate.getFullYear())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="2020"
                max="2100"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExportToExcel}
                className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                تصدير Excel شامل
              </button>
            </div>
            <div className="flex items-end">
              <div className="w-full text-center p-3 bg-gray-100 rounded-lg">
                <div className="text-sm text-gray-600">نسبة الإرسال</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {submissionRate}%
                </div>
                <div className="text-xs text-gray-500">
                  {submittedCount} / {totalCenters}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Indicators */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-emerald-700">مؤشرات ملخصة</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">إجمالي المراكز الصحية</div>
              <div className="text-3xl font-bold text-blue-600">{totalCenters}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 mb-1">المراكز التي أرسلت</div>
              <div className="text-3xl font-bold text-green-600">{submittedCount}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-gray-600 mb-1">المراكز التي لم ترسل</div>
              <div className="text-3xl font-bold text-red-600">{notSubmittedCount}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <div className="text-sm text-gray-600 mb-1">نسبة الإرسال</div>
              <div className="text-3xl font-bold text-emerald-600">{submissionRate}%</div>
            </div>
          </div>
        </div>

        {/* Center Activity Ranking */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-emerald-700">ترتيب نشاط المراكز</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">أعلى 5 مراكز أداء</h3>
              {topPerformers.length > 0 ? (
                <div className="space-y-2">
                  {topPerformers.map((center, index) => (
                    <div
                      key={center.centerName}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{center.centerName}</span>
                      </div>
                      <span className="font-bold text-green-600">{center.totalActivity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-700">أقل 5 مراكز أداء</h3>
              {bottomPerformers.length > 0 ? (
                <div className="space-y-2">
                  {bottomPerformers.map((center, index) => (
                    <div
                      key={center.centerName}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full font-bold">
                          {bottomPerformers.length - index}
                        </span>
                        <span className="font-medium">{center.centerName}</span>
                      </div>
                      <span className="font-bold text-red-600">{center.totalActivity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>
        </div>

        {/* Category Activity Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-emerald-700">تحليل نشاط الفئات</h2>
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

        {/* Dashboard Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-emerald-600 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-right">
                    اسم المركز الصحي
                  </th>
                  <th className="border border-gray-300 px-4 py-3">حالة الإرسال</th>
                  <th className="border border-gray-300 px-4 py-3">تاريخ ووقت الإرسال</th>
                  <th className="border border-gray-300 px-4 py-3">مجموع الجلسات الفردية</th>
                  <th className="border border-gray-300 px-4 py-3">مجموع المحاضرات</th>
                  <th className="border border-gray-300 px-4 py-3">مجموع الندوات</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      لا توجد بيانات متاحة
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        {submission.centerName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {submission.submitted ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            تم الإرسال
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            لم يتم الإرسال
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                        {submission.submittedAt ? formatDate(submission.submittedAt) : "-"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {submission.totals?.individualSessions || 0}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {submission.totals?.lectures || 0}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
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

