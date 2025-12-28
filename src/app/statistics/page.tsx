"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import ProtectedRoute from "@/components/ProtectedRoute";

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
  const [selectedCenter, setSelectedCenter] = useState(healthCenters[0]);
  const [selectedMonth, setSelectedMonth] = useState(arabicMonths[0]);
  const [currentYear] = useState(new Date().getFullYear());

  // دالة التعامل مع رفع ملف الإكسل (مثال)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      console.log("Data from Excel:", data);
      // هنا يمكنك إضافة منطق معالجة البيانات وتحويلها لـ MonthlyStatistics
    };
    reader.readAsBinaryString(file);
  };

  return (
    <ProtectedRoute allowedRoles={["center_user"]}>
      <div className="p-6 max-w-4xl mx-auto dir-rtl" dir="rtl">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">إحصائيات المراكز الصحية</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* اختيار المركز الصحي */}
        <div>
          <label className="block mb-2 font-semibold">المركز الصحي:</label>
          <select 
            value={selectedCenter} 
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="w-full p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            {healthCenters.map((center) => (
              <option key={center} value={center}>{center}</option>
            ))}
          </select>
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