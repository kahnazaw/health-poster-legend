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

// Health centers list - can be replaced with API/database later
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

// Data structure matching the official Iraqi Ministry of Health monthly statistics form
interface TopicStatistics {
  individualSessions: number;
  lectures: number;
  seminars: number;
}

interface CategoryData {
  [topicKey: string]: TopicStatistics;
}

interface MonthlyStatistics {
  healthCenterName: string;
  month: string;
  year: number;
  categories: {
    maternalChildHealth: CategoryData;
    communicableDiseases: CategoryData;
    nonCommunicableDiseases: CategoryData;
    environmentalHealth: CategoryData;
    nutrition: CategoryData;
    mentalHealth: CategoryData;
    familyPlanning: CategoryData;
    immunization: CategoryData;
    schoolHealth: CategoryData;
    healthEducation: CategoryData;
  };
}

// Form structure matching the official paper form
const formStructure = {
  communicableDiseases: {
    title: "الوقاية من الأمراض المعدية",
    topics: [
      "الوقاية من الأمراض التنفسية",
      "الوقاية من الأمراض المعوية",
      "الوقاية من الأمراض الجلدية",
      "الوقاية من الأمراض المنقولة جنسياً",
      "الوقاية من الأمراض المنقولة بالدم",
      "الوقاية من الأمراض الحيوانية المنشأ",
    ],
  },
  nonCommunicableDiseases: {
    title: "الوقاية من الأمراض غير المعدية",
    topics: [
      "الوقاية من أمراض القلب والشرايين",
      "الوقاية من السكري",
      "الوقاية من السرطان",
      "الوقاية من أمراض الجهاز التنفسي المزمنة",
      "الوقاية من السمنة",
      "الوقاية من ارتفاع ضغط الدم",
    ],
  },
  maternalChildHealth: {
    title: "صحة الأم والطفل",
    topics: [
      "رعاية الحامل",
      "رعاية ما بعد الولادة",
      "الرضاعة الطبيعية",
      "نمو وتطور الطفل",
      "التغذية التكميلية",
      "صحة المراهقين",
    ],
  },
  nutrition: {
    title: "التثقيف الغذائي",
    topics: [
      "التغذية المتوازنة",
      "التغذية للأطفال",
      "التغذية للحوامل والمرضعات",
      "التغذية لكبار السن",
      "الوقاية من سوء التغذية",
      "الأنظمة الغذائية الخاصة",
    ],
  },
  environmentalHealth: {
    title: "الصحة البيئية",
    topics: [
      "سلامة المياه",
      "سلامة الغذاء",
      "النظافة العامة",
      "إدارة النفايات",
      "مكافحة الحشرات والقوارض",
      "التهوية والإضاءة",
    ],
  },
  schoolHealth: {
    title: "برامج الصحة المدرسية",
    topics: [
      "الصحة المدرسية العامة",
      "النظافة الشخصية للطلاب",
      "التغذية المدرسية",
      "النشاط البدني",
      "الصحة النفسية للطلاب",
      "الوقاية من الأمراض في المدارس",
    ],
  },
  mentalHealth: {
    title: "تعزيز الصحة النفسية",
    topics: [
      "الصحة النفسية العامة",
      "التعامل مع الضغوط النفسية",
      "الصحة النفسية للأطفال",
      "الصحة النفسية للمراهقين",
      "الصحة النفسية لكبار السن",
      "الوقاية من الإدمان",
    ],
  },
  familyPlanning: {
    title: "تنظيم الأسرة",
    topics: [
      "وسائل منع الحمل",
      "المباعدة بين الولادات",
      "صحة الإنجاب",
      "الاستشارة الأسرية",
      "التخطيط الأسري",
      "صحة المرأة الإنجابية",
    ],
  },
  immunization: {
    title: "التطعيم",
    topics: [
      "التطعيم للأطفال",
      "التطعيم للحوامل",
      "التطعيم لكبار السن",
      "التطعيم للمسافرين",
      "التطعيم للعاملين الصحيين",
      "التطعيمات الموسمية",
    ],
  },
  healthEducation: {
    title: "حملات التثقيف الصحي",
    topics: [
      "مبادئ الصحة العامة",
      "الوقاية من الحوادث",
      "الإسعافات الأولية",
      "السلوكيات الصحية",
      "الوعي الصحي المجتمعي",
      "المشاركة المجتمعية في الصحة",
    ],
  },
};

