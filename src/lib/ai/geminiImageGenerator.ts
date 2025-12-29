/**
 * Gemini AI Image Generation Service
 * خدمة توليد الصور بالذكاء الاصطناعي لاستوديو البوسترات
 */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict";

interface GenerationOptions {
  campaignType: string;
  targetAudience: string;
  visualStyle: string;
  language?: "ar" | "tr";
  suggestedTitle?: string;
}

/**
 * System Prompt للذكاء الاصطناعي - محدث لإنفوجرافيك
 */
const SYSTEM_PROMPT = `You are a World-Class Medical Infographic Designer specializing in Public Health Education for Iraq.

Objective: Create a professional, evidence-based medical infographic poster for the 'Kirkuk Health Directorate - First Sector'.

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

Avoid: Cluttered designs, 3D effects, generic Western healthcare imagery, text that's too small to read, overlapping elements.`;

/**
 * توليد برومبت تفصيلي بناءً على اختيارات المستخدم
 */
export function generateDetailedPrompt(options: GenerationOptions): string {
  const { campaignType, targetAudience, visualStyle, language = "ar" } = options;

  // ترجمة الخيارات إلى وصف تفصيلي
  const campaignDescriptions: Record<string, string> = {
    vaccination: "حملة تلقيح شاملة في مراكز صحية حديثة",
    health_awareness: "توعية صحية شاملة للمجتمع",
    administrative: "إعلان إداري رسمي من دائرة الصحة",
    prevention: "الوقاية من الأمراض المعدية والمزمنة",
    nutrition: "التغذية الصحية المتوازنة",
    maternal_health: "صحة الأم والطفل في مراكز الرعاية الصحية",
  };

  const audienceDescriptions: Record<string, string> = {
    children: "موجه للأطفال مع ألوان جذابة وآمنة",
    elderly: "موجه لكبار السن مع خطوط واضحة وكبيرة",
    medical_staff: "موجه للطاقم الطبي مع معلومات تقنية دقيقة",
    general_public: "موجه لعامة الناس مع لغة بسيطة وواضحة",
    women: "موجه للنساء مع عناصر ثقافية محلية",
    youth: "موجه للشباب مع تصميم عصري وجذاب",
  };

  const styleDescriptions: Record<string, string> = {
    official_trusted: "Use cinematic lighting, soft focus backgrounds, and high-quality photography style. Professional and trustworthy appearance.",
    friendly_cartoon: "Use vibrant, safe, and warm colors suitable for maternal and child health centers. Friendly cartoon style with rounded shapes.",
    modern_infographic: "Use clean vector lines, 3D medical icons, and a minimalist layout. Modern infographic style with data visualization elements.",
    minimalist: "Simple and elegant design with plenty of white space. Clean lines and minimal elements.",
    vibrant: "Colorful and attractive design with bold colors and dynamic composition.",
  };

  const campaignDesc = campaignDescriptions[campaignType] || campaignType;
  const audienceDesc = audienceDescriptions[targetAudience] || targetAudience;
  const styleDesc = styleDescriptions[visualStyle] || visualStyle;

  const languageNote = language === "tr" 
    ? "Include Turkish/Turkmen text elements and cultural references." 
    : "Use Arabic text elements and cultural references.";

  return `${SYSTEM_PROMPT}

Specific Requirements:
- Campaign Type: ${campaignDesc}
- Target Audience: ${audienceDesc}
- Visual Style: ${styleDesc}
- Language Context: ${languageNote}

Generate a professional medical poster background that is culturally appropriate for Kirkuk, Iraq, with strategic negative space for official overlays.`;
}

/**
 * توليد عنوان جذاب تلقائياً
 */
export function generateSuggestedTitle(options: GenerationOptions): string {
  const { campaignType, targetAudience } = options;

  const titles: Record<string, Record<string, string>> = {
    vaccination: {
      children: "حماية أطفالنا... مستقبلنا المشرق",
      general_public: "التلقيح: درعك الواقي ضد الأمراض",
      elderly: "التلقيح لكبار السن: صحة أفضل وحياة أطول",
      women: "حماية صحتك وصحة عائلتك بالتلقيح",
      youth: "كن ذكياً... احمِ نفسك بالتلقيح",
      medical_staff: "التلقيح: ركيزة الصحة العامة",
    },
    health_awareness: {
      children: "صحة طفلك... أولويتنا",
      general_public: "صحتك تهمنا... اعتنِ بنفسك",
      elderly: "رعاية صحية شاملة لكبار السن",
      women: "صحة المرأة... صحة المجتمع",
      youth: "صحتك... مستقبلك",
      medical_staff: "التوعية الصحية: رسالتنا",
    },
    prevention: {
      children: "الوقاية خير من العلاج",
      general_public: "احمِ نفسك وعائلتك",
      elderly: "الوقاية من الأمراض: دليل كبار السن",
      women: "صحة المرأة: الوقاية أولاً",
      youth: "كن واعياً... احمِ صحتك",
      medical_staff: "الوقاية: أساس الرعاية الصحية",
    },
    nutrition: {
      children: "غذاء صحي... طفل سعيد",
      general_public: "التغذية الصحية: مفتاح الصحة",
      elderly: "تغذية صحية لكبار السن",
      women: "تغذية صحية للمرأة",
      youth: "غذاؤك... طاقتك",
      medical_staff: "التغذية الصحية: علم وممارسة",
    },
    maternal_health: {
      children: "صحة الأم والطفل: رعاية متكاملة",
      general_public: "صحة الأم والطفل: أولويتنا",
      elderly: "رعاية صحية شاملة",
      women: "صحة المرأة والطفل: رعاية متميزة",
      youth: "صحة الأم والطفل: استثمار في المستقبل",
      medical_staff: "رعاية صحية متكاملة للأم والطفل",
    },
    administrative: {
      children: "إعلان رسمي من دائرة صحة كركوك",
      general_public: "إعلان إداري من قطاع كركوك الأول",
      elderly: "إعلان رسمي: خدمات صحية لكبار السن",
      women: "إعلان رسمي: خدمات صحية للمرأة",
      youth: "إعلان رسمي: خدمات صحية للشباب",
      medical_staff: "إعلان إداري للطاقم الطبي",
    },
  };

  return titles[campaignType]?.[targetAudience] || "رسالة صحية من قطاع كركوك الأول";
}

/**
 * استدعاء Gemini API لتوليد الصورة
 */
export async function generateImageWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in environment variables.");
  }

  try {
    // استخدام Gemini Imagen API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        numImages: 1,
        aspectRatio: "3:4", // نسبة البوستر
        safetyFilterLevel: "block_some",
        personGeneration: "allow_all",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    
    // استخراج URL الصورة من الاستجابة
    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }

    throw new Error("No image generated from Gemini API");
  } catch (error: any) {
    console.error("Error generating image with Gemini:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

