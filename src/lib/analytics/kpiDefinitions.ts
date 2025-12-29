/**
 * KPI Definitions - Analytics Readiness
 * Centralized metric definitions for future analytics
 */

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  aggregation: "sum" | "avg" | "count" | "percentage";
  level: "center" | "sector" | "both";
}

export const KPIDefinitions: KPIDefinition[] = [
  {
    id: "total_reports",
    name: "إجمالي التقارير",
    description: "عدد التقارير المرسلة",
    unit: "عدد",
    aggregation: "count",
    level: "both",
  },
  {
    id: "approval_rate",
    name: "نسبة الاعتماد",
    description: "نسبة التقارير المعتمدة من إجمالي المرسلة",
    unit: "%",
    aggregation: "percentage",
    level: "both",
  },
  {
    id: "submission_rate",
    name: "نسبة الإرسال",
    description: "نسبة المراكز التي أرسلت تقاريرها",
    unit: "%",
    aggregation: "percentage",
    level: "sector",
  },
  {
    id: "total_individual_sessions",
    name: "إجمالي الجلسات الفردية",
    description: "مجموع الجلسات الفردية في جميع التقارير",
    unit: "عدد",
    aggregation: "sum",
    level: "both",
  },
  {
    id: "total_lectures",
    name: "إجمالي المحاضرات",
    description: "مجموع المحاضرات في جميع التقارير",
    unit: "sum",
    aggregation: "sum",
    level: "both",
  },
  {
    id: "total_seminars",
    name: "إجمالي الندوات",
    description: "مجموع الندوات في جميع التقارير",
    unit: "عدد",
    aggregation: "sum",
    level: "both",
  },
  {
    id: "avg_processing_time",
    name: "متوسط وقت المعالجة",
    description: "متوسط الوقت من الإرسال إلى الاعتماد",
    unit: "أيام",
    aggregation: "avg",
    level: "sector",
  },
];

export interface TimeSeriesMetric {
  date: string;
  value: number;
  centerId?: string;
  centerName?: string;
}

export interface AggregatedMetrics {
  period: string; // "2024-01" or "2024"
  centerLevel?: {
    [centerId: string]: {
      centerName: string;
      metrics: { [kpiId: string]: number };
    };
  };
  sectorLevel: {
    metrics: { [kpiId: string]: number };
  };
}

