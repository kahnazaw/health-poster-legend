"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Image as ImageIcon, Palette, Zap, Download, Globe, QrCode, Search, Building2, BookOpen, LayoutGrid, Clock, Target, List, Hash, CheckCircle, Share2 } from "lucide-react";
import Image from "next/image";
import { generateQRCodeDataUrl } from "@/lib/utils/qrCodeGenerator";
import { toPng } from "html-to-image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/audit";
import { generateSeasonalSuggestions, generateSmartSuggestions, getOfficialCategories, type TopicSuggestion } from "@/lib/ai/topicSuggestions";
import { factCheckHealthPoints, type FactCheckResult } from "@/lib/ai/factChecker";
import { generateMetadataBarcode } from "@/lib/utils/barcodeGenerator";

export default function PosterStudioPage() {
  const { user, profile } = useAuth();
  const [topic, setTopic] = useState("");
  const [healthCenterName, setHealthCenterName] = useState("");
  const [language, setLanguage] = useState<"ar" | "tr">("ar");
  const [layoutType, setLayoutType] = useState<"timeline" | "grid" | "central">("grid");
  const [pointStyle, setPointStyle] = useState<"numbered" | "bulleted" | "iconic">("numbered");
  const [visualLayout, setVisualLayout] = useState<"vertical" | "grid" | "circular">("grid"); // القالب البصري
  const [illustrations, setIllustrations] = useState<string[]>([]); // 3 صور منفصلة
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string>("");
  const [microLearningPoints, setMicroLearningPoints] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<any>(null);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [verifiedPoints, setVerifiedPoints] = useState<string[]>([]);
  const posterRef = useRef<HTMLDivElement>(null);

  // تعبئة اسم المركز من Profile
  useEffect(() => {
    if (profile?.health_center_name) {
      setHealthCenterName(profile.health_center_name);
    }
  }, [profile]);

  // تحميل الاقتراحات التلقائية الذكية عند تحميل الصفحة
  useEffect(() => {
    const loadSuggestions = async () => {
      const smartSuggestions = await generateSmartSuggestions();
      setSuggestions(smartSuggestions);
    };
    loadSuggestions();
  }, []);

  // تعبئة الخيارات من URL parameters (من المعرض)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get("topic");
      const lang = params.get("language");

      if (topicParam) setTopic(topicParam);
      if (lang === "ar" || lang === "tr") setLanguage(lang);
    }
  }, []);

  const layoutOptions = [
    { 
      value: "timeline" as const, 
      label: "المسار الزمني", 
      icon: <Clock className="w-5 h-5" />,
      desc: "للنصائح المتسلسلة"
    },
    { 
      value: "grid" as const, 
      label: "الشبكة الحديثة", 
      icon: <LayoutGrid className="w-5 h-5" />,
      desc: "للمعلومات المتعددة"
    },
    { 
      value: "central" as const, 
      label: "التركيز المركزي", 
      icon: <Target className="w-5 h-5" />,
      desc: "لموضوع أساسي واحد"
    },
  ];

  const pointStyleOptions = [
    { 
      value: "numbered" as const, 
      label: "رقمية", 
      icon: <Hash className="w-4 h-4" />,
      example: "1. النقطة الأولى"
    },
    { 
      value: "bulleted" as const, 
      label: "نقطية", 
      icon: <List className="w-4 h-4" />,
      example: "• النقطة الأولى"
    },
    { 
      value: "iconic" as const, 
      label: "أيقونية", 
      icon: <CheckCircle className="w-4 h-4" />,
      example: "✓ النقطة الأولى"
    },
  ];

  // توليد QR Code عند تحميل الصفحة
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrUrl = await generateQRCodeDataUrl();
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };
    generateQR();
  }, []);


  const handleGenerate = async () => {
    if (!topic || !topic.trim()) {
      alert("يرجى إدخال الموضوع الصحي");
      return;
    }

    setIsGenerating(true);
    setIllustrations([]);
    setSuggestedTitle("");
    setMicroLearningPoints([]);
    setSources([]);

    try {
      // استدعاء API الجديد للبحث والتوليد
      const response = await fetch("/api/generate-infographic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          healthCenterName: healthCenterName || "",
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل توليد الإنفوجرافيك");
      }

      const data = await response.json();
      // تحديث البيانات مع البنية الجديدة
      setIllustrations(data.images || data.illustrations || []); // 3 صور منفصلة
      setSuggestedTitle(data.suggestedTitle || "");
      // استخراج النصوص من points إذا كانت موجودة
      if (data.points && Array.isArray(data.points)) {
        setMicroLearningPoints(data.points.map((p: any) => p.text || p));
      } else {
        setMicroLearningPoints(data.microLearningPoints || []);
      }
      setSources(data.sources || []);

      // تسجيل في Analytics
      if (user) {
        await logAudit(user.id, "pdf_generated", {
          targetType: "infographic",
          details: {
            topic,
            healthCenterName,
            language,
            suggestedTitle: data.suggestedTitle,
            microLearningPoints: data.microLearningPoints,
          },
        });

        // تحديث إحصائيات البوسترات في قاعدة البيانات
        try {
          await supabase.from("poster_analytics").insert({
            user_id: user.id,
            campaign_type: "infographic",
            target_audience: "general_public",
            visual_style: "modern_infographic",
            language: language,
            suggested_title: data.suggestedTitle,
            prompt: data.prompt,
            image_url: data.imageUrl,
            download_count: 0,
            generated_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error saving analytics:", error);
        }
      }
    } catch (error: any) {
      console.error("Error generating infographic:", error);
      alert(`حدث خطأ أثناء توليد الإنفوجرافيك: ${error.message || "خطأ غير معروف"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToChat = async () => {
    if (!posterRef.current || !suggestedTitle) {
      alert("يرجى توليد البوستر أولاً");
      return;
    }

    try {
      // تصدير البوستر كصورة
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        quality: 1,
        backgroundColor: "#ffffff",
      });

      // إرسال الرسالة إلى القناة العامة
      const { error } = await supabase.from("chat_messages").insert({
        room_id: "00000000-0000-0000-0000-000000000001", // القناة العامة
        user_id: user?.id,
        content: `تم توليد بوستر جديد: ${suggestedTitle}`,
        message_type: "poster",
        metadata: {
          title: suggestedTitle,
          topic: topic,
          healthCenterName: healthCenterName,
          imageUrl: dataUrl,
          microLearningPoints: microLearningPoints,
          sources: sources,
        },
      });

      if (error) throw error;

      alert("✅ تم مشاركة البوستر في القناة العامة!");
      
      // توجيه إلى صفحة الدردشة
      window.location.href = "/chat";
    } catch (error: any) {
      console.error("Error sharing poster:", error);
      alert(`حدث خطأ أثناء مشاركة البوستر: ${error.message}`);
    }
  };

  const handleExport = async (format: "png" | "pdf") => {
    if (!posterRef.current) {
      alert("لا يوجد بوستر للتصدير");
      return;
    }

    setIsExporting(true);

    try {
      if (format === "png") {
        // Ultra-Res Export مع pixelRatio: 3
        const dataUrl = await toPng(posterRef.current, {
          pixelRatio: 3, // دقة عالية للطباعة
          quality: 1,
          backgroundColor: "#ffffff",
          cacheBust: true,
        });

        const link = document.createElement("a");
        link.href = dataUrl;
        const fileName = `إنفوجرافيك_${suggestedTitle || topic}_${Date.now()}.png`;
        link.download = fileName;
        link.click();

        // Metadata للأرشفة
        console.log("Infographic exported:", {
          title: suggestedTitle,
          topic,
          healthCenterName,
          language,
          microLearningPoints,
          sources,
          layout: visualLayout, // القالب المستخدم
          metadata: "وحدة تعزيز الصحة - القطاع الأول",
        });
      } else {
        // PDF Export - محسّن بدقة عالية
        const { default: html2canvas } = await import("html2canvas");
        const { default: jsPDF } = await import("jspdf");

        // التقاط الإنفوجرافيك بالكامل بدقة عالية
        const element = posterRef.current;
        const scale = 4; // دقة عالية جداً للطباعة

        // استخدام type assertion لتجاوز قيود TypeScript
        const canvas = await html2canvas(element, {
          useCORS: true,
          background: "#ffffff",
          logging: false,
          allowTaint: true,
          removeContainer: false,
          scale: scale,
          width: element.offsetWidth * scale,
          height: element.offsetHeight * scale,
        } as any);

        // تحويل Canvas إلى JPEG بجودة عالية (0.95)
        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        // إنشاء PDF بمقاس A4
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // حساب الأبعاد مع الحفاظ على Aspect Ratio
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.width / canvas.height;
        const pageAspectRatio = pageWidth / pageHeight;

        let imgWidth, imgHeight, xOffset, yOffset;

        if (canvasAspectRatio > pageAspectRatio) {
          // الصورة أوسع من الصفحة - نستخدم عرض الصفحة بالكامل
          imgWidth = pageWidth;
          imgHeight = pageWidth / canvasAspectRatio;
          xOffset = 0;
          yOffset = (pageHeight - imgHeight) / 2; // توسيط عمودي
        } else {
          // الصورة أطول من الصفحة - نستخدم ارتفاع الصفحة بالكامل
          imgHeight = pageHeight;
          imgWidth = pageHeight * canvasAspectRatio;
          xOffset = (pageWidth - imgWidth) / 2; // توسيط أفقي
          yOffset = 0;
        }

        // إضافة الصورة لتغطي كامل الصفحة مع الحفاظ على الأبعاد
        pdf.addImage(imgData, "JPEG", xOffset, yOffset, imgWidth, imgHeight);

        // إضافة باركود الميتاداتا في الحاشية
        generateMetadataBarcode(pdf, {
          generatedAt: new Date().toISOString(),
          healthCenterName: healthCenterName || "قطاع كركوك الأول",
          topic: suggestedTitle || topic || "إنفوجرافيك",
          userId: user?.id || undefined,
        });

        // إنشاء اسم ملف احترافي
        const sanitizeFileName = (text: string) => {
          return text
            .replace(/[^\w\s-]/g, "") // إزالة الأحرف الخاصة
            .replace(/\s+/g, "_") // استبدال المسافات بشرطة سفلية
            .substring(0, 50); // تحديد الطول
        };

        const topicName = sanitizeFileName(suggestedTitle || topic || "إنفوجرافيك");
        const centerName = healthCenterName
          ? sanitizeFileName(healthCenterName)
          : "قطاع_كركوك_الأول";
        const layoutName = visualLayout === "vertical" ? "عمودي" : visualLayout === "grid" ? "شبكي" : "دائري";
        const fileName = `${topicName}-${centerName}-${layoutName}-قطاع_كركوك_الأول.pdf`;

        // حفظ الملف
        pdf.save(fileName);

        // رسالة نجاح
        alert("✅ تم تحميل الإنفوجرافيك بنجاح!\n\n" + fileName);
      }
    } catch (error) {
      console.error("Error exporting poster:", error);
      alert("حدث خطأ أثناء تصدير البوستر");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ترويسة رسمية */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 bg-white rounded-xl p-2 shadow-sm border border-slate-100">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#059669] font-tajawal">
                قطاع كركوك الأول - استوديو التصميم الذكي
              </h1>
              <p className="text-sm text-gray-600 mt-1">منصة إنشاء البوسترات التوعوية بالذكاء الاصطناعي</p>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي - تصميم عمودين */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* العمود الأيمن - لوحة التحكم */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Palette className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900 font-tajawal">إعدادات البوستر</h2>
              </div>

              <div className="space-y-6">
                {/* حقل الموضوع الصحي مع الاقتراحات التلقائية */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Search className="w-4 h-4 text-emerald-600" />
                      المناسبة الصحية أو الموضوع
                    </label>
                    <button
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {showSuggestions ? "إخفاء الاقتراحات" : "اقتراحات تلقائية"}
                    </button>
                  </div>
                  
                  {/* عرض الاقتراحات التلقائية */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="mb-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                      <p className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        مواضيع مقترحة بناءً على الموسم الحالي ({new Date().toLocaleDateString("ar", { month: "long" })})
                      </p>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {suggestions
                          .filter((s) => s.priority === "high")
                          .slice(0, 6)
                          .map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setTopic(suggestion.topic);
                                setShowSuggestions(false);
                              }}
                              className="text-right p-3 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-semibold text-gray-800"
                            >
                              <div className="flex items-center justify-between">
                                <span>{suggestion.topic}</span>
                                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                                  {suggestion.officialCategory}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-right">{suggestion.description}</p>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثال: اليوم العالمي لغسل اليدين، توعية حول لقاح الأطفال في كركوك، ظهور بوادر كوليرا..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 font-medium resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    اكتب الموضوع أو المناسبة الصحية، وسيقوم الذكاء الاصطناعي بالبحث في المصادر الرسمية
                  </p>
                </div>

                {/* اسم المركز الصحي */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    اسم المركز الصحي
                  </label>
                  <input
                    type="text"
                    value={healthCenterName}
                    onChange={(e) => setHealthCenterName(e.target.value)}
                    placeholder="مثال: مركز صحي الحويجة"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 font-medium"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    سيظهر اسم المركز في أسفل البوستر بشكل رسمي
                  </p>
                </div>

                {/* اختيار شكل التخطيط */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-600" />
                    شكل التخطيط
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {layoutOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLayoutType(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          layoutType === option.value
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`${layoutType === option.value ? "text-emerald-600" : "text-gray-400"}`}>
                            {option.icon}
                          </div>
                          <p className={`text-xs font-bold ${layoutType === option.value ? "text-emerald-700" : "text-gray-600"}`}>
                            {option.label}
                          </p>
                          <p className="text-[10px] text-gray-500">{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* اختيار نمط النقاط */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    نمط النقاط
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {pointStyleOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPointStyle(option.value)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          pointStyle === option.value
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`${pointStyle === option.value ? "text-amber-600" : "text-gray-400"}`}>
                            {option.icon}
                          </div>
                          <p className={`text-xs font-bold ${pointStyle === option.value ? "text-amber-700" : "text-gray-600"}`}>
                            {option.label}
                          </p>
                          <p className="text-[10px] text-gray-500 text-center">{option.example}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* اختيار اللغة */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    لغة الإنفوجرافيك
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "ar" | "tr")}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 font-medium"
                  >
                    <option value="ar">العربية</option>
                    <option value="tr">التركمانية / التركية</option>
                  </select>
                </div>

                {/* العنوان المقترح (يظهر بعد التوليد) */}
                {suggestedTitle && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-emerald-700 mb-2">عنوان مقترح:</p>
                    <p className="text-sm font-black text-emerald-900">{suggestedTitle}</p>
                  </div>
                )}

                {/* نقاط التعلم المصغر (يظهر بعد التوليد) */}
                {microLearningPoints.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-3 h-3" />
                      نقاط التعلم المصغر:
                    </p>
                    <ul className="space-y-2">
                      {microLearningPoints.map((point, idx) => (
                        <li key={idx} className="text-sm text-blue-900 font-medium flex items-start gap-2">
                          <span className="text-blue-600 font-black">{idx + 1}.</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* زر التوليد */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-black text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري البحث والتوليد...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>توليد إنفوجرافيك ذكي</span>
                    </>
                  )}
                </button>

                {/* زر تدقيق المصادر - يظهر بعد التوليد */}
                {illustrations.length > 0 && microLearningPoints.length > 0 && (
                  <button
                    onClick={async () => {
                      setIsFactChecking(true);
                      try {
                        const result = await factCheckHealthPoints(
                          microLearningPoints,
                          topic,
                          sources
                        );
                        setFactCheckResult(result);
                        if (result.verifiedPoints.length > 0) {
                          setVerifiedPoints(result.verifiedPoints);
                          setMicroLearningPoints(result.verifiedPoints);
                        }
                        if (result.isValid) {
                          alert("✅ تم التحقق من المصادر بنجاح!\n\n" + 
                            (result.warnings.length > 0 ? "تحذيرات: " + result.warnings.join(", ") : "جميع المعلومات دقيقة علمياً"));
                        } else {
                          alert("⚠️ تم اكتشاف بعض التنبيهات. يرجى مراجعة النقاط المحدثة.");
                        }
                      } catch (error: any) {
                        alert("حدث خطأ أثناء التدقيق: " + error.message);
                      } finally {
                        setIsFactChecking(false);
                      }
                    }}
                    disabled={isFactChecking}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isFactChecking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري التدقيق العلمي...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        <span>تدقيق المصادر</span>
                      </>
                    )}
                  </button>
                )}

                {/* نتائج التدقيق */}
                {factCheckResult && (
                  <div className={`p-4 rounded-xl border-2 ${
                    factCheckResult.isValid 
                      ? "bg-green-50 border-green-200" 
                      : "bg-yellow-50 border-yellow-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {factCheckResult.isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-yellow-600" />
                      )}
                      <p className={`text-sm font-bold ${
                        factCheckResult.isValid ? "text-green-700" : "text-yellow-700"
                      }`}>
                        {factCheckResult.isValid ? "تم التحقق من المصادر" : "تحذيرات علمية"}
                      </p>
                    </div>
                    {factCheckResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-bold text-yellow-700 mb-1">تحذيرات:</p>
                        <ul className="text-xs text-yellow-600 list-disc list-inside">
                          {factCheckResult.warnings.map((warning: string, idx: number) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      مستوى الثقة: {factCheckResult.confidence === "high" ? "عالي" : factCheckResult.confidence === "medium" ? "متوسط" : "منخفض"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* العمود الأيسر - منطقة المعاينة */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900 font-tajawal">معاينة البوستر</h2>
              </div>

              {/* منطقة المعاينة - إنفوجرافيك مكوّني احترافي */}
              <div
                ref={posterRef}
                id="infographic-canvas"
                className="relative w-full bg-white rounded-xl overflow-hidden border-t-8 border-emerald-600 shadow-2xl"
                style={{ minHeight: "900px" }}
              >
                {illustrations.length > 0 ? (
                  <div className="w-full h-full flex flex-col">
                    {/* الهيدر الرسمي لقطاع كركوك */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-white">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 bg-white rounded-xl p-2 shadow-xl">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-black font-tajawal">دائرة صحة كركوك</h2>
                            <p className="text-base font-bold opacity-90">القطاع الأول</p>
                          </div>
                        </div>
                        {qrCodeUrl && (
                          <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-xl">
                            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                      {suggestedTitle && (
                        <div className="text-center mt-6">
                          <h1 className="text-4xl font-black font-tajawal mb-2">{suggestedTitle}</h1>
                          <p className="text-emerald-100 text-sm font-semibold">إرشادات صحية معتمدة</p>
                        </div>
                      )}
                    </div>

                    {/* شبكة المعلومات - قوالب متعددة */}
                    <div className="flex-1 p-10 bg-gradient-to-br from-gray-50 via-white to-emerald-50/20">
                      {visualLayout === "vertical" ? (
                        /* قالب البطاقات العمودية - مثالي للممرات الضيقة */
                        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
                          {illustrations.map((illustration, index) => {
                            const colorSchemes = [
                              { bg: "from-emerald-50 to-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
                              { bg: "from-blue-50 to-blue-100", text: "text-blue-700", border: "border-blue-200" },
                              { bg: "from-orange-50 to-orange-100", text: "text-orange-700", border: "border-orange-200" },
                            ];
                            const scheme = colorSchemes[index] || colorSchemes[0];

                            return (
                              <div
                                key={index}
                                className={`flex flex-col md:flex-row items-center gap-6 p-8 bg-white rounded-3xl border-2 ${scheme.border} shadow-xl hover:shadow-2xl transition-all duration-300`}
                              >
                                {/* الصورة في اليسار */}
                                <div className={`w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-gradient-to-br ${scheme.bg} flex items-center justify-center p-4 shadow-lg flex-shrink-0`}>
                                  <img
                                    src={illustration}
                                    alt={`Illustration ${index + 1}`}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                {/* النص في اليمين */}
                                <div className="flex-1 text-center md:text-right">
                                  <p
                                    className={`text-2xl md:text-3xl font-black font-tajawal leading-relaxed ${scheme.text}`}
                                    style={{
                                      textShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                      WebkitFontSmoothing: "antialiased",
                                      MozOsxFontSmoothing: "grayscale",
                                    }}
                                  >
                                    {microLearningPoints[index] || ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : visualLayout === "grid" ? (
                        /* قالب الشبكة الحديثة - مظهر عصري */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                          {illustrations.map((illustration, index) => {
                            const colorSchemes = [
                              { bg: "from-emerald-50 via-green-50 to-emerald-100", text: "text-emerald-700", border: "border-emerald-200", shadow: "shadow-emerald-200/50" },
                              { bg: "from-blue-50 via-sky-50 to-blue-100", text: "text-blue-700", border: "border-blue-200", shadow: "shadow-blue-200/50" },
                              { bg: "from-orange-50 via-amber-50 to-orange-100", text: "text-orange-700", border: "border-orange-200", shadow: "shadow-orange-200/50" },
                            ];
                            const scheme = colorSchemes[index] || colorSchemes[0];

                            return (
                              <div
                                key={index}
                                className={`flex flex-col items-center text-center p-6 bg-white rounded-3xl border-2 ${scheme.border} shadow-lg ${scheme.shadow} hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`}
                              >
                                {/* الصورة الكرتونية - تصميم دائري */}
                                <div className={`relative w-56 h-56 mb-6 rounded-full border-4 border-white shadow-xl bg-gradient-to-br ${scheme.bg} flex items-center justify-center overflow-hidden`}>
                                  <img
                                    src={illustration}
                                    alt={`Illustration ${index + 1}`}
                                    className="w-full h-full object-contain p-4"
                                  />
                                </div>
                                {/* النص العربي */}
                                <p
                                  className={`text-xl font-black font-tajawal leading-relaxed ${scheme.text}`}
                                  style={{
                                    textShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                    WebkitFontSmoothing: "antialiased",
                                    MozOsxFontSmoothing: "grayscale",
                                  }}
                                >
                                  {microLearningPoints[index] || ""}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* قالب التدفق الدائري - موضوع وسطي */
                        <div className="relative max-w-5xl mx-auto" style={{ minHeight: "600px" }}>
                          {/* العنوان الرئيسي في الوسط */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full p-8 shadow-2xl border-4 border-white">
                              <h2 className="text-2xl font-black font-tajawal text-white text-center">
                                {suggestedTitle || "رسالة صحية"}
                              </h2>
                            </div>
                          </div>

                          {/* الصور والنصوص حول المركز */}
                          {illustrations.map((illustration, index) => {
                            const angle = (index * 2 * Math.PI) / illustrations.length;
                            const radius = 220;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;

                            const colorSchemes = [
                              { bg: "from-emerald-50 to-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
                              { bg: "from-blue-50 to-blue-100", text: "text-blue-700", border: "border-blue-200" },
                              { bg: "from-orange-50 to-orange-100", text: "text-orange-700", border: "border-orange-200" },
                            ];
                            const scheme = colorSchemes[index] || colorSchemes[0];

                            return (
                              <div
                                key={index}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                style={{
                                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                }}
                              >
                                <div className={`flex flex-col items-center text-center w-64 p-6 bg-white rounded-2xl border-2 ${scheme.border} shadow-xl`}>
                                  {/* الصورة */}
                                  <div className={`w-40 h-40 mb-4 rounded-full bg-gradient-to-br ${scheme.bg} flex items-center justify-center p-3 shadow-lg`}>
                                    <img
                                      src={illustration}
                                      alt={`Illustration ${index + 1}`}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  {/* النص */}
                                  <p
                                    className={`text-lg font-black font-tajawal leading-relaxed ${scheme.text}`}
                                    style={{
                                      textShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                      WebkitFontSmoothing: "antialiased",
                                      MozOsxFontSmoothing: "grayscale",
                                    }}
                                  >
                                    {microLearningPoints[index] || ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* تذييل رسمي يحمل اسم المركز والمصدر */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
                      <div className="flex justify-between items-center flex-wrap gap-4 text-sm">
                        <div className="flex-1 text-center">
                          <p className="font-bold mb-1">
                            تم الإعداد بواسطة: {healthCenterName || "قطاع كركوك الأول"}
                          </p>
                          {sources.length > 0 && (
                            <p className="text-xs text-gray-300 mt-2">
                              المصدر: {sources.join(" / ")}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 text-right">
                          {language === "tr"
                            ? "Kerkük Birinci Sektör Sağlık Müdürlüğü"
                            : "دائرة صحة كركوك - وحدة تعزيز الصحة"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 min-h-[900px]">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">سيظهر الإنفوجرافيك المكوّني هنا</p>
                    </div>
                  </div>
                )}
              </div>

                      {/* أزرار الإجراءات */}
                      {illustrations.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={handleShareToChat}
                      disabled={!suggestedTitle || isExporting}
                      className="py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>مشاركة</span>
                    </button>
                    <button
                      onClick={() => handleExport("png")}
                      disabled={isExporting}
                      className="py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>جاري التصدير...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>PNG</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      disabled={isExporting}
                      className="py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>جاري التصدير...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  >
                    إعادة التوليد
                  </button>
                </div>
              )}
            </div>

            {/* معلومات QR Code */}
            {qrCodeUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-bold text-blue-700">QR Code تلقائي</p>
                </div>
                <p className="text-xs text-blue-600">
                  سيتم تضمين QR Code في البوستر يوجه المستخدمين إلى الموقع الرسمي
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
