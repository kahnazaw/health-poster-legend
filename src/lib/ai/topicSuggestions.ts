/**
 * Topic Suggestions Engine - محرك الاقتراحات التلقائية للمواضيع الصحية
 * يقترح مواضيع بناءً على الموسم الحالي وملف الإحصائية الرسمي
 */

export interface TopicSuggestion {
  topic: string;
  category: string;
  season: string;
  priority: "high" | "medium" | "low";
  description: string;
  officialCategory: string; // من ملف الإحصائية الرسمي
}

/**
 * تحديد الموسم الحالي
 */
function getCurrentSeason(): "winter" | "spring" | "summer" | "autumn" {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 12 || month <= 2) return "winter"; // ديسمبر، يناير، فبراير
  if (month >= 3 && month <= 5) return "spring"; // مارس، أبريل، مايو
  if (month >= 6 && month <= 8) return "summer"; // يونيو، يوليو، أغسطس
  return "autumn"; // سبتمبر، أكتوبر، نوفمبر
}

/**
 * التصنيفات الرسمية من ملف الإحصائية
 */
const OFFICIAL_CATEGORIES = {
  // رعاية الأم والطفل
  maternal_health: {
    name: "رعاية الأم والطفل",
    topics: [
      "فحص ما قبل الزواج",
      "رعاية الحامل المعرضة للخطورة",
      "متابعة الحمل",
      "رعاية ما بعد الولادة",
      "الرضاعة الطبيعية",
      "صحة الطفل حديث الولادة",
    ],
  },
  // التحصين
  vaccination: {
    name: "التحصين",
    topics: [
      "لقاح الأطفال الروتيني",
      "الحملات التلقيحية",
      "لقاح الحصبة",
      "لقاح شلل الأطفال",
      "لقاح الكزاز",
      "التحصين الموسمي",
    ],
  },
  // الأمراض الانتقالية
  communicable_diseases: {
    name: "الأمراض الانتقالية",
    topics: [
      "الأنفلونزا الوبائية",
      "الكوليرا",
      "التهاب الكبد الوبائي",
      "السل",
      "الحمى التيفية",
      "الأمراض المنقولة بالماء",
    ],
  },
  // الأمراض غير الانتقالية
  non_communicable_diseases: {
    name: "الأمراض غير الانتقالية",
    topics: [
      "السكري",
      "ارتفاع ضغط الدم",
      "أمراض القلب",
      "السرطان",
      "السمنة",
      "أمراض الجهاز التنفسي المزمنة",
    ],
  },
  // الصحة النفسية
  mental_health: {
    name: "الصحة النفسية",
    topics: [
      "الصحة النفسية للشباب",
      "الاكتئاب والقلق",
      "الصحة النفسية للمرأة",
      "الصحة النفسية لكبار السن",
      "إدارة الضغوط النفسية",
    ],
  },
  // التغذية
  nutrition: {
    name: "التغذية",
    topics: [
      "التغذية الصحية للأطفال",
      "التغذية أثناء الحمل",
      "التغذية لكبار السن",
      "السمنة والنحافة",
      "نقص الحديد وفقر الدم",
    ],
  },
  // النظافة والصحة البيئية
  hygiene: {
    name: "النظافة والصحة البيئية",
    topics: [
      "غسل اليدين",
      "النظافة الشخصية",
      "سلامة الغذاء",
      "مكافحة الحشرات",
      "الصرف الصحي",
    ],
  },
};

/**
 * توليد الاقتراحات بناءً على الموسم
 */
