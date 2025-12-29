"use client";

import React, { useState, useRef } from "react";
import PosterTemplateSelector, { PosterTopic } from "@/components/poster/PosterTemplateSelector";
import PosterEditor from "@/components/poster/PosterEditor";
import PosterPreview from "@/components/poster/PosterPreview";
import PosterExportActions from "@/components/poster/PosterExportActions";
import PosterHistory from "@/components/poster/PosterHistory";
import LoadingSpinner from "@/components/LoadingSpinner";
import SkeletonLoader from "@/components/SkeletonLoader";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import SectionCard from "@/components/layout/SectionCard";

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
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      <PageHeader
        title="نظام إنشاء البوسترات التوعوية"
        subtitle="إنشاء بوسترات توعوية احترافية بسهولة"
        showLogo={true}
        logoSize="sm"
      />

      <PageContainer maxWidth="lg" className="py-8 md:py-12">
        {/* Enhanced Wizard Progress Steps */}
        <SectionCard className="mb-8 md:mb-12 shadow-lg border-2 border-emerald-100">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2 text-center md:text-right">
              خطوات إنشاء البوستر
            </h2>
            <p className="text-sm md:text-base text-gray-600 text-center md:text-right">
              اتبع الخطوات أدناه لإنشاء بوستر توعوي احترافي
            </p>
          </div>
          <div className="flex justify-between items-center relative py-4">
            {steps.map((step, index) => {
              const stepNumber = getCurrentStepNumber();
              const isActive = index + 1 <= stepNumber;
              const isCurrent = index + 1 === stepNumber;
              const isCompleted = index + 1 < stepNumber;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center relative z-10 flex-1">
                    <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg transition-all duration-300 shadow-lg ${
                        isCurrent
                          ? "bg-emerald-600 scale-110 ring-4 ring-emerald-200 ring-offset-2"
                          : isCompleted
                          ? "bg-emerald-500"
                          : "bg-gray-300"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <span className="text-xl md:text-2xl">{step.icon}</span>
                      ) : (
                        <span>{step.number}</span>
                      )}
                    </div>
                    <p
                      className={`text-xs md:text-sm mt-3 text-center max-w-[90px] md:max-w-[100px] font-medium ${
                        isCurrent
                          ? "text-emerald-700 font-bold"
                          : isActive
                          ? "text-emerald-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-2 mx-2 md:mx-4 transition-all duration-500 rounded-full ${
                        index + 1 < stepNumber
                          ? "bg-emerald-500 shadow-md"
                          : index + 1 === stepNumber
                          ? "bg-emerald-300"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </SectionCard>

        {/* Enhanced Success Message */}
        {exportComplete && (
          <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl flex items-center gap-4 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-base md:text-lg text-green-900 font-bold mb-1">تم تصدير البوستر بنجاح!</p>
              <p className="text-sm md:text-base text-green-700">يمكنك الآن مشاركة أو طباعة البوستر</p>
            </div>
          </div>
        )}

        {/* Main Content - Enhanced Visual Separation */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Left Column: Controls */}
          <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
            {currentStep === "select" && (
              <SectionCard className="shadow-lg border-2 border-emerald-50">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 text-center md:text-right">
                  اختر موضوع التوعية
                </h2>
                <PosterTemplateSelector
                  selectedTopic={selectedTopic}
                  onSelectTopic={handleSelectTopic}
                />
              </SectionCard>
            )}

            {currentStep === "edit" && selectedTopic && (
              <SectionCard className="shadow-lg border-2 border-emerald-50">
                <div className="mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">تعديل المحتوى</h2>
                  <p className="text-sm md:text-base text-gray-600">يمكنك تعديل العنوان والرسالة حسب احتياجك</p>
                </div>
                <PosterEditor
                  topic={selectedTopic}
                  customTitle={customTitle}
                  customMessage={customMessage}
                  onTitleChange={setCustomTitle}
                  onMessageChange={setCustomMessage}
                />
              </SectionCard>
            )}

            {currentStep === "preview" && selectedTopic && (
              <SectionCard className="shadow-lg border-2 border-emerald-50">
                <div className="mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">إجراءات التصدير</h2>
                  <p className="text-sm md:text-base text-gray-600">اختر صيغة التصدير المناسبة</p>
                </div>
                <PosterExportActions
                  posterRef={posterRef}
                  topicTitle={customTitle || selectedTopic.title}
                  onExportComplete={handleExportComplete}
                />
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <p className="text-sm md:text-base text-blue-900 font-medium">
                    💡 <span className="font-bold">PNG</span> مناسب للمشاركة على وسائل التواصل الاجتماعي. <span className="font-bold">PDF</span> مناسب للطباعة الرسمية.
                  </p>
                </div>
              </SectionCard>
            )}
          </div>

          {/* Right Column: Preview - Document Canvas */}
          <div className="lg:sticky lg:top-8 lg:self-start order-1 lg:order-2">
            {currentStep === "select" && (
              <SectionCard className="shadow-lg border-2 border-gray-200 min-h-[400px] md:min-h-[500px] flex items-center justify-center">
                <div className="text-center py-8 md:py-12">
                  <div className="text-6xl md:text-7xl mb-4 md:mb-6">📋</div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">اختر موضوعًا للبدء</h2>
                  <p className="text-sm md:text-base text-gray-600 max-w-xs mx-auto">اختر موضوع التوعية من القائمة أدناه لبدء إنشاء البوستر</p>
                </div>
              </SectionCard>
            )}

            {currentStep === "edit" && selectedTopic && (
              <SectionCard className="shadow-lg border-2 border-gray-200 min-h-[400px] md:min-h-[500px] flex items-center justify-center">
                <div className="text-center py-8 md:py-12">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 md:w-12 md:h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">ستظهر المعاينة قريبًا</h2>
                  <p className="text-sm md:text-base text-gray-600">عدّل المحتوى ثم اضغط "معاينة" لرؤية البوستر</p>
                </div>
              </SectionCard>
            )}

            {currentStep === "preview" && selectedTopic && (
              <div className="bg-slate-200 p-6 md:p-8 rounded-2xl shadow-2xl border-4 border-slate-300">
                <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6" style={{ boxShadow: "0 20px 60px -12px rgba(0, 0, 0, 0.25)" }}>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-200">
                    <h2 className="text-base md:text-lg font-bold text-gray-800">معاينة البوستر الرسمي</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>مستند رسمي</span>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-[500px] md:max-h-[700px] -mx-2 md:-mx-4">
                    <div className="p-2 md:p-4">
                      <PosterPreview
                        ref={posterRef}
                        topic={selectedTopic}
                        customTitle={customTitle}
                        customMessage={customMessage}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Navigation Buttons */}
        <SectionCard className="mt-8 md:mt-12 shadow-lg border-2 border-gray-100">
          <div className="flex justify-between items-center gap-4">
            {currentStep !== "select" && (
              <button
                onClick={handleBack}
                className="px-6 md:px-8 py-3 md:py-4 min-h-[48px] bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 focus:ring-4 focus:ring-gray-200 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-3 text-base md:text-lg"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                رجوع
              </button>
            )}

            {currentStep === "select" && (
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm md:text-base font-medium">اختر موضوعًا للبدء</span>
              </div>
            )}

            {currentStep === "edit" && (
              <button
                onClick={handleNext}
                className="ml-auto px-6 md:px-8 py-3 md:py-4 min-h-[48px] bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 focus:ring-4 focus:ring-emerald-200 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 text-base md:text-lg"
              >
                <span>معاينة</span>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
          </div>
        </SectionCard>

        {/* Poster History */}
        <div className="mt-6">
          <PosterHistory />
        </div>
      </PageContainer>

      {/* Enhanced Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-emerald-600 shadow-2xl p-4 md:hidden z-50 no-print safe-area-inset-bottom backdrop-blur-sm bg-white/95">
        {currentStep === "preview" && selectedTopic && (
          <div className="max-w-md mx-auto">
            <PosterExportActions
              posterRef={posterRef}
              topicTitle={customTitle || selectedTopic.title}
              onExportComplete={handleExportComplete}
            />
          </div>
        )}
        {currentStep !== "preview" && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700">
                {currentStep === "select" && "اختر موضوعًا للبدء"}
                {currentStep === "edit" && "عدّل المحتوى ثم اضغط معاينة"}
              </span>
            </div>
            <p className="text-xs text-gray-500">تابع الخطوات أعلاه</p>
          </div>
        )}
      </div>
    </main>
  );
}
