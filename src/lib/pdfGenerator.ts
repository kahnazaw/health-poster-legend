import jsPDF from "jspdf";
import { logAudit } from "./audit";

interface ReportData {
  healthCenterName?: string; // Optional - can be empty
  month: string;
  year: number;
  statisticsData: any;
  approvedAt: string | null;
  approvedByName: string | null;
  userId?: string | null;
  reportId?: string | null;
}

export async function generateApprovedReportPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function to add text with RTL support
  const addText = (text: string, x: number, y: number, options?: any) => {
    const opts = options || {};
    doc.text(text, x, y, { ...opts, align: opts.align || "right" });
  };

  // Header - Logo and Title
  try {
    // You can add logo here if available
    // const logoData = await getLogoData();
    // doc.addImage(logoData, 'PNG', margin, yPos, 30, 20);
  } catch (e) {
    // Logo not available, continue without it
  }

  yPos += 10;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  addText("قطاع كركوك الأول", pageWidth - margin, yPos);
  yPos += 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  addText("المنصة الإدارية", pageWidth - margin, yPos);
  yPos += 6;
  doc.setFontSize(12);
  addText("وحدة تعزيز الصحة", pageWidth - margin, yPos);
  yPos += 10;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  addText("تقرير الإحصائيات الشهرية", pageWidth - margin, yPos);
  yPos += 10;

  // Report Details (health center name is optional)
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  // Note: health_center_name field has been removed from requirements
  addText(`الشهر: ${data.month}`, pageWidth - margin, yPos);
  yPos += 7;
  addText(`السنة: ${data.year}`, pageWidth - margin, yPos);
  yPos += 10;

  // Statistics Data Table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addText("البيانات الإحصائية:", pageWidth - margin, yPos);
  yPos += 7;

  // Check if we need a new page
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = margin;
  }

  // Display statistics data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (data.statisticsData && data.statisticsData.data) {
    const statsData = data.statisticsData.data;
    
    // If data is an array, display as table
    if (Array.isArray(statsData) && statsData.length > 0) {
      const tableStartY = yPos;
      const colWidth = (pageWidth - 2 * margin) / 4;
      let currentY = tableStartY;

      // Table header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.rect(margin, currentY - 5, pageWidth - 2 * margin, 7, "S");
      addText("البيان", pageWidth - margin - 5, currentY, { fontSize: 9 });
      addText("القيمة", pageWidth - margin - colWidth - 5, currentY, { fontSize: 9 });
      currentY += 7;

      // Table rows (limit to fit on page)
      doc.setFont("helvetica", "normal");
      const maxRows = Math.floor((pageHeight - currentY - 30) / 6);
      const displayRows = Math.min(statsData.length, maxRows);

      for (let i = 0; i < displayRows; i++) {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = margin;
        }

        const row = statsData[i];
        const rowText = typeof row === "object" ? JSON.stringify(row) : String(row);
        doc.rect(margin, currentY - 5, pageWidth - 2 * margin, 6, "S");
        addText(rowText.substring(0, 50), pageWidth - margin - 5, currentY, { fontSize: 8 });
        currentY += 6;
      }

      if (statsData.length > displayRows) {
        addText(`... و ${statsData.length - displayRows} صف إضافي`, pageWidth - margin, currentY, { fontSize: 8 });
        currentY += 6;
      }

      yPos = currentY;
    } else {
      // Display as JSON string if not array
      const dataStr = JSON.stringify(statsData, null, 2);
      const lines = doc.splitTextToSize(dataStr, pageWidth - 2 * margin);
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = margin;
        }
        addText(lines[i], pageWidth - margin, yPos, { fontSize: 8 });
        yPos += 5;
      }
    }
  } else {
    addText("لا توجد بيانات متاحة", pageWidth - margin, yPos, { fontSize: 10 });
    yPos += 7;
  }

  // Footer - Approval Information
  yPos = pageHeight - 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  addText("تم اعتماد هذا التقرير من قبل إدارة القطاع", pageWidth - margin, yPos);
  yPos += 7;

  if (data.approvedAt) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const approvedDate = new Date(data.approvedAt).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    addText(`تاريخ الاعتماد: ${approvedDate}`, pageWidth - margin, yPos);
    yPos += 6;
  }

  if (data.approvedByName) {
    addText(`اعتمد بواسطة: ${data.approvedByName}`, pageWidth - margin, yPos);
  }

  // Save PDF
  const centerName = data.healthCenterName || "عام";
  const fileName = `تقرير_${centerName}_${data.month}_${data.year}.pdf`;
  doc.save(fileName);

  // Log audit event for PDF generation
  if (data.userId && data.reportId) {
    await logAudit(data.userId, "pdf_generated", {
      targetType: "monthly_statistics",
      targetId: data.reportId,
      details: {
        month: data.month,
        year: data.year,
      },
    });
  }
}

