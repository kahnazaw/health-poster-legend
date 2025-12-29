/**
 * Text Overlay Engine - محرك رسم النصوص العربية برمجياً
 * يستخدم Canvas API لرسم النصوص بالخطوط العربية فوق الصورة
 */

interface TextBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  textAlign: "center" | "right" | "left";
}

interface LayoutConfig {
  type: "timeline" | "grid" | "central";
  points: string[];
  title: string;
  healthCenterName?: string;
}

/**
 * رسم النصوص على Canvas
 */
export function drawTextOnCanvas(
  canvas: HTMLCanvasElement,
  textBoxes: TextBox[]
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  textBoxes.forEach((box) => {
    // رسم الخلفية (فقاعة/صندوق)
    ctx.fillStyle = box.backgroundColor;
    ctx.beginPath();
    // استخدام roundRect إذا كان متوفراً، وإلا استخدام path يدوياً
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(box.x, box.y, box.width, box.height, box.borderRadius);
    } else {
      // Fallback: رسم مستطيل دائري يدوياً
      const r = box.borderRadius;
      ctx.moveTo(box.x + r, box.y);
      ctx.lineTo(box.x + box.width - r, box.y);
      ctx.quadraticCurveTo(box.x + box.width, box.y, box.x + box.width, box.y + r);
      ctx.lineTo(box.x + box.width, box.y + box.height - r);
      ctx.quadraticCurveTo(box.x + box.width, box.y + box.height, box.x + box.width - r, box.y + box.height);
      ctx.lineTo(box.x + r, box.y + box.height);
      ctx.quadraticCurveTo(box.x, box.y + box.height, box.x, box.y + box.height - r);
      ctx.lineTo(box.x, box.y + r);
      ctx.quadraticCurveTo(box.x, box.y, box.x + r, box.y);
      ctx.closePath();
    }
    ctx.fill();

    // رسم النص
    ctx.fillStyle = box.color;
    ctx.font = `${box.fontSize}px ${box.fontFamily}`;
    ctx.textAlign = box.textAlign;
    ctx.textBaseline = "middle";

    // تقسيم النص على عدة أسطر إذا لزم الأمر
    const words = box.text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > box.width - box.padding * 2 && currentLine !== "") {
        lines.push(currentLine);
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine.trim());

    // رسم الأسطر
    const lineHeight = box.fontSize * 1.2;
    const startY = box.y + box.height / 2 - (lines.length - 1) * lineHeight / 2;

    lines.forEach((line, index) => {
      ctx.fillText(
        line,
        box.x + box.width / 2,
        startY + index * lineHeight
      );
    });
  });
}

/**
 * توليد مواضع النصوص حسب نوع التخطيط
 */
