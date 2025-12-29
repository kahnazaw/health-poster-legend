"use client";

import React, { useState, useRef } from "react";
import PosterTemplateSelector, { PosterTopic } from "@/components/poster/PosterTemplateSelector";
import PosterEditor from "@/components/poster/PosterEditor";
import PosterPreview from "@/components/poster/PosterPreview";
import PosterExportActions from "@/components/poster/PosterExportActions";
import PosterHistory from "@/components/poster/PosterHistory";
import LoadingSpinner from "@/components/LoadingSpinner";
import SkeletonLoader from "@/components/SkeletonLoader";

type Step = "select" | "edit" | "preview";

const steps = [
  { number: 1, title: "اختيار الموضوع", icon: "📋" },
  { number: 2, title: "تعديل المحتوى", icon: "✏️" },
  { number: 3, title: "معاينة", icon: "👁️" },
  { number: 4, title: "تصدير", icon: "💾" },
];

export default function PosterPage() {
  const [currentStep, setCurrentStep] = useState<Step>("select");
  const [selectedTopic, setSelectedTopic] = useState<PosterTopic | null>(null);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [exportComplete, setExportComplete] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleSelectTopic = (topic: PosterTopic) => {
    setSelectedTopic(topic);
    setCustomTitle("");
    setCustomMessage("");
    setCurrentStep("edit");
  };

  const handleNext = () => {
    if (currentStep === "select" && selectedTopic) {
      setCurrentStep("edit");
    } else if (currentStep === "edit") {
      setCurrentStep("preview");
    }
  };

  const handleBack = () => {
    if (currentStep === "preview") {
      setCurrentStep("edit");
    } else if (currentStep === "edit") {
      setCurrentStep("select");
    }
  };

  const handleExportComplete = () => {
    setExportComplete(true);
    setTimeout(() => setExportComplete(false), 3000);
  };

  const getCurrentStepNumber = () => {
    switch (currentStep) {
      case "select":
        return 1;
      case "edit":
        return 2;
      case "preview":
        return 3;
      default:
        return 1;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-8">
      {/* Official Header */}
      <div className="bg-white border-b-4 border-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <img
                src="/logo.png"
                alt="شعار دائرة صحة كركوك"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              نظام إنشاء البوسترات التوعوية
            </h1>
            <p className="text-gray-600">إنشاء بوسترات توعوية احترافية بسهولة</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center relative">
            {steps.map((step, index) => {
              const stepNumber = getCurrentStepNumber();
              const isActive = index + 1 <= stepNumber;
              const isCurrent = index + 1 === stepNumber;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-300 ${
                        isActive ? "bg-emerald-600" : "bg-gray-300"
                      }`}
                    >
                      {isCurrent ? step.icon : step.number}
                    </div>
                    <p
                      className={`text-xs mt-2 text-center max-w-[80px] ${
                        isActive ? "text-emerald-700 font-semibold" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                        index + 1 < stepNumber ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Success Message */}
        {exportComplete && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 font-semibold">تم تصدير البوستر بنجاح!</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column: Controls */}
          <div className="space-y-6">
            {currentStep === "select" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <PosterTemplateSelector
                  selectedTopic={selectedTopic}
                  onSelectTopic={handleSelectTopic}
                />
              </div>
            )}

            {currentStep === "edit" && selectedTopic && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">تعديل المحتوى</h2>
                  <p className="text-gray-600 text-sm">يمكنك تعديل العنوان والرسالة حسب احتياجك</p>
                </div>
                <PosterEditor
                  topic={selectedTopic}
                  customTitle={customTitle}
                  customMessage={customMessage}
                  onTitleChange={setCustomTitle}
                  onMessageChange={setCustomMessage}
                />
              </div>
            )}

            {currentStep === "preview" && selectedTopic && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">إجراءات التصدير</h2>
                  <p className="text-gray-600 text-sm">اختر صيغة التصدير المناسبة</p>
                </div>
                <PosterExportActions
                  posterRef={posterRef}
                  topicTitle={customTitle || selectedTopic.title}
                  onExportComplete={handleExportComplete}
                />
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    💡 PNG مناسب للمشاركة على وسائل التواصل الاجتماعي. PDF مناسب للطباعة الرسمية.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {currentStep === "select" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">اختر موضوعًا للبدء</h3>
                <p className="text-gray-600">اختر موضوع التوعية من القائمة على اليسار</p>
              </div>
            )}

            {currentStep === "edit" && selectedTopic && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">معاينة مباشرة</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p className="text-sm">ستظهر المعاينة بعد الانتقال إلى خطوة المعاينة</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "preview" && selectedTopic && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">معاينة البوستر</h3>
                <div className="overflow-auto max-h-[800px] border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <PosterPreview
                    ref={posterRef}
                    topic={selectedTopic}
                    customTitle={customTitle}
                    customMessage={customMessage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6">
          {currentStep !== "select" && (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              رجوع
            </button>
          )}

          {currentStep === "select" && (
            <div className="text-gray-500 text-sm">اختر موضوعًا للبدء</div>
          )}

          {currentStep === "edit" && (
            <button
              onClick={handleNext}
              className="ml-auto px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              معاينة
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
        </div>

        {/* Poster History */}
        <div className="mt-6">
          <PosterHistory />
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg p-4 md:hidden z-40">
        {currentStep === "preview" && selectedTopic && (
          <PosterExportActions
            posterRef={posterRef}
            topicTitle={customTitle || selectedTopic.title}
            onExportComplete={handleExportComplete}
          />
        )}
        {currentStep !== "preview" && (
          <div className="text-center text-gray-500 text-sm">
            {currentStep === "select" && "اختر موضوعًا للبدء"}
            {currentStep === "edit" && "عدّل المحتوى ثم اضغط معاينة"}
          </div>
        )}
      </div>
    </main>
  );
}
