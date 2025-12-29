/**
 * Admin Bot - المساعد الإداري الذكي
 * يرد على استفسارات الموظفين بناءً على قاعدة معرفة رسمية
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

interface BotResponse {
  response: string;
  confidence: "high" | "medium" | "low";
  requiresHuman: boolean;
  suggestedAction?: string;
}

/**
 * قاعدة المعرفة الرسمية
 */
const KNOWLEDGE_BASE = {
  statistics: {
    categories: [
      "رعاية الأم والطفل",
      "التحصين",
      "الأمراض الانتقالية",
      "الأمراض غير الانتقالية",
      "الصحة النفسية",
      "التغذية",
      "النظافة والصحة البيئية",
    ],
    topics: [
      { name: "فحص ما قبل الزواج", category: "رعاية الأم والطفل" },
      { name: "رعاية الحامل المعرضة للخطورة", category: "رعاية الأم والطفل" },
      { name: "متابعة الحمل", category: "رعاية الأم والطفل" },
      { name: "لقاح الأطفال الروتيني", category: "التحصين" },
      { name: "الحملات التلقيحية", category: "التحصين" },
      { name: "الأنفلونزا الوبائية", category: "الأمراض الانتقالية" },
      { name: "الكوليرا", category: "الأمراض الانتقالية" },
      { name: "السكري", category: "الأمراض غير الانتقالية" },
      { name: "ارتفاع ضغط الدم", category: "الأمراض غير الانتقالية" },
      { name: "الصحة النفسية للشباب", category: "الصحة النفسية" },
      { name: "الصحة النفسية للمرأة", category: "الصحة النفسية" },
    ],
    entryTypes: {
      individual_meetings: "اللقاءات الفردية",
      lectures: "المحاضرات",
      seminars: "الندوات",
    },
  },
  deadlines: {
    weekly: "يتم تسليم التقرير الأسبوعي كل خميس",
    monthly: "يتم تسليم التقرير الشهري في آخر يوم من الشهر",
    daily: "يمكن إدخال البيانات اليومية في أي وقت",
  },
  posterStudio: {
    usage: "استخدم حقل 'المناسبة الصحية أو الموضوع' لكتابة الموضوع، وسيقوم الذكاء الاصطناعي بالبحث في المصادر الرسمية وتوليد إنفوجرافيك احترافي",
    features: [
      "اقتراحات تلقائية بناءً على الموسم والنشاط",
      "تدقيق المصادر العلمية",
      "تصدير بدقة عالية للطباعة",
      "مشاركة مباشرة في الدردشة",
    ],
  },
  contact: {
    admin: "للاستفسارات الإدارية المعقدة، يرجى التواصل مع مدير القطاع",
    technical: "للمشاكل التقنية، يرجى التواصل مع الدعم الفني",
  },
};

/**
 * تحليل نية المستخدم
 */
function analyzeIntent(message: string): {
  intent: "statistics" | "deadline" | "poster" | "general" | "unknown";
  keywords: string[];
} {
  const lowerMessage = message.toLowerCase();
  const keywords: string[] = [];

  // كلمات مفتاحية للإحصائيات
  const statsKeywords = [
    "إحصائية",
    "تسجيل",
    "ندوة",
    "محاضرة",
    "لقاء",
    "موضوع",
    "تصنيف",
    "أين",
    "كيف",
  ];
  if (statsKeywords.some((kw) => lowerMessage.includes(kw))) {
    keywords.push(...statsKeywords.filter((kw) => lowerMessage.includes(kw)));
    return { intent: "statistics", keywords };
  }

  // كلمات مفتاحية للمواعيد
  const deadlineKeywords = ["موعد", "تسليم", "تقرير", "أسبوعي", "شهري", "متى"];
  if (deadlineKeywords.some((kw) => lowerMessage.includes(kw))) {
    keywords.push(...deadlineKeywords.filter((kw) => lowerMessage.includes(kw)));
    return { intent: "deadline", keywords };
  }

  // كلمات مفتاحية للبوسترات
  const posterKeywords = ["بوستر", "إنفوجرافيك", "تصميم", "توعية", "صورة"];
  if (posterKeywords.some((kw) => lowerMessage.includes(kw))) {
    keywords.push(...posterKeywords.filter((kw) => lowerMessage.includes(kw)));
    return { intent: "poster", keywords };
  }

  return { intent: "general", keywords: [] };
}

/**
 * البحث في قاعدة المعرفة
 */
