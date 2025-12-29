/**
 * Report Generator - مولد التقارير الآلية
 * يولد التقارير الأسبوعية والشهرية الموحدة
 */

import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { calculatePeriodScore } from "@/lib/analytics/scoringEngine";

export interface ReportData {
  periodStart: Date;
  periodEnd: Date;
  centers: Array<{
    centerName: string;
    topics: Array<{
      topicName: string;
      category: string;
      meetings: number;
      lectures: number;
      seminars: number;
    }>;
    totals: {
      meetings: number;
      lectures: number;
      seminars: number;
      posters: number;
    };
    score: number;
  }>;
  summary: {
    totalMeetings: number;
    totalLectures: number;
    totalSeminars: number;
    totalPosters: number;
    activeCenters: number;
  };
}

/**
 * جلب بيانات التقرير لفترة زمنية محددة
 */
export async function fetchReportData(
  startDate: Date,
  endDate: Date,
  reportType: "weekly" | "monthly"
): Promise<ReportData> {
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  // جلب جميع الإحصائيات للفترة
  const { data: statistics, error: statsError } = await supabase
    .from("daily_statistics")
    .select(`
      *,
      profiles!inner(full_name, health_center_name),
      health_topics!inner(topic_name, category_name)
    `)
    .gte("entry_date", startDateStr)
    .lte("entry_date", endDateStr);

  if (statsError) throw statsError;

  // جلب عدد البوسترات
  const { data: posters } = await supabase
    .from("poster_analytics")
    .select("user_id")
    .gte("generated_at", startDate.toISOString())
    .lte("generated_at", endDate.toISOString());

  // تجميع البيانات حسب المركز
  const centerMap = new Map<string, any>();

  statistics?.forEach((stat: any) => {
    const centerId = stat.center_id;
    const centerName = stat.profiles?.health_center_name || stat.profiles?.full_name || "غير معروف";

    if (!centerMap.has(centerId)) {
      centerMap.set(centerId, {
        centerName,
        topics: new Map(),
        totals: {
          meetings: 0,
          lectures: 0,
          seminars: 0,
          posters: 0,
        },
      });
    }

    const center = centerMap.get(centerId);
    const topicId = stat.topic_id;
    const topicName = stat.health_topics?.topic_name || "غير معروف";
    const category = stat.health_topics?.category_name || "عام";

    if (!center.topics.has(topicId)) {
      center.topics.set(topicId, {
        topicName,
        category,
        meetings: 0,
        lectures: 0,
        seminars: 0,
      });
    }

    const topic = center.topics.get(topicId);
    topic.meetings += stat.individual_meetings || 0;
    topic.lectures += stat.lectures || 0;
    topic.seminars += stat.seminars || 0;

    center.totals.meetings += stat.individual_meetings || 0;
    center.totals.lectures += stat.lectures || 0;
    center.totals.seminars += stat.seminars || 0;
  });

  // حساب عدد البوسترات لكل مركز
  const postersMap = new Map<string, number>();
  posters?.forEach((poster: any) => {
    const userId = poster.user_id;
    postersMap.set(userId, (postersMap.get(userId) || 0) + 1);
  });

    // تحويل إلى مصفوفة وحساب النقاط
    const centers = Array.from(centerMap.entries()).map(([centerId, center]) => {
      const postersCount = postersMap.get(centerId) || 0;
      center.totals.posters = postersCount;

      const scoreResult = calculatePeriodScore({
        totalMeetings: center.totals.meetings,
        totalLectures: center.totals.lectures,
        totalSeminars: center.totals.seminars,
        totalPosters: postersCount,
      });

      return {
        centerName: center.centerName,
        topics: Array.from(center.topics.values()) as Array<{
          topicName: string;
          category: string;
          meetings: number;
          lectures: number;
          seminars: number;
        }>,
        totals: center.totals,
        score: scoreResult.normalizedScore,
      };
    });

  // حساب الإجماليات
  const summary = {
    totalMeetings: centers.reduce((sum, c) => sum + c.totals.meetings, 0),
    totalLectures: centers.reduce((sum, c) => sum + c.totals.lectures, 0),
    totalSeminars: centers.reduce((sum, c) => sum + c.totals.seminars, 0),
    totalPosters: centers.reduce((sum, c) => sum + c.totals.posters, 0),
    activeCenters: centers.filter((c) => c.totals.meetings + c.totals.lectures + c.totals.seminars > 0).length,
  };

  return {
    periodStart: startDate,
    periodEnd: endDate,
    centers,
    summary,
  };
}

