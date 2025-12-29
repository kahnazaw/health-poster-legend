/**
 * Rule-Based Insights Generator
 * Explainable, auditable insights without AI
 */

export interface Insight {
  id: string;
  type: "missing_report" | "sudden_drop" | "sudden_spike" | "inactive_center" | "category_imbalance";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  rule: string; // Explainable rule
  affectedCenters?: string[];
  recommendation?: string;
  timestamp: string;
}

export interface InsightRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  generate: (data: any) => Insight;
}

/**
 * Rule 1: Missing Reports
 * Detects centers that haven't submitted reports for current period
 */
export const missingReportRule: InsightRule = {
  id: "missing_report",
  name: "تقارير مفقودة",
  condition: (data: { expectedCenters: string[]; submittedCenters: string[] }) => {
    return data.expectedCenters.length > data.submittedCenters.length;
  },
  generate: (data: { expectedCenters: string[]; submittedCenters: string[]; period: string }) => {
    const missing = data.expectedCenters.filter(
      (center) => !data.submittedCenters.includes(center)
    );
    
    return {
      id: `missing_report_${data.period}`,
      type: "missing_report",
      severity: missing.length > 5 ? "high" : missing.length > 2 ? "medium" : "low",
      title: `تقارير مفقودة للفترة ${data.period}`,
      description: `${missing.length} مركز صحي لم يرسل تقريره بعد`,
      rule: `IF expected_centers.length > submitted_centers.length THEN alert`,
      affectedCenters: missing,
      recommendation: "التواصل مع المراكز المفقودة لتذكيرها بإرسال التقارير",
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Rule 2: Sudden Drop
 * Detects significant decrease in activity compared to previous period
 */
export const suddenDropRule: InsightRule = {
  id: "sudden_drop",
  name: "انخفاض مفاجئ",
  condition: (data: { current: number; previous: number; threshold: number }) => {
    const dropPercentage = ((data.previous - data.current) / data.previous) * 100;
    return dropPercentage >= data.threshold;
  },
  generate: (data: { current: number; previous: number; centerName: string; metric: string }) => {
    const dropPercentage = ((data.previous - data.current) / data.previous) * 100;
    
    return {
      id: `sudden_drop_${data.centerName}_${Date.now()}`,
      type: "sudden_drop",
      severity: dropPercentage > 50 ? "critical" : dropPercentage > 30 ? "high" : "medium",
      title: `انخفاض مفاجئ في ${data.metric}`,
      description: `انخفض ${data.metric} في ${data.centerName} بنسبة ${dropPercentage.toFixed(1)}% مقارنة بالفترة السابقة`,
      rule: `IF (previous - current) / previous * 100 >= 30% THEN alert`,
      affectedCenters: [data.centerName],
      recommendation: "التحقق من سبب الانخفاض والتحقق من صحة البيانات",
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Rule 3: Sudden Spike
 * Detects significant increase in activity
 */
export const suddenSpikeRule: InsightRule = {
  id: "sudden_spike",
  name: "ارتفاع مفاجئ",
  condition: (data: { current: number; previous: number; threshold: number }) => {
    const spikePercentage = ((data.current - data.previous) / data.previous) * 100;
    return spikePercentage >= data.threshold;
  },
  generate: (data: { current: number; previous: number; centerName: string; metric: string }) => {
    const spikePercentage = ((data.current - data.previous) / data.previous) * 100;
    
    return {
      id: `sudden_spike_${data.centerName}_${Date.now()}`,
      type: "sudden_spike",
      severity: spikePercentage > 200 ? "high" : "medium",
      title: `ارتفاع مفاجئ في ${data.metric}`,
      description: `ارتفع ${data.metric} في ${data.centerName} بنسبة ${spikePercentage.toFixed(1)}% مقارنة بالفترة السابقة`,
      rule: `IF (current - previous) / previous * 100 >= 50% THEN alert`,
      affectedCenters: [data.centerName],
      recommendation: "التحقق من صحة البيانات - قد يكون هناك خطأ في الإدخال",
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Rule 4: Inactive Center
 * Detects centers with zero activity for multiple periods
 */
export const inactiveCenterRule: InsightRule = {
  id: "inactive_center",
  name: "مركز غير نشط",
  condition: (data: { periodsInactive: number; threshold: number }) => {
    return data.periodsInactive >= data.threshold;
  },
  generate: (data: { centerName: string; periodsInactive: number }) => {
    return {
      id: `inactive_${data.centerName}_${Date.now()}`,
      type: "inactive_center",
      severity: data.periodsInactive >= 3 ? "high" : "medium",
      title: `مركز غير نشط: ${data.centerName}`,
      description: `${data.centerName} لم يرسل تقارير نشاط لـ ${data.periodsInactive} فترات متتالية`,
      rule: `IF periods_with_zero_activity >= 2 THEN alert`,
      affectedCenters: [data.centerName],
      recommendation: "التواصل مع المركز للتحقق من الوضع",
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Generate all insights based on data
 */
export function generateInsights(data: {
  expectedCenters: string[];
  submittedCenters: string[];
  period: string;
  centerMetrics?: Array<{
    centerName: string;
    current: number;
    previous: number;
    metric: string;
  }>;
}): Insight[] {
  const insights: Insight[] = [];
  
  // Missing reports
  if (missingReportRule.condition(data)) {
    insights.push(missingReportRule.generate(data));
  }
  
  // Sudden drops/spikes
  if (data.centerMetrics) {
    data.centerMetrics.forEach((metric) => {
      if (metric.previous > 0) {
        // Check for drop
        if (suddenDropRule.condition({
          current: metric.current,
          previous: metric.previous,
          threshold: 30,
        })) {
          insights.push(suddenDropRule.generate({
            current: metric.current,
            previous: metric.previous,
            centerName: metric.centerName,
            metric: metric.metric,
          }));
        }
        
        // Check for spike
        if (suddenSpikeRule.condition({
          current: metric.current,
          previous: metric.previous,
          threshold: 50,
        })) {
          insights.push(suddenSpikeRule.generate({
            current: metric.current,
            previous: metric.previous,
            centerName: metric.centerName,
            metric: metric.metric,
          }));
        }
      }
    });
  }
  
  return insights;
}