function searchKnowledgeBase(intent: string, message: string): string | null {
  const lowerMessage = message.toLowerCase();

  // البحث في الإحصائيات
  if (intent === "statistics") {
    // البحث عن موضوع محدد
    for (const topic of KNOWLEDGE_BASE.statistics.topics) {
      if (lowerMessage.includes(topic.name.toLowerCase()) || lowerMessage.includes(topic.category.toLowerCase())) {
        return `يتم تسجيل "${topic.name}" ضمن القسم: **${topic.category}** في حقل اللقاءات الفردية أو المحاضرات أو الندوات حسب نوع النشاط.`;
      }
    }

    // إجابة عامة
    if (lowerMessage.includes("كيف") || lowerMessage.includes("أين")) {
      return `للتسجيل في الإحصائيات اليومية:
1. انتقل إلى صفحة "إدخال الإحصائيات اليومية"
2. اختر التاريخ
3. املأ الحقول: اللقاءات الفردية، المحاضرات، الندوات
4. اضغط "حفظ"

المواضيع المتاحة: ${KNOWLEDGE_BASE.statistics.topics.map((t) => t.name).join("، ")}`;
    }
  }

  // البحث في المواعيد
  if (intent === "deadline") {
    if (lowerMessage.includes("أسبوعي")) {
      return KNOWLEDGE_BASE.deadlines.weekly;
    }
    if (lowerMessage.includes("شهري")) {
      return KNOWLEDGE_BASE.deadlines.monthly;
    }
    return `المواعيد الرسمية:
- التقرير الأسبوعي: ${KNOWLEDGE_BASE.deadlines.weekly}
- التقرير الشهري: ${KNOWLEDGE_BASE.deadlines.monthly}
- الإدخال اليومي: ${KNOWLEDGE_BASE.deadlines.daily}`;
  }

  // البحث في البوسترات
  if (intent === "poster") {
    return `لإنشاء بوستر توعوي:
1. انتقل إلى "استوديو الإنفوجرافيك"
2. اكتب الموضوع في حقل "المناسبة الصحية"
3. اختر اسم المركز الصحي
4. اضغط "توليد"
5. يمكنك مشاركة البوستر مباشرة في الدردشة

المميزات: ${KNOWLEDGE_BASE.posterStudio.features.join("، ")}`;
  }

  return null;
}

/**
 * توليد رد ذكي باستخدام Gemini
 */
export async function generateBotResponse(
  message: string,
  userId: string,
  roomId: string
): Promise<BotResponse> {
  if (!GEMINI_API_KEY || !genAI) {
    return {
      response: "عذراً، المساعد غير متاح حالياً. يرجى التواصل مع مدير القطاع.",
      confidence: "low",
      requiresHuman: true,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // تحليل النية
    const { intent, keywords } = analyzeIntent(message);

    // البحث في قاعدة المعرفة
    const knowledgeAnswer = searchKnowledgeBase(intent, message);

    // بناء البرومبت
    const prompt = `أنت مساعد إداري ذكي لقطاع كركوك الأول - دائرة صحة كركوك.

المهمة: الرد على استفسارات موظفي المراكز الصحية الـ 23 بطريقة مهنية ومفيدة.

السؤال: "${message}"

قاعدة المعرفة الرسمية:
${knowledgeAnswer ? `إجابة من قاعدة المعرفة: ${knowledgeAnswer}` : "لا توجد إجابة مباشرة في قاعدة المعرفة"}

التصنيفات الرسمية للإحصائيات:
${KNOWLEDGE_BASE.statistics.categories.join("، ")}

المواضيع المتاحة:
${KNOWLEDGE_BASE.statistics.topics.map((t) => `- ${t.name} (${t.category})`).join("\n")}

تعليمات:
1. إذا كان السؤال بسيطاً وواضحاً، أجب مباشرة بناءً على قاعدة المعرفة
2. إذا كان السؤال معقداً أو يتطلب قراراً إدارياً، قل: "سؤالك تخصصي، سأقوم بتحويله لمدير القطاع للمراجعة"
3. استخدم لغة مهنية وودية
4. أجب بالعربية فقط
5. كن مختصراً (3-4 جمل كحد أقصى)
6. إذا كان السؤال عن موضوع غير موجود في القائمة، أرشد المستخدم للتصنيف الأقرب

أجب بشكل مباشر ومهني:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // تحديد مستوى الثقة
    let confidence: "high" | "medium" | "low" = "medium";
    if (knowledgeAnswer) {
      confidence = "high";
    } else if (intent !== "unknown") {
      confidence = "medium";
    } else {
      confidence = "low";
    }

    // تحديد إذا كان يحتاج تدخل بشري
    const requiresHuman =
      text.includes("مدير") ||
      text.includes("تحويل") ||
      confidence === "low" ||
      message.length > 200; // أسئلة طويلة قد تحتاج توضيح

    return {
      response: text.trim(),
      confidence,
      requiresHuman,
      suggestedAction: requiresHuman ? "تحويل لمدير القطاع" : undefined,
    };
  } catch (error: any) {
    console.error("Error generating bot response:", error);
    return {
      response: "عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى أو التواصل مع مدير القطاع.",
      confidence: "low",
      requiresHuman: true,
    };
  }
}

/**
 * التحقق من إعدادات المساعد
 */
export async function isBotEnabled(): Promise<boolean> {
  // سيتم تنفيذ هذا في API route
  return true; // افتراضياً مفعل
}

