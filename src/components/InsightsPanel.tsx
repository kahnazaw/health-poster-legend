"use client";

import React from "react";
import { Insight } from "@/lib/insights/ruleBasedInsights";

interface InsightsPanelProps {
  insights: Insight[];
  loading?: boolean;
}

const severityColors = {
  low: "bg-blue-50 border-blue-200 text-blue-800",
  medium: "bg-yellow-50 border-yellow-200 text-yellow-800",
  high: "bg-orange-50 border-orange-200 text-orange-800",
  critical: "bg-red-50 border-red-200 text-red-800",
};

const severityIcons = {
  low: "ℹ️",
  medium: "⚠️",
  high: "🔴",
  critical: "🚨",
};

export default function InsightsPanel({ insights, loading }: InsightsPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">لا توجد تنبيهات</h3>
        </div>
        <p className="text-gray-600 text-sm">جميع المؤشرات ضمن المستويات الطبيعية</p>
      </div>
    );
  }

  // Group by severity
  const grouped = insights.reduce((acc, insight) => {
    if (!acc[insight.severity]) {
      acc[insight.severity] = [];
    }
    acc[insight.severity].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  const severityOrder = ["critical", "high", "medium", "low"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <p className="text-base md:text-lg font-bold text-gray-800">رؤى وتحليلات</p>
          <p className="text-xs md:text-sm text-gray-600">تنبيهات تلقائية بناءً على البيانات</p>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {severityOrder.map((severity) => {
          const groupInsights = grouped[severity] || [];
          if (groupInsights.length === 0) return null;

          return (
            <div key={severity} className="space-y-2 md:space-y-3">
              {groupInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3 md:p-4 rounded-lg border-l-4 ${severityColors[insight.severity]}`}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <span className="text-xl md:text-2xl flex-shrink-0">
                      {severityIcons[insight.severity]}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold mb-1 text-sm md:text-base">{insight.title}</p>
                      <p className="text-xs md:text-sm mb-1 md:mb-2 leading-relaxed">{insight.description}</p>
                      
                      {insight.affectedCenters && insight.affectedCenters.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="font-semibold">المراكز المتأثرة:</span>{" "}
                          {insight.affectedCenters.join("، ")}
                        </div>
                      )}
                      
                      {insight.recommendation && (
                        <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                          <span className="font-semibold">التوصية:</span> {insight.recommendation}
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs opacity-75">
                        <span className="font-semibold">القاعدة:</span> {insight.rule}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

