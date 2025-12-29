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
        className="bg-white mx-auto print-avoid-break"
        style={{
          width: "794px",
          maxWidth: "100%",
          minHeight: "1123px",
          padding: "80px 60px",
          position: "relative",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.15), 0 8px 40px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
        }}
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
        <div className="text-center mb-12" style={{ minHeight: "400px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="text-7xl mb-8" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>
            {topic.icon}
          </div>
          <h1
            className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-8 leading-tight"
            style={{ 
              lineHeight: "1.2",
              textShadow: "0 2px 4px rgba(0,0,0,0.05)",
              letterSpacing: "-0.02em"
            }}
          >
            {title}
          </h1>
          <div className="max-w-2xl mx-auto">
            <p
              className="text-2xl md:text-3xl text-gray-800 leading-relaxed font-medium"
              style={{ 
                lineHeight: "1.75",
                letterSpacing: "0.01em"
              }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Footer - Enhanced Official Look */}
        <div
          className="absolute bottom-0 left-0 right-0 text-center py-8 border-t-4 border-gray-300 bg-gray-50"
          style={{ paddingLeft: "60px", paddingRight: "60px" }}
        >
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

