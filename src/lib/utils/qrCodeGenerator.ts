/**
 * QR Code Generator for Posters
 * مولد QR Code للبوسترات
 */
import QRCode from "qrcode";

const OFFICIAL_WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://health-poster-legend.vercel.app";

/**
 * توليد QR Code كـ Data URL
 */
export async function generateQRCodeDataUrl(
  url: string = OFFICIAL_WEBSITE_URL,
  options?: {
    width?: number;
    margin?: number;
    color?: { dark: string; light: string };
  }
): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: options?.width || 200,
      margin: options?.margin || 2,
      color: options?.color || {
        dark: "#059669", // اللون الأخضر الزمردي
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H", // أعلى مستوى تصحيح للأخطاء
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * توليد QR Code مع نص توجيهي
 */
export async function generateQRCodeWithText(
  url: string = OFFICIAL_WEBSITE_URL,
  text: string = "للمزيد من المعلومات"
): Promise<string> {
  // يمكن تطوير هذا لإنشاء QR Code مع نص تحته
  return generateQRCodeDataUrl(url);
}

