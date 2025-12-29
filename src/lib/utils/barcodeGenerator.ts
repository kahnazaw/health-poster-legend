/**
 * Barcode Generator - مولد الباركود للميتاداتا
 * يولد باركود صغير يحتوي على معلومات الأرشفة
 */

import type jsPDF from "jspdf";

/**
 * توليد باركود نصي بسيط (يمكن استبداله بمكتبة باركود لاحقاً)
 */
export function generateMetadataBarcode(
  pdf: any, // jsPDF instance
  metadata: {
    generatedAt: string;
    healthCenterName: string;
    topic: string;
    userId?: string;
  }
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // إنشاء نص الباركود
  const barcodeText = `KIRKUK-${metadata.healthCenterName.substring(0, 10)}-${new Date(metadata.generatedAt).getTime()}`;
  
  // إضافة الباركود في الحاشية السفلية (أسفل الصفحة)
  const barcodeY = pageHeight - 8; // 8mm من الأسفل
  const barcodeX = pageWidth - 40; // 40mm من اليمين
  
  // رسم خطوط الباركود البسيط (نمط Code 39 مبسط)
  pdf.setFontSize(6);
  pdf.setTextColor(100, 100, 100);
  
  // رسم الخطوط (نمط بسيط)
  let xPos = barcodeX;
  for (let i = 0; i < barcodeText.length; i++) {
    const char = barcodeText[i];
    const code = char.charCodeAt(0);
    const barWidth = (code % 3) + 0.5; // عرض متغير
    
    pdf.setFillColor(0, 0, 0);
    pdf.rect(xPos, barcodeY, barWidth, 3, "F");
    xPos += barWidth + 0.3;
  }
  
  // إضافة النص أسفل الباركود
  pdf.setFontSize(5);
  pdf.text(
    `${metadata.healthCenterName} | ${new Date(metadata.generatedAt).toLocaleDateString("ar")}`,
    barcodeX,
    barcodeY + 5,
    { align: "right", maxWidth: 35 }
  );
  
  // إضافة رمز صغير في الزاوية
  pdf.setFontSize(4);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `ID: ${barcodeText.substring(0, 15)}`,
    pageWidth - 2,
    pageHeight - 2,
    { align: "right" }
  );
}