export function generateSeasonalSuggestions(): TopicSuggestion[] {
  const season = getCurrentSeason();
  const suggestions: TopicSuggestion[] = [];

  // اقتراحات الشتاء (ديسمبر - فبراير)
  if (season === "winter") {
    suggestions.push(
      {
        topic: "الأنفلونزا الوبائية والوقاية منها",
        category: "communicable_diseases",
        season: "winter",
        priority: "high",
        description: "موضوع موسمي مهم في فصل الشتاء",
        officialCategory: "الأمراض الانتقالية",
      },
      {
        topic: "التدفئة الآمنة والوقاية من التسمم",
        category: "hygiene",
        season: "winter",
        priority: "high",
        description: "توعية حول استخدام وسائل التدفئة بأمان",
        officialCategory: "النظافة والصحة البيئية",
      },
      {
        topic: "التحصين ضد الأنفلونزا الموسمية",
        category: "vaccination",
        season: "winter",
        priority: "high",
        description: "حملة تلقيح موسمية",
        officialCategory: "التحصين",
      },
      {
        topic: "الوقاية من أمراض الجهاز التنفسي",
        category: "non_communicable_diseases",
        season: "winter",
        priority: "medium",
        description: "خاصة لكبار السن",
        officialCategory: "الأمراض غير الانتقالية",
      }
    );
  }

  // اقتراحات الربيع (مارس - مايو)
  if (season === "spring") {
    suggestions.push(
      {
        topic: "الحملات التلقيحية للأطفال",
        category: "vaccination",
        season: "spring",
        priority: "high",
        description: "موسم التحصين الروتيني",
        officialCategory: "التحصين",
      },
      {
        topic: "رعاية الحامل في الربيع",
        category: "maternal_health",
        season: "spring",
        priority: "medium",
        description: "توعية حول رعاية الحامل",
        officialCategory: "رعاية الأم والطفل",
      },
      {
        topic: "التغذية الصحية في الربيع",
        category: "nutrition",
        season: "spring",
        priority: "medium",
        description: "الخضروات والفواكه الموسمية",
        officialCategory: "التغذية",
      }
    );
  }

  // اقتراحات الصيف (يونيو - أغسطس)
  if (season === "summer") {
    suggestions.push(
      {
        topic: "الوقاية من الكوليرا والأمراض المنقولة بالماء",
        category: "communicable_diseases",
        season: "summer",
        priority: "high",
        description: "موضوع موسمي حرج في الصيف",
        officialCategory: "الأمراض الانتقالية",
      },
      {
        topic: "غسل اليدين والنظافة الشخصية",
        category: "hygiene",
        season: "summer",
        priority: "high",
        description: "أساسي في الصيف",
        officialCategory: "النظافة والصحة البيئية",
      },
      {
        topic: "سلامة الغذاء في الصيف",
        category: "hygiene",
        season: "summer",
        priority: "high",
        description: "توعية حول حفظ الطعام",
        officialCategory: "النظافة والصحة البيئية",
      },
      {
        topic: "الوقاية من ضربة الشمس",
        category: "hygiene",
        season: "summer",
        priority: "medium",
        description: "خاصة للعمال وكبار السن",
        officialCategory: "النظافة والصحة البيئية",
      },
      {
        topic: "الرضاعة الطبيعية في الصيف",
        category: "maternal_health",
        season: "summer",
        priority: "medium",
        description: "توعية للأمهات",
        officialCategory: "رعاية الأم والطفل",
      }
    );
  }

  // اقتراحات الخريف (سبتمبر - نوفمبر)
  if (season === "autumn") {
    suggestions.push(
      {
        topic: "التحصين الروتيني للأطفال",
        category: "vaccination",
        season: "autumn",
        priority: "high",
        description: "بداية العام الدراسي",
        officialCategory: "التحصين",
      },
      {
        topic: "إدارة الأمراض المزمنة",
        category: "non_communicable_diseases",
        season: "autumn",
        priority: "medium",
        description: "السكري والضغط",
        officialCategory: "الأمراض غير الانتقالية",
      },
      {
        topic: "الصحة النفسية للشباب",
        category: "mental_health",
        season: "autumn",
        priority: "medium",
        description: "بداية العام الدراسي",
        officialCategory: "الصحة النفسية",
      }
    );
  }

  // إضافة اقتراحات عامة (متاحة دائماً)
  suggestions.push(
    {
      topic: "لقاح الأطفال الروتيني",
      category: "vaccination",
      season: "all",
      priority: "high",
      description: "موضوع دائم الأهمية",
      officialCategory: "التحصين",
    },
    {
      topic: "رعاية الحامل المعرضة للخطورة",
      category: "maternal_health",
      season: "all",
      priority: "high",
      description: "موضوع دائم الأهمية",
      officialCategory: "رعاية الأم والطفل",
    },
    {
      topic: "إدارة السكري",
      category: "non_communicable_diseases",
      season: "all",
      priority: "medium",
      description: "موضوع دائم الأهمية",
      officialCategory: "الأمراض غير الانتقالية",
    }
  );

  return suggestions;
}

/**
 * الحصول على اقتراحات حسب الأولوية
 */
export function getSuggestionsByPriority(priority: "high" | "medium" | "low" = "high"): TopicSuggestion[] {
  const allSuggestions = generateSeasonalSuggestions();
  return allSuggestions.filter((s) => s.priority === priority);
}

/**
 * الحصول على اقتراحات حسب التصنيف الرسمي
 */
export function getSuggestionsByCategory(category: string): TopicSuggestion[] {
  const allSuggestions = generateSeasonalSuggestions();
  return allSuggestions.filter((s) => s.category === category);
}

/**
 * الحصول على جميع التصنيفات الرسمية
 */
export function getOfficialCategories() {
  return OFFICIAL_CATEGORIES;
}

