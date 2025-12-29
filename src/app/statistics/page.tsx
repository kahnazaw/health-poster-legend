"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

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

export default function StatisticsPage() {
  const { user, profile, loading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(arabicMonths[0]);
  const [currentYear] = useState(new Date().getFullYear());

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

        if (existingRecord) {
          // Update existing record
          const { error } = await supabase
            .from("monthly_statistics")
            .update({
              statistics_data: statisticsData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingRecord.id);

          if (error) {
            console.error("Error updating statistics:", error);
            alert("حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.");
            return;
          }
        } else {
          // Insert new record
          const { error } = await supabase
            .from("monthly_statistics")
            .insert({
              health_center_name: healthCenterName,
              user_id: user.id,
              month: monthNumber,
              year: currentYear,
              statistics_data: statisticsData,
            });

          if (error) {
            console.error("Error saving statistics:", error);
            alert("حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.");
            return;
          }
        }

        alert("تم حفظ البيانات بنجاح!");
      } catch (error) {
        console.error("Error processing file:", error);
        alert("حدث خطأ أثناء معالجة الملف. يرجى التأكد من صحة تنسيق الملف.");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <ProtectedRoute allowedRoles={["center_user"]}>
      <div className="p-6 max-w-4xl mx-auto dir-rtl" dir="rtl">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">إحصائيات المراكز الصحية</h1>
      
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
            className="w-full p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500"
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
      <div className="bg-blue-50 p-6 rounded-lg border-2 border-dashed border-blue-300 text-center">
        <label className="block mb-4 text-blue-700 font-bold">ارفع ملف الإحصائيات (Excel)</label>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload}
          className="mx-auto block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />
      </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>مشروع إدارة إحصائيات المراكز الصحية - صحة كركوك</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}