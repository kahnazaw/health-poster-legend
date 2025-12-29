/**
 * Scoring Engine - محرك التقييم الذكي
 * يحسب نقاط الأداء للمراكز بناءً على المعادلة الرسمية
 */

export interface ScoringInput {
  seminars: number; // الندوات
  lectures: number; // المحاضرات
  individualMeetings: number; // اللقاءات الفردية
  postersGenerated: number; // البوسترات المولدة
}

export interface ScoringResult {
  totalScore: number;
  breakdown: {
    seminarsPoints: number;
    lecturesPoints: number;
    meetingsPoints: number;
    postersPoints: number;
  };
  normalizedScore: number; // 0-100
  rank?: number;
}

/**
 * معادلة التقييم الرسمية:
 * Score = (S × 10) + (L × 5) + (I × 1) + (P × 15)
 * 
 * S: الندوة = 10 نقاط
 * L: المحاضرة = 5 نقاط
 * I: اللقاء الفردي = نقطة واحدة
 * P: بوستر ذكي = 15 نقطة
 */
export function calculateCenterScore(input: ScoringInput): ScoringResult {
  const seminarsPoints = input.seminars * 10;
  const lecturesPoints = input.lectures * 5;
  const meetingsPoints = input.individualMeetings * 1;
  const postersPoints = input.postersGenerated * 15;

  const totalScore = seminarsPoints + lecturesPoints + meetingsPoints + postersPoints;

  // تطبيع النقاط إلى 0-100 (كل 100 نقطة = 10% من النقاط الكلية)
  const normalizedScore = Math.min((totalScore / 10), 100);

  return {
    totalScore,
    breakdown: {
      seminarsPoints,
      lecturesPoints,
      meetingsPoints,
      postersPoints,
    },
    normalizedScore: Math.round(normalizedScore * 10) / 10, // تقريب لرقم عشري واحد
  };
}

/**
 * حساب النقاط لفترة زمنية محددة
 */
export function calculatePeriodScore(
  stats: {
    totalSeminars: number;
    totalLectures: number;
    totalMeetings: number;
    totalPosters: number;
  }
): ScoringResult {
  return calculateCenterScore({
    seminars: stats.totalSeminars,
    lectures: stats.totalLectures,
    individualMeetings: stats.totalMeetings,
    postersGenerated: stats.totalPosters,
  });
}