export function generateLayoutPositions(
  config: LayoutConfig,
  canvasWidth: number,
  canvasHeight: number
): TextBox[] {
  const boxes: TextBox[] = [];
  const padding = 40;
  const headerHeight = 120;
  const footerHeight = 100;
  const contentHeight = canvasHeight - headerHeight - footerHeight;
  const contentY = headerHeight;

  // العنوان الرئيسي
  boxes.push({
    text: config.title,
    x: padding,
    y: 20,
    width: canvasWidth - padding * 2,
    height: 80,
    fontSize: 36,
    fontFamily: "Tajawal, Arial",
    color: "#ffffff",
    backgroundColor: "rgba(5, 150, 105, 0.9)",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
  });

  if (config.type === "timeline") {
    // تخطيط المسار الزمني
    const pointHeight = contentHeight / config.points.length;
    config.points.forEach((point, index) => {
      boxes.push({
        text: `${index + 1}. ${point}`,
        x: padding + 60,
        y: contentY + index * pointHeight + 20,
        width: canvasWidth - padding * 2 - 60,
        height: pointHeight - 40,
        fontSize: 24,
        fontFamily: "Tajawal, Arial",
        color: "#1f2937",
        backgroundColor: index % 2 === 0 ? "rgba(209, 250, 229, 0.8)" : "rgba(255, 255, 255, 0.9)",
        borderRadius: 12,
        padding: 16,
        textAlign: "right",
      });
    });
  } else if (config.type === "grid") {
    // تخطيط الشبكة الحديثة
    const cols = 2;
    const rows = Math.ceil(config.points.length / cols);
    const boxWidth = (canvasWidth - padding * 3) / cols;
    const boxHeight = (contentHeight - padding * (rows + 1)) / rows;

    config.points.forEach((point, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      boxes.push({
        text: point,
        x: padding + col * (boxWidth + padding),
        y: contentY + row * (boxHeight + padding) + padding,
        width: boxWidth,
        height: boxHeight - padding,
        fontSize: 20,
        fontFamily: "Tajawal, Arial",
        color: "#1f2937",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 16,
        padding: 20,
        textAlign: "center",
      });
    });
  } else {
    // تخطيط التركيز المركزي
    const centerY = contentY + contentHeight / 2;
    const mainPoint = config.points[0] || "";
    const otherPoints = config.points.slice(1);

    // النقطة الرئيسية في الوسط
    boxes.push({
      text: mainPoint,
      x: padding,
      y: centerY - 100,
      width: canvasWidth - padding * 2,
      height: 150,
      fontSize: 32,
      fontFamily: "Tajawal, Arial",
      color: "#ffffff",
      backgroundColor: "rgba(5, 150, 105, 0.9)",
      borderRadius: 20,
      padding: 24,
      textAlign: "center",
    });

    // النقاط الأخرى حول المركز
    otherPoints.forEach((point, index) => {
      const angle = (index * 2 * Math.PI) / otherPoints.length;
      const radius = 180;
      const x = canvasWidth / 2 + Math.cos(angle) * radius - 120;
      const y = centerY + Math.sin(angle) * radius - 60;

      boxes.push({
        text: point,
        x: x,
        y: y,
        width: 240,
        height: 120,
        fontSize: 18,
        fontFamily: "Tajawal, Arial",
        color: "#1f2937",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 16,
        padding: 16,
        textAlign: "center",
      });
    });
  }

  // اسم المركز في التذييل
  if (config.healthCenterName) {
    boxes.push({
      text: `تم توليد هذا المحتوى التوعوي بواسطة: ${config.healthCenterName}`,
      x: padding,
      y: canvasHeight - footerHeight + 20,
      width: canvasWidth - padding * 2,
      height: 30,
      fontSize: 14,
      fontFamily: "Tajawal, Arial",
      color: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0)",
      borderRadius: 0,
      padding: 0,
      textAlign: "center",
    });
  }

  return boxes;
}

/**
 * دمج الصورة مع النصوص
 */
export async function mergeImageWithText(
  imageUrl: string,
  layoutConfig: LayoutConfig,
  pointStyle: "numbered" | "bulleted" | "iconic" = "numbered"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // رسم الصورة
      ctx.drawImage(img, 0, 0);

      // توليد مواضع النصوص
      const textBoxes = generateLayoutPositions(
        layoutConfig,
        canvas.width,
        canvas.height
      );

      // تطبيق نمط النقاط
      const styledPoints = layoutConfig.points.map((point, index) => {
        if (pointStyle === "numbered") {
          return `${index + 1}. ${point}`;
        } else if (pointStyle === "bulleted") {
          return `• ${point}`;
        } else {
          return `✓ ${point}`;
        }
      });

      const styledConfig = { ...layoutConfig, points: styledPoints };
      const styledBoxes = generateLayoutPositions(
        styledConfig,
        canvas.width,
        canvas.height
      );

      // رسم النصوص
      drawTextOnCanvas(canvas, styledBoxes);

      // تحويل إلى Data URL
      resolve(canvas.toDataURL("image/png", 1.0));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