const initialTopicStats: TopicStatistics = {
  individualSessions: 0,
  lectures: 0,
  seminars: 0,
};

// Helper functions for duplicate detection using localStorage
const getReportKey = (healthCenterName: string, month: string, year: number): string => {
  return `health_report_${healthCenterName}_${year}_${month}`;
};

const isReportSubmitted = (healthCenterName: string, month: string, year: number): boolean => {
  if (typeof window === "undefined") return false;
  const key = getReportKey(healthCenterName, month, year);
  return localStorage.getItem(key) !== null;
};

const markReportAsSubmitted = (healthCenterName: string, month: string, year: number, reportData?: MonthlyStatistics): void => {
  if (typeof window === "undefined") return;
  const key = getReportKey(healthCenterName, month, year);
  localStorage.setItem(key, JSON.stringify({ submittedAt: new Date().toISOString() }));
  
  // Also store full report data for dashboard
  if (reportData) {
    const dataKey = `health_report_data_${healthCenterName}_${year}_${month}`;
    localStorage.setItem(dataKey, JSON.stringify(reportData));
  }
};

export default function StatisticsPage() {
  const [validationError, setValidationError] = useState<string>("");
  const [duplicateError, setDuplicateError] = useState<string>("");
  
  const [formData, setFormData] = useState<MonthlyStatistics>(() => {
    const currentDate = new Date();
    const categories: MonthlyStatistics["categories"] = {
      communicableDiseases: {},
      nonCommunicableDiseases: {},
      maternalChildHealth: {},
      nutrition: {},
      environmentalHealth: {},
      schoolHealth: {},
      mentalHealth: {},
      familyPlanning: {},
      immunization: {},
      healthEducation: {},
    };

    // Initialize all topics with zero values
    Object.entries(formStructure).forEach(([categoryKey, category]) => {
      category.topics.forEach((topic) => {
        categories[categoryKey as keyof typeof categories][topic] = {
          ...initialTopicStats,
        };
      });
    });

    return {
      healthCenterName: "",
      month: String(currentDate.getMonth() + 1).padStart(2, "0"),
      year: currentDate.getFullYear(),
      categories,
    };
  });

  const updateTopicStats = (
    categoryKey: keyof typeof formStructure,
    topic: string,
    field: keyof TopicStatistics,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryKey]: {
          ...prev.categories[categoryKey],
          [topic]: {
            ...prev.categories[categoryKey][topic],
            [field]: value >= 0 ? value : 0,
          },
        },
      },
    }));
  };

  // Check for duplicate when form data changes
  useEffect(() => {
    if (formData.healthCenterName && formData.month && formData.year) {
      if (isReportSubmitted(formData.healthCenterName, formData.month, formData.year)) {
        const monthNames = [
          "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
          "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
        ];
        const monthName = monthNames[parseInt(formData.month) - 1] || formData.month;
        setDuplicateError(
          `تم إرسال تقرير لهذا المركز الصحي (${formData.healthCenterName}) لشهر ${monthName} ${formData.year} مسبقاً. لا يمكن إرسال تقرير آخر لنفس الفترة.`
        );
      } else {
        setDuplicateError("");
      }
    } else {
      setDuplicateError("");
    }
  }, [formData.healthCenterName, formData.month, formData.year]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate health center selection
    if (!formData.healthCenterName || formData.healthCenterName === "") {
      setValidationError("يرجى اختيار اسم المركز الصحي");
      setDuplicateError("");
      return;
    }
    
    // Check for duplicate submission
    if (isReportSubmitted(formData.healthCenterName, formData.month, formData.year)) {
      const monthName = arabicMonths[parseInt(formData.month) - 1] || formData.month;
      setDuplicateError(
        `تم إرسال تقرير لهذا المركز الصحي (${formData.healthCenterName}) لشهر ${monthName} ${formData.year} مسبقاً. لا يمكن إرسال تقرير آخر لنفس الفترة.`
      );
      setValidationError("");
      return;
    }
    
    setValidationError("");
    setDuplicateError("");
    
    // Mark report as submitted (with full data for dashboard)
    markReportAsSubmitted(formData.healthCenterName, formData.month, formData.year, formData);
    
    const exportData = JSON.stringify(formData, null, 2);
    console.log("Statistics Data:", exportData);
    alert("تم حفظ البيانات بنجاح.");
  };

  const calculateCategoryTotal = (categoryKey: keyof typeof formStructure) => {
    const category = formData.categories[categoryKey];
    let total = { individualSessions: 0, lectures: 0, seminars: 0 };
    Object.values(category).forEach((topic) => {
      total.individualSessions += topic.individualSessions;
      total.lectures += topic.lectures;
      total.seminars += topic.seminars;
    });
    return total;
  };

  const handleExportToExcel = () => {
    // Validate health center selection
    if (!formData.healthCenterName || formData.healthCenterName === "") {
      setValidationError("يرجى اختيار اسم المركز الصحي قبل التصدير");
      setDuplicateError("");
      return;
    }
    
    // Check for duplicate submission
    if (isReportSubmitted(formData.healthCenterName, formData.month, formData.year)) {
      const monthName = arabicMonths[parseInt(formData.month) - 1] || formData.month;
      setDuplicateError(
        `تم إرسال تقرير لهذا المركز الصحي (${formData.healthCenterName}) لشهر ${monthName} ${formData.year} مسبقاً. لا يمكن تصدير تقرير مكرر.`
      );
      setValidationError("");
      return;
    }
    
    setValidationError("");
    setDuplicateError("");
    
    // Prepare data for Excel export
    const excelData: Array<{
      "اسم المركز الصحي": string;
      "الشهر": string;
      "السنة": number;
      "الفئة": string;
      "الموضوع": string;
      "جلسات فردية": number;
      "محاضرات": number;
      "ندوات": number;
    }> = [];

    // Add header information and all statistics
    Object.entries(formStructure).forEach(([categoryKey, category]) => {
      const categoryData = formData.categories[categoryKey as keyof typeof formStructure];
      
      category.topics.forEach((topic) => {
        const topicData = categoryData[topic] || initialTopicStats;
        excelData.push({
          "اسم المركز الصحي": formData.healthCenterName || "",
          "الشهر": formData.month,
          "السنة": formData.year,
          "الفئة": category.title,
          "الموضوع": topic,
          "جلسات فردية": topicData.individualSessions,
          "محاضرات": topicData.lectures,
          "ندوات": topicData.seminars,
        });
      });
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "إحصائيات التوعية الصحية");

    // Add official header rows
    const monthName = arabicMonths[parseInt(formData.month) - 1] || formData.month;
    
    // Insert header rows at the beginning
    XLSX.utils.sheet_add_aoa(worksheet, [
      ["دائرة صحة كركوك"],
      ["قطاع كركوك الأول – وحدة تعزيز الصحة"],
      [`نموذج الإحصائية الشهرية للتوعية الصحية - ${monthName} ${formData.year}`],
      [""], // Empty row
    ], { origin: "A1" });

    // Set column widths for better readability
    const columnWidths = [
      { wch: 25 }, // اسم المركز الصحي
      { wch: 10 }, // الشهر
      { wch: 10 }, // السنة
      { wch: 30 }, // الفئة
      { wch: 35 }, // الموضوع
      { wch: 15 }, // جلسات فردية
      { wch: 12 }, // محاضرات
      { wch: 12 }, // ندوات
    ];
    worksheet["!cols"] = columnWidths;

    // Merge header cells for better appearance
    if (!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Row 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Row 2
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }  // Row 3
    );

    // Generate Excel file and download
    const fileName = `إحصائيات_التوعية_الصحية_${formData.year}_${monthName}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Official Header */}
      <div className="bg-white border-b-2 border-emerald-600 py-6">
        <div className="max-w-6xl mx-auto px-4">
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
              نموذج الإحصائية الشهرية للتوعية الصحية
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 pb-6 border-b">
            <div>
              <label className="block text-sm font-medium mb-2">
                اسم المركز الصحي <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.healthCenterName}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, healthCenterName: e.target.value }));
                  if (validationError) setValidationError("");
                }}
                className={`w-full px-3 py-2 border rounded-md ${
                  validationError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                }`}
                required
              >
                <option value="">-- اختر المركز الصحي --</option>
                {healthCenters.map((center) => (
                  <option key={center} value={center}>
                    {center}
                  </option>
                ))}
              </select>
              {validationError && (
                <p className="mt-1 text-sm text-red-500">{validationError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الشهر</label>
              <select
                value={formData.month}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, month: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
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
                value={formData.year}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    year: parseInt(e.target.value) || new Date().getFullYear(),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="2020"
                max="2100"
                required
              />
            </div>
          </div>

          {/* Duplicate Warning */}
          {duplicateError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="mr-3">
                  <p className="text-sm font-medium text-red-800">{duplicateError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Categories */}
          {Object.entries(formStructure).map(([categoryKey, category]) => {
            const categoryData = formData.categories[categoryKey as keyof typeof formStructure];
            const totals = calculateCategoryTotal(categoryKey as keyof typeof formStructure);

            return (
              <div key={categoryKey} className="mb-8 border-b pb-6 last:border-b-0">
                <h2 className="text-xl font-bold mb-4 text-emerald-700">
                  {category.title}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-right">
                          الموضوع
                        </th>
                        <th className="border border-gray-300 px-4 py-2">
                          جلسات فردية
                        </th>
                        <th className="border border-gray-300 px-4 py-2">
                          محاضرات
                        </th>
                        <th className="border border-gray-300 px-4 py-2">
                          ندوات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.topics.map((topic) => (
                        <tr key={topic}>
                          <td className="border border-gray-300 px-4 py-2 font-medium">
                            {topic}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              value={categoryData[topic]?.individualSessions || 0}
                              onChange={(e) =>
                                updateTopicStats(
                                  categoryKey as keyof typeof formStructure,
                                  topic,
                                  "individualSessions",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-center border border-gray-200 rounded"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              value={categoryData[topic]?.lectures || 0}
                              onChange={(e) =>
                                updateTopicStats(
                                  categoryKey as keyof typeof formStructure,
                                  topic,
                                  "lectures",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-center border border-gray-200 rounded"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              value={categoryData[topic]?.seminars || 0}
                              onChange={(e) =>
                                updateTopicStats(
                                  categoryKey as keyof typeof formStructure,
                                  topic,
                                  "seminars",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-center border border-gray-200 rounded"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="border border-gray-300 px-4 py-2">
                          المجموع
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {totals.individualSessions}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {totals.lectures}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {totals.seminars}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Submit Button */}
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <button
              type="submit"
              disabled={!!duplicateError}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                duplicateError
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              حفظ البيانات
            </button>
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={!!duplicateError}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                duplicateError
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              تصدير إلى Excel
            </button>
            <button
              type="button"
              onClick={() => {
                const dataStr = JSON.stringify(formData, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `health-statistics-${formData.year}-${formData.month}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              تصدير JSON (للتطوير)
            </button>
          </div>
        </form>
      </div>

      {/* Official Footer */}
      <footer className="bg-white border-t-2 border-gray-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-700 mb-2">
            هذه البيانات أُعدّت وفق النموذج المعتمد من وزارة الصحة العراقية
          </p>
          <p className="text-xs text-gray-500 mb-1">
            للاستخدام الرسمي فقط
          </p>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} دائرة صحة كركوك
          </p>
        </div>
      </footer>
    </main>
  );
}

