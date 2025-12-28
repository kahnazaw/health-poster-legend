"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

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

export default function StatisticsPage() {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    // Generate Excel file and download
    const monthNames = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ];
    const monthName = monthNames[parseInt(formData.month) - 1] || formData.month;
    const fileName = `إحصائيات_التوعية_الصحية_${formData.year}_${monthName}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          نموذج الإحصائيات الشهرية للتوعية الصحية
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 pb-6 border-b">
            <div>
              <label className="block text-sm font-medium mb-2">
                اسم المركز الصحي
              </label>
              <input
                type="text"
                value={formData.healthCenterName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, healthCenterName: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
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
                  const monthNames = [
                    "يناير",
                    "فبراير",
                    "مارس",
                    "أبريل",
                    "مايو",
                    "يونيو",
                    "يوليو",
                    "أغسطس",
                    "سبتمبر",
                    "أكتوبر",
                    "نوفمبر",
                    "ديسمبر",
                  ];
                  return (
                    <option key={monthNum} value={monthNum}>
                      {monthNames[i]}
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
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              حفظ البيانات
            </button>
            <button
              type="button"
              onClick={handleExportToExcel}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
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
    </main>
  );
}

