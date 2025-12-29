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
        className="bg-white rounded-xl shadow-2xl border-4 border-emerald-600 mx-auto print-avoid-break"
        style={{
          width: "794px",
          maxWidth: "100%",
          minHeight: "1123px",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Official Header */}
        <div className="mb-8 pb-6 border-b-2 border-emerald-200">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src="/logo.png"
              alt="شعار دائرة صحة كركوك"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h3 className="text-center text-lg font-bold text-gray-700">
            دائرة صحة كركوك
          </h3>
          <p className="text-center text-sm text-gray-600">
            قطاع كركوك الأول - وحدة تعزيز الصحة
          </p>
        </div>

        {/* Main Content */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-6">{topic.icon}</div>
          <h1
            className="text-5xl font-bold text-gray-900 mb-6"
            style={{ lineHeight: "1.3" }}
          >
            {title}
          </h1>
          <p
            className="text-2xl text-gray-700 leading-relaxed"
            style={{ lineHeight: "1.8" }}
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div
          className="absolute bottom-0 left-0 right-0 text-center py-6 border-t-2 border-gray-200"
          style={{ paddingLeft: "60px", paddingRight: "60px" }}
        >
          <p className="text-sm text-gray-600 mb-2">
            دائرة صحة كركوك – قطاع كركوك الأول – وحدة تعزيز الصحة
          </p>
          <p className="text-xs text-gray-500">
            للمزيد من المعلومات، يرجى زيارة أقرب مركز صحي
          </p>
        </div>
      </div>
    );
  }
);

PosterPreview.displayName = "PosterPreview";

export default PosterPreview;

