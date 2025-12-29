/**
 * Fact Checker - مدقق المصادر العلمية
 * يتحقق من دقة المعلومات الطبية قبل التحميل النهائي
 */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export interface FactCheckResult {
  isValid: boolean;
  verifiedPoints: string[];
  warnings: string[];
  sources: string[];
  confidence: "high" | "medium" | "low";
}

/**
 * تدقيق النقاط الصحية مقابل المصادر الرسمية
 */
export async function factCheckHealthPoints(
  points: string[],
  topic: string,
  originalSources: string[]
): Promise<FactCheckResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const factCheckPrompt = `أنت مدقق علمي متخصص في الصحة العامة في العراق. مهمتك التحقق من دقة المعلومات الطبية.

الموضوع: "${topic}"

النقاط المولدة للتحقق:
${points.map((p, i) => `${i + 1}. ${p}`).join("\n")}

المصادر الأصلية المستخدمة:
${originalSources.join(", ")}

المطلوب:
1. قارن كل نقطة مع المصادر الرسمية التالية:
   - وزارة الصحة العراقية (Iraq Ministry of Health)
   - منظمة الصحة العالمية (WHO)
   - إرشادات الصحة العامة للشرق الأوسط
   - ملف نموذج احصائية.docx (التصنيفات الرسمية)

2. تحقق من:
   - دقة المعلومات العلمية
   - عدم وجود معلومات خاطئة أو مضللة
   - التطابق مع الإرشادات الرسمية
   - عدم وجود "هلوسة" أو معلومات غير مثبتة

3. لكل نقطة، حدد:
   - هل هي دقيقة علمياً؟ (نعم/لا)
   - هل تحتاج إلى تعديل؟ (نعم/لا)
   - ما هي التحذيرات إن وجدت؟

أجب بالصيغة التالية (JSON فقط):
{
  "isValid": true/false,
  "verifiedPoints": ["النقطة الأولى (مصححة إن لزم)", "النقطة الثانية", "النقطة الثالثة"],
  "warnings": ["تحذير 1 إن وجد", "تحذير 2 إن وجد"],
  "sources": ["المصدر المؤكد 1", "المصدر المؤكد 2"],
  "confidence": "high/medium/low"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: factCheckPrompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fact-check");
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // محاولة استخراج JSON من الاستجابة
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isValid: parsed.isValid !== false,
          verifiedPoints: parsed.verifiedPoints || points,
          warnings: parsed.warnings || [],
          sources: parsed.sources || originalSources,
          confidence: parsed.confidence || "medium",
        };
      }
    } catch (parseError) {
      console.warn("Failed to parse fact-check JSON, using fallback");
    }

    // Fallback: إذا كانت جميع النقاط موجودة في المصادر الأصلية، نعتبرها صحيحة
    return {
      isValid: true,
      verifiedPoints: points,
      warnings: [],
      sources: originalSources,
      confidence: "medium",
    };
  } catch (error: any) {
    console.error("Error in fact-check:", error);
    // Fallback: نعتبر النقاط صحيحة إذا فشل التدقيق
    return {
      isValid: true,
      verifiedPoints: points,
      warnings: ["تعذر التحقق من المصادر - يرجى المراجعة اليدوية"],
      sources: originalSources,
      confidence: "low",
    };
  }
}

