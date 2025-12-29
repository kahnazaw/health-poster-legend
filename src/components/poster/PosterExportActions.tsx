"use client";

import React, { useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PosterExportActionsProps {
  posterRef: React.RefObject<HTMLDivElement | null>;
  topicTitle: string;
  onExportComplete?: () => void;
}

export default function PosterExportActions({
  posterRef,
  topicTitle,
  onExportComplete,
}: PosterExportActionsProps) {
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);

  const handleExportPNG = async () => {
    if (!posterRef.current) return;

    setExporting("png");
    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 3, // High resolution
        quality: 1,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `بوستر_${topicTitle}_${Date.now()}.png`;
      link.click();

      // Save to history
      saveToHistory({
        title: topicTitle,
        type: "png",
        dataUrl,
        timestamp: new Date().toISOString(),
      });

      onExportComplete?.();
    } catch (error) {
      console.error("Error exporting PNG:", error);
      alert("حدث خطأ أثناء تصدير الصورة. يرجى المحاولة مرة أخرى.");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!posterRef.current) return;

    setExporting("pdf");
    try {
      const canvas = await html2canvas(posterRef.current, {
        useCORS: true,
        background: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Center the image
      const xOffset = 0;
      const yOffset = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`بوستر_${topicTitle}_${Date.now()}.pdf`);

      // Save to history
      saveToHistory({
        title: topicTitle,
        type: "pdf",
        dataUrl: imgData,
        timestamp: new Date().toISOString(),
      });

      onExportComplete?.();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("حدث خطأ أثناء تصدير PDF. يرجى المحاولة مرة أخرى.");
    } finally {
      setExporting(null);
    }
  };

  const saveToHistory = (poster: {
    title: string;
    type: "png" | "pdf";
    dataUrl: string;
    timestamp: string;
  }) => {
    try {
      const history = getPosterHistory();
      history.unshift(poster);
      // Keep only last 20 posters
      const limitedHistory = history.slice(0, 20);
      localStorage.setItem("poster-history", JSON.stringify(limitedHistory));
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
      <button
        onClick={handleExportPNG}
        disabled={exporting !== null}
        className="flex-1 px-4 md:px-6 py-2.5 md:py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
      >
        {exporting === "png" ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>جاري التصدير...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>تحميل PNG</span>
          </>
        )}
      </button>

      <button
        onClick={handleExportPDF}
        disabled={exporting !== null}
        className="flex-1 px-4 md:px-6 py-2.5 md:py-3 min-h-[44px] bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
      >
        {exporting === "pdf" ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>جاري التصدير...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>تحميل PDF</span>
          </>
        )}
      </button>
    </div>
  );
}

export function getPosterHistory() {
  try {
    const history = localStorage.getItem("poster-history");
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error reading poster history:", error);
    return [];
  }
}

