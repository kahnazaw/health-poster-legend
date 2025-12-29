import { NextRequest, NextResponse } from "next/server";
import { researchHealthTopic, generateInfographicPrompt } from "@/lib/ai/researchEngine";
import { generateImageWithGemini } from "@/lib/ai/geminiImageGenerator";

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

    // المرحلة الثانية: توليد برومبت الإنفوجرافيك
    const infographicPrompt = generateInfographicPrompt(
      topic,
      researchResult.microLearningPoints,
      healthCenterName
    );

    // المرحلة الثالثة: توليد الصورة
    const imageDataUrl = await generateImageWithGemini(infographicPrompt);

    return NextResponse.json({
      success: true,
      imageUrl: imageDataUrl,
      suggestedTitle: researchResult.recommendedTitle,
      microLearningPoints: researchResult.microLearningPoints,
      summary: researchResult.summary,
      sources: researchResult.sources,
      prompt: infographicPrompt,
      healthCenterName: healthCenterName || "",
    });
  } catch (error: any) {
    console.error("Error in generate-infographic API:", error);
    return NextResponse.json(
      { error: error.message || "فشل توليد الإنفوجرافيك" },
      { status: 500 }
    );
  }
}

