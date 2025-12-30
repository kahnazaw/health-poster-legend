/**
 * المحرك المزدوج الذكي لقطاع كركوك الأول
 * يعمل كفريق عمل متكامل:
 * - Gemini: الباحث والمحرر العلمي
 * - مولد الصور: الرسام التوضيحي
 * - الكود البرمجي: المصمم الذي يجمع كل شيء بدقة
 */

import { NextRequest, NextResponse } from "next/server";
import { researchHealthTopic } from "@/lib/ai/researchEngine";
import { generateComponentIllustrations } from "@/lib/ai/componentImageGenerator";
import { verifyAuth, verifyProfile } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const { user, session, error: authError } = await verifyAuth(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "غير مصرح: يرجى تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // التحقق من وجود profile
    const { profile, error: profileError } = await verifyProfile(user.id);
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: "ملف المستخدم غير موجود. يرجى إنشاء حساب جديد." },
        { status: 403 }
      );
    }

    // التحقق من أن المستخدم معتمد (أو admin)
    if (profile.role !== "admin" && !profile.is_approved) {
      return NextResponse.json(
        { error: "حسابك قيد المراجعة من الإدارة. يرجى انتظار الموافقة." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { topic, healthCenterName, language } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: "الموضوع مطلوب" },
        { status: 400 }
      );
    }

    // ============================================
    // المرحلة 1: المحرر العلمي (Gemini)
    // جلب المعلومات وتلخيصها لـ 3 نقاط (Micro-learning)
    // نعتمد على المواضيع الرسمية مثل (رعاية الأم والطفل، التحصين)
    // ============================================
    const researchResult = await researchHealthTopic(topic, healthCenterName);

    // تحويل النقاط إلى كائنات منظمة مع وصف الصورة
    const points = researchResult.microLearningPoints.map((point, index) => ({
      text: point, // النص العربي الصافي (سيُكتب برمجياً)
      imageDescription: `Professional medical cartoon illustration representing: ${point}. 
        Minimalist style, flat colors, white background, HIGH QUALITY, NO TEXT INSIDE.
        Style: Warm, friendly, culturally appropriate for Kirkuk, Iraq.`,
      index: index + 1,
    }));

    // ============================================
    // المرحلة 2: الرسام التوضيحي
    // طلب توليد 3 صور منفصلة بناءً على الوصف
    // نؤكد على استخدام الأسلوب الكرتوني الجذاب والصامت
    // ============================================
    const illustrations = await generateComponentIllustrations(
      researchResult.microLearningPoints,
      topic
    );

    // ============================================
    // المرحلة 3: تجميع البيانات
    // إرجاع البيانات المنظمة للمصمم (Frontend)
    // ============================================
    return NextResponse.json({
      success: true,
      points: points, // النصوص العربية الصافية + وصف الصور
      images: illustrations, // الصور التوضيحية الصامتة (3 صور)
      suggestedTitle: researchResult.recommendedTitle,
      summary: researchResult.summary,
      sources: researchResult.sources,
      healthCenterName: healthCenterName || "",
      language: language || "ar",
      metadata: {
        topic: topic,
        generatedAt: new Date().toISOString(),
        sector: "قطاع كركوك الأول",
        unit: "وحدة تعزيز الصحة",
      },
    });
  } catch (error: any) {
    console.error("Error in generate-infographic API:", error);
    return NextResponse.json(
      { error: error.message || "فشل توليد الإنفوجرافيك" },
      { status: 500 }
    );
  }
}

