import { NextRequest, NextResponse } from "next/server";
import { generateDetailedPrompt, generateImageWithGemini, generateSuggestedTitle } from "@/lib/ai/geminiImageGenerator";
import { verifyAuth, verifyProfile } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة (اختياري - يمكن تفعيله لاحقاً)
    // const { user, session, error: authError } = await verifyAuth(request);
    // 
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized: Please login first" },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { campaignType, targetAudience, visualStyle, language } = body;

    if (!campaignType || !targetAudience || !visualStyle) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // توليد العنوان المقترح
    const suggestedTitle = generateSuggestedTitle({
      campaignType,
      targetAudience,
      visualStyle,
      language: language || "ar",
    });

    // توليد البرومبت التفصيلي
    const detailedPrompt = generateDetailedPrompt({
      campaignType,
      targetAudience,
      visualStyle,
      language: language || "ar",
      suggestedTitle,
    });

    // توليد الصورة باستخدام Gemini
    const imageDataUrl = await generateImageWithGemini(detailedPrompt);

    return NextResponse.json({
      success: true,
      imageUrl: imageDataUrl,
      suggestedTitle,
      prompt: detailedPrompt,
    });
  } catch (error: any) {
    console.error("Error in generate-poster API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate poster" },
      { status: 500 }
    );
  }
}

