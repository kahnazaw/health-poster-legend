import { NextRequest, NextResponse } from "next/server";
import { researchHealthTopic } from "@/lib/ai/researchEngine";
import { generateComponentIllustrations } from "@/lib/ai/componentImageGenerator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, healthCenterName, language } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: "الموضوع مطلوب" },
        { status: 400 }
      );
    }

    // المرحلة الأولى: البحث والتلخيص
    const researchResult = await researchHealthTopic(topic, healthCenterName);

    // المرحلة الثانية: توليد 3 صور كرتونية منفصلة
    const illustrations = await generateComponentIllustrations(
      researchResult.microLearningPoints,
      topic
    );

    return NextResponse.json({
      success: true,
      illustrations: illustrations, // 3 صور منفصلة
      suggestedTitle: researchResult.recommendedTitle,
      microLearningPoints: researchResult.microLearningPoints,
      summary: researchResult.summary,
      sources: researchResult.sources,
      healthCenterName: healthCenterName || "",
      language: language || "ar",
    });
  } catch (error: any) {
    console.error("Error in generate-infographic API:", error);
    return NextResponse.json(
      { error: error.message || "فشل توليد الإنفوجرافيك" },
      { status: 500 }
    );
  }
}

