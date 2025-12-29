"use client";

import React from "react";
import { PosterTopic } from "./PosterTemplateSelector";

interface PosterEditorProps {
  topic: PosterTopic;
  customTitle?: string;
  customMessage?: string;
  onTitleChange: (title: string) => void;
  onMessageChange: (message: string) => void;
}

export default function PosterEditor({
  topic,
  customTitle,
  customMessage,
  onTitleChange,
  onMessageChange,
}: PosterEditorProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          عنوان البوستر
        </label>
        <input
          type="text"
          value={customTitle || topic.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all text-lg font-semibold"
          placeholder={topic.title}
        />
        <p className="text-xs text-gray-500 mt-1">يمكنك تعديل العنوان أو استخدام العنوان الافتراضي</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          الرسالة التوعوية
        </label>
        <textarea
          value={customMessage || topic.message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all resize-none"
          placeholder={topic.message}
        />
        <p className="text-xs text-gray-500 mt-1">يمكنك تعديل الرسالة أو استخدام الرسالة الافتراضية</p>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">نصيحة:</p>
            <p>استخدم لغة واضحة ومباشرة. الرسالة القصيرة والواضحة أكثر تأثيرًا.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

