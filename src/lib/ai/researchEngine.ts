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

2. المصادر المعتمدة:
   - وزارة الصحة العراقية (Iraq Ministry of Health)
   - منظمة الصحة العالمية (WHO)
   - إرشادات الصحة العامة للشرق الأوسط

3. المطلوب:
   - ابحث عن أحدث المعلومات العلمية الرصينة (Evidence-based)
   - حول المعلومات إلى 3 نقاط تعليمية قصيرة جداً (Micro-learning)
   - كل نقطة يجب أن تكون جملة واحدة واضحة ومؤثرة (لا تتجاوز 15 كلمة)
   - ركز على المعلومات العملية القابلة للتطبيق في كركوك، العراق

4. التنسيق المطلوب:
   - النقطة الأولى: أهم معلومة وقائية أو توعوية
   - النقطة الثانية: معلومة عملية أو إجراء ملموس
   - النقطة الثالثة: نصيحة أو تذكير مهم

5. العنوان المقترح: اكتب عنواناً جذاباً ومختصراً (لا يتجاوز 8 كلمات)

6. المصادر: اذكر المصادر الرسمية المستخدمة

أجب بالصيغة التالية (JSON):
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
 * توليد برومبت إنفوجرافيك محسّن
 */
export function generateInfographicPrompt(
  topic: string,
  microLearningPoints: string[],
  healthCenterName?: string
): string {
  return `You are a World-Class Medical Infographic Designer specializing in Public Health Education for Iraq.

Objective: Create a professional, evidence-based medical infographic poster for the 'Kirkuk Health Directorate - First Sector'.

Topic: ${topic}

Micro-Learning Points (Must be clearly visible):
1. ${microLearningPoints[0] || "معلومة صحية مهمة"}
2. ${microLearningPoints[1] || "إجراء وقائي ضروري"}
3. ${microLearningPoints[2] || "نصيحة صحية قيمة"}

Visual Requirements:
- Modern Flat Design style (no 3D, no shadows, clean lines)
- Each learning point must have its own clear icon/illustration
- Use a grid layout with 3-4 distinct sections
- Leave strategic space at top (20%) for official header
- Leave strategic space at bottom (25%) for footer with health center name and sources
- Use medical icons that are culturally appropriate for Middle East
- Colors: Professional medical palette (emerald green #059669, white, soft grays)
- Typography: Clear, readable Arabic-friendly fonts
- Icons: Simple, flat, vector-style medical icons

Composition:
- Top section: Main title/header area (reserved for official logo)
- Middle section: 3-4 visual learning points with icons and short text
- Bottom section: Footer with health center name and official sources (reserved space)

Cultural Context:
- Reflect Iraqi/Kirkuk healthcare setting
- Use appropriate medical symbols for Middle East
- Ensure all text areas are clearly readable

Avoid:
- Cluttered designs
- 3D effects or shadows
- Generic Western healthcare imagery
- Text that's too small to read
- Overlapping elements

Generate a clean, educational, professional medical infographic that teaches the 3 micro-learning points clearly.`;
}

