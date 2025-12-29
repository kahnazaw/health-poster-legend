"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

export default function PresentationPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("all");

  useEffect(() => {
    loadStatistics();
  }, [selectedYear, selectedMonth]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("monthly_statistics")
        .select("*")
        .eq("year", selectedYear);

      if (selectedMonth !== "all") {
        query = query.eq("month", selectedMonth);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const totalReports = data?.length || 0;
      const approved = data?.filter((r) => r.status === "approved").length || 0;
      const pending = data?.filter((r) => r.status === "submitted").length || 0;
      const rejected = data?.filter((r) => r.status === "rejected").length || 0;
      const draft = data?.filter((r) => r.status === "draft").length || 0;

      // Get unique users (reports are now per user, not per center)
      const userIds = new Set(data?.map((r) => r.user_id).filter(Boolean) || []);
      const totalCenters = userIds.size;

      // Calculate totals from statistics_data
      let totalIndividualSessions = 0;
      let totalLectures = 0;
      let totalSeminars = 0;

      data?.forEach((report) => {
        if (report.statistics_data?.data) {
          const stats = report.statistics_data.data;
          if (Array.isArray(stats)) {
            stats.forEach((item: any) => {
              totalIndividualSessions += item.individualSessions || 0;
              totalLectures += item.lectures || 0;
              totalSeminars += item.seminars || 0;
            });
          }
        }
      });

      setStats({
        totalReports,
        approved,
        pending,
        rejected,
        draft,
        totalCenters,
        totalIndividualSessions,
        totalLectures,
        totalSeminars,
        approvalRate: totalReports > 0 ? Math.round((approved / totalReports) * 100) : 0,
        submissionRate: totalCenters > 0 ? Math.round((totalReports / totalCenters) * 100) : 0,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading statistics:", error);
      setLoading(false);
    }
  };

  const generatePresentationPDF = async () => {
    if (!stats) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    const addText = (text: string, x: number, y: number, options?: any) => {
      doc.text(text, x, y, { ...options, align: options?.align || "right" });
    };

    // Cover Slide
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, pageWidth, 60, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    addText("عرض تقديمي للإدارة العليا", pageWidth - margin, 35);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    addText("نظام إدارة إحصائيات المراكز الصحية", pageWidth - margin, 50);

    doc.setTextColor(0, 0, 0);
    yPos = 70;

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    addText(`السنة: ${selectedYear}`, pageWidth - margin, yPos);
    yPos += 8;
    if (selectedMonth !== "all") {
      addText(`الشهر: ${selectedMonth}`, pageWidth - margin, yPos);
      yPos += 8;
    }
    addText(`تاريخ الإنشاء: ${new Date().toLocaleDateString("ar-IQ")}`, pageWidth - margin, yPos);
    yPos += 15;

    // Slide 2: Executive Summary
    doc.addPage();
    yPos = margin;

    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    addText("ملخص تنفيذي", pageWidth - margin, 15);

    doc.setTextColor(0, 0, 0);
    yPos = 30;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addText("المؤشرات الرئيسية", pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(`إجمالي التقارير: ${stats.totalReports}`, pageWidth - margin, yPos);
    yPos += 8;
    addText(`إجمالي المراكز الصحية: ${stats.totalCenters}`, pageWidth - margin, yPos);
    yPos += 8;
    addText(`نسبة الإرسال: ${stats.submissionRate}%`, pageWidth - margin, yPos);
    yPos += 8;
    addText(`نسبة الاعتماد: ${stats.approvalRate}%`, pageWidth - margin, yPos);
    yPos += 15;

    // Slide 3: Status Breakdown
    doc.addPage();
    yPos = margin;

    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    addText("توزيع الحالات", pageWidth - margin, 15);

    doc.setTextColor(0, 0, 0);
    yPos = 30;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText(`معتمد: ${stats.approved} (${Math.round((stats.approved / stats.totalReports) * 100)}%)`, pageWidth - margin, yPos);
    yPos += 10;
    addText(`قيد المراجعة: ${stats.pending} (${Math.round((stats.pending / stats.totalReports) * 100)}%)`, pageWidth - margin, yPos);
    yPos += 10;
    addText(`مرفوض: ${stats.rejected} (${Math.round((stats.rejected / stats.totalReports) * 100)}%)`, pageWidth - margin, yPos);
    yPos += 10;
    addText(`مسودة: ${stats.draft} (${Math.round((stats.draft / stats.totalReports) * 100)}%)`, pageWidth - margin, yPos);
    yPos += 15;

    // Slide 4: Activity Summary
    doc.addPage();
    yPos = margin;

    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    addText("ملخص النشاط", pageWidth - margin, 15);

    doc.setTextColor(0, 0, 0);
    yPos = 30;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText(`الجلسات الفردية: ${stats.totalIndividualSessions.toLocaleString()}`, pageWidth - margin, yPos);
    yPos += 10;
    addText(`المحاضرات: ${stats.totalLectures.toLocaleString()}`, pageWidth - margin, yPos);
    yPos += 10;
    addText(`الندوات: ${stats.totalSeminars.toLocaleString()}`, pageWidth - margin, yPos);
    yPos += 10;

    const totalActivity = stats.totalIndividualSessions + stats.totalLectures + stats.totalSeminars;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addText(`الإجمالي: ${totalActivity.toLocaleString()}`, pageWidth - margin, yPos);
    yPos += 15;

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    addText("دائرة صحة كركوك - قطاع كركوك الأول - وحدة تعزيز الصحة", pageWidth - margin, pageHeight - 10);
    addText(`صفحة ${doc.internal.pages.length}`, margin, pageHeight - 10);

    doc.save(`عرض_تقديمي_${selectedYear}_${new Date().getTime()}.pdf`);
  };

  const arabicMonths = [
    "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
    "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8 mb-6">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">عرض تقديمي للإدارة العليا</h1>
              <p className="text-gray-600">إنشاء عرض تقديمي شامل للمؤشرات والإحصائيات</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">السنة</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">الشهر</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500"
                >
                  <option value="all">جميع الأشهر</option>
                  {arabicMonths.map((month, index) => (
                    <option key={index} value={String(index + 1).padStart(2, "0")}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadStatistics}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-200 disabled:bg-gray-400"
                >
                  {loading ? "جاري التحميل..." : "تحديث البيانات"}
                </button>
              </div>
            </div>

            {/* Statistics Preview */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">إجمالي التقارير</div>
                  <div className="text-3xl font-bold text-blue-600">{stats.totalReports}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
                  <div className="text-sm text-gray-600 mb-1">معتمد</div>
                  <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border-2 border-yellow-200">
                  <div className="text-sm text-gray-600 mb-1">قيد المراجعة</div>
                  <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border-2 border-emerald-200">
                  <div className="text-sm text-gray-600 mb-1">نسبة الاعتماد</div>
                  <div className="text-3xl font-bold text-emerald-600">{stats.approvalRate}%</div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={generatePresentationPDF}
                disabled={!stats || loading}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>تحميل العرض التقديمي (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

