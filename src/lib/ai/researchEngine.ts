/**
 * Research Engine - محرك البحث والتلخيص الذكي
 * يبحث في المصادر الرسمية ويحول المعلومات إلى Micro-learning
 */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

interface ResearchResult {
  microLearningPoints: string[];
  summary: string;
  sources: string[];
  recommendedTitle: string;
}

/**
 * البحث والتلخيص باستخدام Gemini
 */
export async function researchHealthTopic(
  topic: string,
  healthCenterName?: string
): Promise<ResearchResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const researchPrompt = `أنت باحث طبي متخصص في الصحة العامة في العراق. مهمتك:

1. البحث عن المعلومات الرسمية حول الموضوع: "${topic}"

2. المصادر المعتمدة (ابحث في هذه المصادر بالترتيب):
   - ملف نموذج احصائية.docx (إذا كان متوفراً في قاعدة البيانات) - هذا هو المصدر الأساسي للتصنيفات الرسمية
   - وزارة الصحة العراقية (Iraq Ministry of Health) - أحدث الإرشادات والتوصيات
   - منظمة الصحة العالمية (WHO) - الإرشادات الدولية المحدثة
   - إرشادات الصحة العامة للشرق الأوسط - السياق الإقليمي

3. المطلوب (مهم جداً):
   - ابحث في نموذج احصائية.docx أولاً للعثور على التصنيفات الرسمية لقطاع كركوك
   - إذا كان الموضوع متعلقاً بالتحصين: استخرج النقاط من التصنيفات الرسمية (مثل: لقاح الأطفال، اللقاحات الروتينية، الحملات التلقيحية)
   - إذا كان الموضوع متعلقاً برعاية الحامل: استخرج من التصنيفات (مثل: فحص ما قبل الزواج، رعاية الحامل المعرضة للخطورة، متابعة الحمل)
   - إذا كان الموضوع متعلقاً بالأمراض غير الانتقالية: استخرج من التصنيفات (مثل: السكري، الضغط، أمراض القلب)
   - إذا كان الموضوع متعلقاً بالصحة النفسية: استخرج من التصنيفات الرسمية
   - حول المعلومات إلى 3 نقاط تعليمية قصيرة جداً (Micro-learning) - بالضبط 3 نقاط
   - كل نقطة يجب أن تكون جملة واحدة واضحة ومؤثرة (لا تتجاوز 12 كلمة)
   - استخدم لغة بسيطة وواضحة لعامة الناس
   - تأكد من أن النقاط تتطابق مع التصنيفات الرسمية في نموذج احصائية.docx

4. التنسيق المطلوب (بالضبط 3 نقاط):
   - النقطة الأولى: أهم معلومة وقائية أو توعوية من التصنيفات الرسمية
   - النقطة الثانية: معلومة عملية أو إجراء ملموس من التصنيفات الرسمية
   - النقطة الثالثة: نصيحة أو تذكير مهم من التصنيفات الرسمية

5. العنوان المقترح: اكتب عنواناً جذاباً ومختصراً (لا يتجاوز 6 كلمات)

6. المصادر: اذكر المصادر الرسمية المستخدمة بوضوح (ابدأ بـ "نموذج احصائية.docx" إذا كان متوفراً)

أجب بالصيغة التالية (JSON فقط، بدون نص إضافي):
{
  "microLearningPoints": ["النقطة الأولى", "النقطة الثانية", "النقطة الثالثة"],
  "summary": "ملخص قصير في جملة واحدة",
  "sources": ["المصدر الأول", "المصدر الثاني"],
  "recommendedTitle": "العنوان المقترح"
}`;

  try {
    // استخدام Gemini API للبحث والتلخيص
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
                  text: researchPrompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to research topic");
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // محاولة استخراج JSON من الاستجابة
    try {
      // البحث عن JSON في الاستجابة
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          microLearningPoints: parsed.microLearningPoints || [
            "معلومة صحية مهمة",
            "إجراء وقائي ضروري",
            "نصيحة صحية قيمة",
          ],
          summary: parsed.summary || "معلومات صحية معتمدة",
          sources: parsed.sources || ["وزارة الصحة العراقية", "منظمة الصحة العالمية"],
          recommendedTitle: parsed.recommendedTitle || topic,
        };
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON, using fallback");
    }

    // Fallback: استخراج المعلومات من النص
    const points = responseText
      .split("\n")
      .filter((line: string) => line.trim().length > 0 && line.trim().length < 100)
      .slice(0, 3)
      .map((line: string) => line.replace(/^[-•*]\s*/, "").trim());

    return {
      microLearningPoints: points.length >= 3 ? points : [
        "معلومة صحية مهمة",
        "إجراء وقائي ضروري",
        "نصيحة صحية قيمة",
      ],
      summary: responseText.substring(0, 150) || "معلومات صحية معتمدة",
      sources: ["وزارة الصحة العراقية", "منظمة الصحة العالمية"],
      recommendedTitle: topic.substring(0, 50),
    };
  } catch (error: any) {
    console.error("Error in research:", error);
    // Fallback data
    return {
      microLearningPoints: [
        "معلومة صحية مهمة حول " + topic,
        "إجراء وقائي ضروري",
        "نصيحة صحية قيمة",
      ],
      summary: "معلومات صحية معتمدة من المصادر الرسمية",
      sources: ["وزارة الصحة العراقية", "منظمة الصحة العالمية"],
      recommendedTitle: topic,
    };
  }
}

