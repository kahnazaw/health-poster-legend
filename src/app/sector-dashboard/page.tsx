"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

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

const getFullReportData = (centerName: string, month: string, year: number): any => {
  if (typeof window === "undefined") return null;
  const dataKey = `health_report_data_${centerName}_${year}_${month}`;
  const data = localStorage.getItem(dataKey);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
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

  useEffect(() => {
    loadSubmissions();
  }, [selectedMonth, selectedYear]);

  const loadSubmissions = () => {
    if (typeof window === "undefined") return;

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
          
          // Try to get full report data for totals
          const fullData = getFullReportData(center, selectedMonth, selectedYear);
          if (fullData) {
            totals = calculateTotals(fullData);
          }
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
  const submissionRate = totalCenters > 0 ? Math.round((submittedCount / totalCenters) * 100) : 0;

  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Official Header */}
      <div className="bg-white border-b-2 border-emerald-600 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
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
  );
}

