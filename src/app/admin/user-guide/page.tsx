"use client";

import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";

export default function UserGuidePage() {
  const { profile } = useAuth();
  const [generating, setGenerating] = useState(false);

  const generateUserGuidePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Helper function for RTL text
      const addText = (text: string, x: number, y: number, options?: any) => {
        doc.text(text, x, y, { ...options, align: options?.align || "right" });
      };

      // Cover Page
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.rect(0, 0, pageWidth, 50, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      addText("دليل استخدام النظام", pageWidth - margin, 30);

      doc.setTextColor(0, 0, 0);
      yPos = 60;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      addText("دائرة صحة كركوك", pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      addText("قطاع كركوك الأول - وحدة تعزيز الصحة", pageWidth - margin, yPos);
      yPos += 10;

      // Introduction
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("مقدمة", pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const introText = "نظام إدارة إحصائيات المراكز الصحية هو منصة إلكترونية متكاملة لإدارة وتتبع الإحصائيات الشهرية للمراكز الصحية التابعة لدائرة صحة كركوك. يوفر النظام إمكانية إدخال البيانات، مراجعتها، واعتمادها بشكل آمن ومنظم.";
      doc.text(introText, pageWidth - margin, yPos, { maxWidth: pageWidth - 2 * margin, align: "right" });
      yPos += 20;

      // Section 1: Getting Started
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("1. البدء في استخدام النظام", pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const step1Text = "1.1 تسجيل الدخول:\n- افتح المتصفح وانتقل إلى رابط النظام\n- أدخل اسم المستخدم وكلمة المرور\n- اضغط على زر تسجيل الدخول";
      doc.text(step1Text, pageWidth - margin, yPos, { maxWidth: pageWidth - 2 * margin, align: "right" });
      yPos += 25;

      const step2Text = "1.2 الصفحة الرئيسية:\n- بعد تسجيل الدخول، ستظهر الصفحة الرئيسية\n- يمكنك الوصول إلى جميع أقسام النظام من القائمة السفلية (على الموبايل)";
      doc.text(step2Text, pageWidth - margin, yPos, { maxWidth: pageWidth - 2 * margin, align: "right" });
      yPos += 25;

      // Section 2: Submitting Statistics
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("2. إرسال الإحصائيات الشهرية", pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const submitText = "2.1 خطوات إرسال التقرير:\n\nالخطوة 1: معلومات التقرير\n- اختر الشهر من القائمة المنسدلة\n- السنة تظهر تلقائياً (السنة الحالية)\n- اسم المركز الصحي يظهر تلقائياً\n\nالخطوة 2: رفع الملف\n- اضغط على زر اختيار الملف\n- اختر ملف Excel (.xlsx أو .xls)\n- تأكد من صحة البيانات في الملف\n\nالخطوة 3: المراجعة\n- راجع جميع المعلومات المدخلة\n- تأكد من صحة البيانات\n\nالخطوة 4: الإرسال\n- اضغط على زر إرسال التقرير\n- سيتم إرسال التقرير للمراجعة";
      doc.text(submitText, pageWidth - margin, yPos, { maxWidth: pageWidth - 2 * margin, align: "right" });
      yPos += 50;

      // Section 3: Status Tracking
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("3. متابعة حالة التقرير", pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const statusText = "بعد إرسال التقرير، يمكنك متابعة حالته:\n\n- مسودة: التقرير لم يتم إرساله بعد\n- قيد المراجعة: التقرير تم إرساله وهو بانتظار المراجعة\n- موافق عليه: التقرير تم اعتماده ويمكنك تحميل PDF المعتمد\n- مرفوض: التقرير تم رفضه ويمكنك رؤية سبب الرفض";
      doc.text(statusText, pageWidth - margin, yPos, { maxWidth: pageWidth - 2 * margin, align: "right" });
      yPos += 30;

      // Section 4: Tips
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("4. نصائح مهمة", pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const tipsText = "• تأكد من صحة البيانات قبل الإرسال\n• استخدم القالب المحدد لملف Excel\n• لا يمكن تعديل التقرير بعد الاعتماد\n• في حالة الرفض، راجع سبب الرفض وأعد الإرسال\n• يمكنك تثبيت التطبيق على الموبايل للوصول السريع";
      doc.text(tipsText, pageWidth - margin, yPos, { maxWidth: pageWidth - 2 * margin, align: "right" });
      yPos += 25;

      // Footer
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      addText(`تم إنشاء هذا الدليل في: ${new Date().toLocaleDateString("ar-IQ")}`, pageWidth - margin, pageHeight - 10);
      addText("دائرة صحة كركوك - جميع الحقوق محفوظة", margin, pageHeight - 10);

      // Save PDF
      doc.save(`دليل_استخدام_النظام_${new Date().getTime()}.pdf`);
      
      setGenerating(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("حدث خطأ أثناء إنشاء الدليل. يرجى المحاولة مرة أخرى.");
      setGenerating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "center_user"]}>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-emerald-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">دليل استخدام النظام</h1>
              <p className="text-gray-600">دليل شامل لاستخدام منصة إدارة إحصائيات المراكز الصحية</p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <h2 className="font-bold text-blue-800 mb-2">📖 محتويات الدليل</h2>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                  <li>مقدمة عن النظام</li>
                  <li>البدء في استخدام النظام</li>
                  <li>إرسال الإحصائيات الشهرية</li>
                  <li>متابعة حالة التقرير</li>
                  <li>نصائح مهمة</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <h2 className="font-bold text-green-800 mb-2">💡 ميزات الدليل</h2>
                <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                  <li>شرح مفصل لجميع الخطوات</li>
                  <li>صيغة PDF قابلة للطباعة</li>
                  <li>يمكن توزيعه على جميع المراكز الصحية</li>
                  <li>محدث بشكل دوري</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={generateUserGuidePDF}
                disabled={generating}
                className="px-8 py-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>جاري الإنشاء...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>تحميل دليل الاستخدام (PDF)</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>دائرة صحة كركوك - قطاع كركوك الأول - وحدة تعزيز الصحة</p>
              <p className="mt-2">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

