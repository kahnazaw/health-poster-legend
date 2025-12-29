"use client";

import React, { forwardRef } from "react";
import { PosterTopic } from "./PosterTemplateSelector";

interface PosterPreviewProps {
  topic: PosterTopic;
  customTitle?: string;
  customMessage?: string;
}

const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  ({ topic, customTitle, customMessage }, ref) => {
    const title = customTitle || topic.title;
    const message = customMessage || topic.message;

    return (
      <div
        ref={ref}
        className="bg-white mx-auto print-avoid-break w-[794px] max-w-full min-h-[1123px] py-20 px-[60px] relative border border-gray-200 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_4px_20px_rgba(0,0,0,0.15),0_8px_40px_rgba(0,0,0,0.1)]"
      >
        {/* Official Header - Enhanced Institutional Look */}
        <div className="mb-12 pb-8 border-b-4 border-emerald-600">
          <div className="flex items-center justify-center gap-5 mb-5">
            <div className="p-3 bg-emerald-50 rounded-full">
              <img
                src="/logo.png"
                alt="شعار دائرة صحة كركوك"
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              دائرة صحة كركوك
            </h3>
            <div className="w-24 h-1 bg-emerald-600 mx-auto mb-3"></div>
            <p className="text-base font-semibold text-gray-700 mb-1">
              قطاع كركوك الأول
            </p>
            <p className="text-sm text-gray-600">
              وحدة تعزيز الصحة
            </p>
          </div>
        </div>

        {/* Main Content - Enhanced Typography */}
        <div className="text-center mb-12 min-h-[400px] flex flex-col justify-center">
          <div className="text-7xl mb-8 drop-shadow-sm">
            {topic.icon}
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight drop-shadow-sm">
            {title}
          </h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-2xl md:text-3xl text-gray-800 leading-relaxed font-medium tracking-wide">
              {message}
            </p>
          </div>
        </div>

        {/* Footer - Enhanced Official Look */}
        <div className="absolute bottom-0 left-0 right-0 text-center py-8 border-t-4 border-gray-300 bg-gray-50 px-[60px]">
          <div className="mb-3">
            <p className="text-sm font-bold text-gray-800 mb-1">
              دائرة صحة كركوك – قطاع كركوك الأول – وحدة تعزيز الصحة
            </p>
            <div className="w-32 h-0.5 bg-emerald-600 mx-auto mb-2"></div>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            للمزيد من المعلومات، يرجى زيارة أقرب مركز صحي
          </p>
          <p className="text-xs text-gray-500 mt-2">
            مستند رسمي – للاستخدام التوعوي
          </p>
        </div>
      </div>
    );
  }
);

PosterPreview.displayName = "PosterPreview";

export default PosterPreview;

