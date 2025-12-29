import { NextRequest, NextResponse } from "next/server";
import { generateBotResponse } from "@/lib/ai/adminBot";
import { supabase } from "@/lib/supabase";

/**
 * API Route للمساعد الإداري الذكي
 * يتم استدعاؤه تلقائياً عند إرسال رسالة في القناة العامة
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, roomId } = body;

    if (!message || !userId || !roomId) {
      return NextResponse.json(
        { error: "البيانات المطلوبة غير مكتملة" },
        { status: 400 }
      );
    }

    // التحقق من أن الرسالة في القناة العامة أو غرفة عامة
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("type")
      .eq("id", roomId)
      .single();

    if (!room || (room.type !== "public" && room.type !== "group")) {
      return NextResponse.json(
        { error: "المساعد متاح فقط في القنوات العامة والمجموعات" },
        { status: 403 }
      );
    }

    // التحقق من أن الرسالة ليست من المساعد نفسه
    const { data: sender } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    if (sender?.full_name === "مساعد قطاع كركوك الأول") {
      return NextResponse.json({ success: true, skip: true });
    }

    // توليد الرد
    const botResponse = await generateBotResponse(message, userId, roomId);

    // إذا كان الرد يحتاج تدخل بشري، أرسل رسالة خاصة للمدير
    if (botResponse.requiresHuman && botResponse.confidence === "low") {
      // يمكن إضافة منطق لإرسال تنبيه للمدير هنا
      console.log("Message requires human review:", message);
    }

    // إرسال رد المساعد
    const { data: botUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("full_name", "مساعد قطاع كركوك الأول")
      .single();

    if (botUser) {
      await supabase.from("chat_messages").insert({
        room_id: roomId,
        user_id: botUser.id,
        content: botResponse.response,
        message_type: "text",
        metadata: {
          is_bot: true,
          confidence: botResponse.confidence,
          requiresHuman: botResponse.requiresHuman,
        },
      });
    }

    return NextResponse.json({
      success: true,
      response: botResponse.response,
      confidence: botResponse.confidence,
    });
  } catch (error: any) {
    console.error("Error in bot API:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}

