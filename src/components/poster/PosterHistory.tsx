"use client";

import React, { useState, useEffect } from "react";
import { getPosterHistory } from "./PosterExportActions";

interface PosterHistoryItem {
  title: string;
  type: "png" | "pdf";
  dataUrl: string;
  timestamp: string;
}

export default function PosterHistory() {
  const [history, setHistory] = useState<PosterHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = getPosterHistory();
    setHistory(savedHistory);
  };

  const handleDownload = (item: PosterHistoryItem) => {
    const link = document.createElement("a");
    link.href = item.dataUrl;
    link.download = `بوستر_${item.title}_${new Date(item.timestamp).getTime()}.${item.type}`;
    link.click();
  };

  const handleClearHistory = () => {
    if (confirm("هل أنت متأكد من حذف جميع البوسترات المحفوظة؟")) {
      localStorage.removeItem("poster-history");
      setHistory([]);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-800">البوسترات المحفوظة</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showHistory ? "إخفاء" : "عرض"}
          </button>
          {showHistory && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              حذف الكل
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item, index) => (
            <div
              key={index}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleDateString("ar-IQ")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                  {item.type.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => handleDownload(item)}
                className="w-full mt-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                تحميل
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