/**
 * توليد تقرير Excel
 */
export async function generateExcelReport(reportData: ReportData, reportType: "weekly" | "monthly"): Promise<Blob> {
  // إنشاء ورقة العمل الرئيسية
  const mainData = [
    ["تقرير إحصائي", reportType === "weekly" ? "أسبوعي" : "شهري", "قطاع كركوك الأول"],
    ["الفترة", `${reportData.periodStart.toLocaleDateString("ar")} - ${reportData.periodEnd.toLocaleDateString("ar")}`],
    [],
    ["اسم المركز", "اللقاءات الفردية", "المحاضرات", "الندوات", "البوسترات", "النقاط"],
  ];

  reportData.centers.forEach((center) => {
    mainData.push([
      center.centerName,
      center.totals.meetings.toString(),
      center.totals.lectures.toString(),
      center.totals.seminars.toString(),
      center.totals.posters.toString(),
      center.score.toFixed(1),
    ]);
  });

  mainData.push([]);
  mainData.push(["الإجمالي", reportData.summary.totalMeetings.toString(), reportData.summary.totalLectures.toString(), reportData.summary.totalSeminars.toString(), reportData.summary.totalPosters.toString()]);

  const ws = XLSX.utils.aoa_to_sheet(mainData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "التقرير الموحد");

  // إنشاء ورقة تفصيلية لكل مركز
  reportData.centers.forEach((center) => {
    const centerData = [
      [`${center.centerName} - التفاصيل`],
      [],
      ["الموضوع", "الفئة", "اللقاءات", "المحاضرات", "الندوات"],
    ];

    center.topics.forEach((topic) => {
      centerData.push([topic.topicName, topic.category, topic.meetings.toString(), topic.lectures.toString(), topic.seminars.toString()]);
    });

    const centerWs = XLSX.utils.aoa_to_sheet(centerData);
    XLSX.utils.book_append_sheet(wb, centerWs, center.centerName.substring(0, 31));
  });

  const excelBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * توليد تقرير PDF
 */
export async function generatePDFReport(reportData: ReportData, reportType: "weekly" | "monthly"): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // العنوان
  pdf.setFontSize(18);
  pdf.text("تقرير إحصائي " + (reportType === "weekly" ? "أسبوعي" : "شهري"), 105, 20, { align: "center" });
  pdf.setFontSize(14);
  pdf.text("قطاع كركوك الأول - دائرة صحة كركوك", 105, 30, { align: "center" });
  pdf.text(
    `الفترة: ${reportData.periodStart.toLocaleDateString("ar")} - ${reportData.periodEnd.toLocaleDateString("ar")}`,
    105,
    40,
    { align: "center" }
  );

  // جدول البيانات
  let yPos = 50;
  pdf.setFontSize(10);
  pdf.text("اسم المركز", 20, yPos);
  pdf.text("اللقاءات", 60, yPos);
  pdf.text("المحاضرات", 80, yPos);
  pdf.text("الندوات", 100, yPos);
  pdf.text("البوسترات", 120, yPos);
  pdf.text("النقاط", 150, yPos);

  yPos += 10;
  pdf.line(20, yPos, 190, yPos);

  reportData.centers.forEach((center) => {
    yPos += 8;
    if (yPos > 270) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.text(center.centerName, 20, yPos);
    pdf.text(center.totals.meetings.toString(), 60, yPos);
    pdf.text(center.totals.lectures.toString(), 80, yPos);
    pdf.text(center.totals.seminars.toString(), 100, yPos);
    pdf.text(center.totals.posters.toString(), 120, yPos);
    pdf.text(center.score.toFixed(1), 150, yPos);
  });

  // الإجمالي
  yPos += 10;
  pdf.line(20, yPos, 190, yPos);
  yPos += 8;
  pdf.setFont("helvetica", "bold");
  pdf.text("الإجمالي", 20, yPos);
  pdf.text(reportData.summary.totalMeetings.toString(), 60, yPos);
  pdf.text(reportData.summary.totalLectures.toString(), 80, yPos);
  pdf.text(reportData.summary.totalSeminars.toString(), 100, yPos);
  pdf.text(reportData.summary.totalPosters.toString(), 120, yPos);

  // التذييل
  pdf.setFontSize(8);
  pdf.text(
    `تم التوليد: ${new Date().toLocaleDateString("ar")} | المراكز النشطة: ${reportData.summary.activeCenters}`,
    105,
    280,
    { align: "center" }
  );

  return pdf.output("blob");
}

