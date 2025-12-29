"use client";

import React from "react";

export interface PosterTopic {
  id: string;
  title: string;
  message: string;
  icon: string;
  category: "hygiene" | "nutrition" | "exercise" | "mental" | "prevention" | "general";
}

export const posterTopics: PosterTopic[] = [
  {
    id: "hand-washing",
    title: "غسل اليدين",
    message: "غسل اليدين بالماء والصابون لمدة 20 ثانية يقي من العديد من الأمراض المعدية ويحافظ على صحتك وصحة من حولك.",
    icon: "🧼",
    category: "hygiene",
  },
  {
    id: "healthy-nutrition",
    title: "التغذية الصحية",
    message: "اتباع نظام غذائي متوازن غني بالخضروات والفواكه يعزز المناعة ويساهم في الوقاية من الأمراض المزمنة.",
    icon: "🥗",
    category: "nutrition",
  },
  {
    id: "physical-activity",
    title: "النشاط البدني",
    message: "ممارسة النشاط البدني لمدة 30 دقيقة يوميًا تساعد على تحسين صحة القلب والجسم.",
    icon: "🏃",
    category: "exercise",
  },
  {
    id: "mental-health",
    title: "الصحة النفسية",
    message: "الاهتمام بالصحة النفسية لا يقل أهمية عن الصحة الجسدية، وطلب المساعدة عند الحاجة قوة وليس ضعفًا.",
    icon: "🧠",
    category: "mental",
  },
  {
    id: "vaccination",
    title: "التطعيم",
    message: "التطعيمات تحميك وتحافظ على صحة المجتمع. تأكد من الحصول على جميع التطعيمات الموصى بها.",
    icon: "💉",
    category: "prevention",
  },
  {
    id: "sleep",
    title: "النوم الصحي",
    message: "الحصول على 7-9 ساعات من النوم يوميًا يحسن الصحة العامة والمناعة والتركيز.",
    icon: "😴",
    category: "general",
  },
];

interface PosterTemplateSelectorProps {
  selectedTopic: PosterTopic | null;
  onSelectTopic: (topic: PosterTopic) => void;
}

export default function PosterTemplateSelector({
  selectedTopic,
  onSelectTopic,
}: PosterTemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">اختر موضوع التوعية</h2>
        <p className="text-gray-600">اختر الموضوع الذي تريد إنشاء بوستر توعوي عنه</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posterTopics.map((topic) => {
          const isSelected = selectedTopic?.id === topic.id;
          return (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-right active:scale-[0.98] ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">{topic.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{topic.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{topic.message}</p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

