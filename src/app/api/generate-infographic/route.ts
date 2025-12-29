import { NextRequest, NextResponse } from "next/server";
import { researchHealthTopic, generateInfographicPrompt } from "@/lib/ai/researchEngine";
import { generateImageWithGemini } from "@/lib/ai/geminiImageGenerator";
import { mergeImageWithText } from "@/lib/ai/textOverlayEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, healthCenterName, language, layoutType, pointStyle } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: "الموضوع مطلوب" },
        { status: 400 }
      );
    }

    // المرحلة الأولى: البحث والتلخيص
    const researchResult = await researchHealthTopic(topic, healthCenterName);

    // المرحلة الثانية: توليد برومبت الإنفوجرافيك (خلفية صامتة)
    const infographicPrompt = generateInfographicPrompt(
      topic,
      layoutType || "grid",
      researchResult.microLearningPoints
    );

    // المرحلة الثالثة: توليد الصورة (خلفية صامتة فقط)
    const backgroundImageUrl = await generateImageWithGemini(infographicPrompt);

    // المرحلة الرابعة: دمج النصوص برمجياً
    const finalImageUrl = await mergeImageWithText(
      backgroundImageUrl,
      {
        type: layoutType || "grid",
        points: researchResult.microLearningPoints,
        title: researchResult.recommendedTitle,
        healthCenterName: healthCenterName || "",
      },
      pointStyle || "numbered"
    );

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      backgroundImageUrl: backgroundImageUrl, // للرجوع إليها إذا لزم
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

