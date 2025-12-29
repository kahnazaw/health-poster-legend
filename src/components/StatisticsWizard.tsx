"use client";

import React, { useState } from "react";
import StatusTimeline from "./StatusTimeline";
import StatusBadge from "./StatusBadge";

interface StatisticsWizardProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  reportInfo: any;
  selectedMonth: string;
  currentYear: number;
  healthCenterName: string;
  onFileUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isApproved: boolean;
}

const steps = [
  { number: 1, title: "معلومات التقرير", icon: "📋" },
  { number: 2, title: "رفع الملف", icon: "📤" },
  { number: 3, title: "مراجعة", icon: "👁️" },
  { number: 4, title: "إرسال", icon: "✅" },
];

export default function StatisticsWizard({
  currentStep,
  onStepChange,
  reportInfo,
  selectedMonth,
  currentYear,
  healthCenterName,
  onFileUpload,
  fileInputRef,
  isApproved,
}: StatisticsWizardProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      if (currentStep < 3) {
        onStepChange(3); // Move to review step
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isAccessible = currentStep >= step.number || isCompleted;

            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => isAccessible && !isApproved && onStepChange(step.number)}
                    disabled={!isAccessible || isApproved}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-600 text-white scale-110 shadow-lg"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : isAccessible
                        ? "bg-gray-200 text-gray-600"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    } ${isAccessible && !isApproved ? "hover:scale-105" : ""}`}
                  >
                    {isCompleted ? "✓" : step.icon}
                  </button>
                  <span
                    className={`text-xs mt-2 text-center font-medium ${
                      isActive ? "text-emerald-600 font-bold" : "text-gray-600"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all duration-200 ${
                      isCompleted ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">معلومات التقرير</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">اسم المركز الصحي:</label>
                <input
                  type="text"
                  value={healthCenterName}
                  disabled
                  readOnly
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">الشهر:</label>
                <input
                  type="text"
                  value={selectedMonth}
                  disabled
                  readOnly
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">السنة:</label>
                <input
                  type="number"
                  value={currentYear}
                  disabled
                  readOnly
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                />
              </div>
            </div>
            {reportInfo && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <StatusTimeline
                  status={reportInfo.status}
                  rejectionReason={reportInfo.rejection_reason}
                  approvedAt={reportInfo.approved_at}
                />
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => onStepChange(2)}
                disabled={isApproved}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                التالي →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">رفع ملف الإحصائيات</h2>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                isApproved
                  ? "border-gray-300 bg-gray-50 opacity-60"
                  : "border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={isApproved}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer block ${
                  isApproved ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {isApproved ? "تم اعتماد التقرير - لا يمكن التعديل" : "اضغط لرفع ملف Excel"}
                </p>
                <p className="text-sm text-gray-500">صيغ مدعومة: .xlsx, .xls</p>
              </label>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => onStepChange(1)}
                disabled={isApproved}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                ← السابق
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">مراجعة المعلومات</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">المركز الصحي:</span>
                <span className="font-semibold text-gray-800">{healthCenterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الشهر:</span>
                <span className="font-semibold text-gray-800">{selectedMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">السنة:</span>
                <span className="font-semibold text-gray-800">{currentYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الملف:</span>
                <span className="font-semibold text-emerald-600">✓ تم الرفع</span>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => onStepChange(2)}
                disabled={isApproved}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                ← السابق
              </button>
              <button
                onClick={() => onStepChange(4)}
                disabled={isApproved}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                التالي →
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">جاهز للإرسال</h2>
            <p className="text-gray-600 mb-6">
              تأكد من صحة جميع المعلومات قبل الإرسال. سيتم إرسال التقرير للمراجعة.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => onStepChange(3)}
                disabled={isApproved}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                ← السابق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