/**
 * توليد برومبت إنفوجرافيك محسّن - خلفية صامتة بدون نصوص
 */
export function generateInfographicPrompt(
  topic: string,
  layoutType: "timeline" | "grid" | "central",
  microLearningPoints: string[]
): string {
  const layoutDescriptions = {
    timeline: "a vertical timeline layout with 3-4 sequential steps, each with a clear icon and empty text box",
    grid: "a modern grid layout with 2 columns and 2 rows, each section with an icon and empty text box",
    central: "a central focus layout with one main section in the center and 2-3 supporting sections around it, each with icons and empty text boxes",
  };

  return `You are a World-Class Medical Infographic Background Designer specializing in Public Health Education for Iraq.

CRITICAL: Generate ONLY a SILENT BACKGROUND with NO TEXT. Text will be added programmatically later.

Objective: Create a professional, evidence-based medical infographic BACKGROUND for the 'Kirkuk Health Directorate - First Sector'.

Topic: ${topic}

Layout Type: ${layoutDescriptions[layoutType]}

Visual Requirements:
- Modern Flat Design style (no 3D, no shadows, clean lines)
- SILENT BACKGROUND: Only icons, shapes, and empty organized boxes (3-4 sections)
- NO TEXT in the image - leave empty text boxes/areas for programmatic text overlay
- Use medical icons that are culturally appropriate for Middle East
- Colors: Professional medical palette (emerald green #059669, white, soft grays, light blues)
- Icons: Simple, flat, vector-style medical icons
- Background: Clean, light background (white or very light gray)

Composition Structure:
- Top 20%: Empty header area (reserved for official logo and title - will be added programmatically)
- Middle 60%: ${layoutType === "timeline" ? "Vertical timeline with 3-4 empty text boxes and icons" : layoutType === "grid" ? "Grid layout with 3-4 empty text boxes and icons" : "Central focus with main empty box in center and 2-3 supporting empty boxes around it"}
- Bottom 20%: Empty footer area (reserved for health center name and sources - will be added programmatically)

Each section must have:
- A clear medical icon/illustration
- An empty text box/area (rectangular or rounded) ready for text overlay
- Proper spacing and organization

Cultural Context:
- Reflect Iraqi/Kirkuk healthcare setting
- Use appropriate medical symbols for Middle East

CRITICAL RULES:
- DO NOT include any Arabic text in the image
- DO NOT write any words or sentences
- ONLY create empty text boxes and icons
- Leave clear spaces for text overlay
- Make it look professional and organized

Generate a clean, silent, professional medical infographic background with organized empty text boxes and medical icons.`;
}

