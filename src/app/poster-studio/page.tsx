"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Image as ImageIcon, Palette, Zap, Download, Globe, QrCode, Search, Building2, BookOpen, LayoutGrid, Clock, Target, List, Hash, CheckCircle, Share2, TrendingUp } from "lucide-react";
import Image from "next/image";
import { generateQRCodeDataUrl } from "@/lib/utils/qrCodeGenerator";
import { toPng } from "html-to-image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/audit";
import { generateSeasonalSuggestions, generateSmartSuggestions, getOfficialCategories, type TopicSuggestion } from "@/lib/ai/topicSuggestions";
import { factCheckHealthPoints, type FactCheckResult } from "@/lib/ai/factChecker";
import { generateMetadataBarcode } from "@/lib/utils/barcodeGenerator";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

// قائمة المراكز الصحية الـ 23
const healthCentersList = [
  "مركز صحي الحويجة",
  "مركز صحي الرشيد",
  "مركز صحي الشورجة",
  "مركز صحي العباسية",
  "مركز صحي الكرامة",
  "مركز صحي المأمون",
  "مركز صحي النصر",
  "مركز صحي الهاشمية",
  "مركز صحي الوحدة",
  "مركز صحي الحرية",
  "مركز صحي الشهداء",
  "مركز صحي السلام",
  "مركز صحي الجهاد",
  "مركز صحي الفردوس",
  "مركز صحي الزهراء",
  "مركز صحي الإخاء",
  "مركز صحي التضامن",
  "مركز صحي الأمل",
  "مركز صحي الفتح",
  "مركز صحي النهضة",
  "مركز صحي الدبس",
  "مركز صحي الزاب",
  "مركز صحي المفتي"
];

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
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [centerScore, setCenterScore] = useState(0);
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

  // جلب نقاط المركز الحالي
  useEffect(() => {
    const fetchCenterScore = async () => {
      if (!user || !profile?.health_center_name) return;
      
      try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);

        // جلب إحصائيات المركز
        const { data: statsData } = await supabase
          .from("daily_statistics")
          .select("individual_meetings, lectures, seminars")
          .gte("entry_date", startDate.toISOString().split("T")[0])
          .lte("entry_date", today.toISOString().split("T")[0]);

        // جلب عدد البوسترات
        const { data: postersData } = await supabase
          .from("poster_analytics")
          .select("id")
          .eq("user_id", user.id)
          .gte("generated_at", startDate.toISOString())
          .lte("generated_at", today.toISOString());

        const totalMeetings = statsData?.reduce((sum, s) => sum + (s.individual_meetings || 0), 0) || 0;
        const totalLectures = statsData?.reduce((sum, s) => sum + (s.lectures || 0), 0) || 0;
        const totalSeminars = statsData?.reduce((sum, s) => sum + (s.seminars || 0), 0) || 0;
        const totalPosters = postersData?.length || 0;

        // حساب النقاط (معادلة مبسطة)
        const score = (totalMeetings * 1) + (totalLectures * 2) + (totalSeminars * 3) + (totalPosters * 5);
        setCenterScore(Math.round(score));
      } catch (error) {
        console.error("Error fetching center score:", error);
      }
    };

    fetchCenterScore();
  }, [user, profile]);


  const handleGenerate = async () => {
    if (!topic || !topic.trim()) {
      alert("يرجى إدخال الموضوع الصحي");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setIllustrations([]);
    setSuggestedTitle("");
    setMicroLearningPoints([]);
    setSources([]);

    try {
      // محاكاة Progress Bar
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

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
      
      // إكمال Progress Bar
      setGenerationProgress(100);
      setTimeout(() => setGenerationProgress(0), 500);
      
      // تحديث البيانات مع البنية الجديدة
      setIllustrations(data.images || data.illustrations || []); // 3 صور منفصلة
      setSuggestedTitle(data.suggestedTitle || "");
      setSelectedImageIndex(0); // إعادة تعيين الفهرس
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
          // استخدام أول صورة من المصفوفة (أو null إذا لم تكن موجودة)
          const firstImageUrl = Array.isArray(data.images) && data.images.length > 0 
            ? data.images[0] 
            : data.imageUrl || null;
          
          await supabase.from("poster_analytics").insert({
            user_id: user.id,
            campaign_type: "infographic",
            target_audience: "general_public",
            visual_style: "modern_infographic",
            language: language,
            suggested_title: data.suggestedTitle,
            prompt: `الموضوع: ${topic}${healthCenterName ? ` | المركز: ${healthCenterName}` : ""}`,
            image_url: firstImageUrl,
            download_count: 0,
            generated_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error saving analytics:", error);
        }
      }
    } catch (error: any) {
      console.error("Error generating infographic:", error);
      setGenerationProgress(0);
      alert(`حدث خطأ أثناء توليد الإنفوجرافيك: ${error.message || "خطأ غير معروف"}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
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

  // Animation variants for Bento Grid cells
  const cellVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* الخلفية المتحركة "نبض الصحة" - محدثة للخلفية الداكنة */}
      <AnimatedBackground />
      
      {/* Bento Grid Layout - التصميم الأسطوري */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Bento Grid - 3 خلايا رئيسية */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* الخلية الكبرى - Main View (8 أعمدة) */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cellVariants}
            className="lg:col-span-8"
          >
            <div className="glass-effect rounded-3xl p-6 h-full min-h-[800px] relative">
              {/* شعار قطاع كركوك الأول - ثابت في الزاوية */}
              <div className="absolute top-6 left-6 z-10 glass-effect rounded-2xl p-3 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center neon-glow">
                    <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
            </div>
            <div>
                    <p className="text-xs font-black text-emerald-400 font-tajawal">قطاع كركوك الأول</p>
                    <p className="text-[10px] text-slate-400">استوديو التصميم</p>
            </div>
          </div>
        </div>

              {/* Progress Bar - يظهر أثناء التوليد */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 neon-glow"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-emerald-400 font-medium mt-2 text-center font-tajawal">
                    جاري توليد الإنفوجرافيك... {generationProgress}%
                  </p>
                </motion.div>
              )}

              {/* العنوان */}
              <div className="text-center mb-6 mt-16">
                <h2 className="text-2xl font-black text-emerald-400 font-tajawal mb-2 flex items-center justify-center gap-2">
                  <ImageIcon className="w-6 h-6 neon-glow" />
                  معاينة البوستر
                </h2>
              </div>

              {/* منطقة المعاينة - مع Neon Border */}
              <div
                ref={posterRef}
                id="infographic-canvas"
                className="relative w-full bg-white rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20"
                style={{ minHeight: "700px" }}
              >
                {illustrations.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full flex flex-col"
                    >
                      {/* الهيدر الرسمي */}
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 bg-white rounded-xl p-2 shadow-xl">
                              <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-contain" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-black font-tajawal">دائرة صحة كركوك</h2>
                              <p className="text-sm font-bold opacity-90">القطاع الأول</p>
                            </div>
                          </div>
                          {qrCodeUrl && (
                            <div className="w-16 h-16 bg-white rounded-xl p-2 shadow-xl">
                              <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                        {suggestedTitle && (
                          <div className="text-center">
                            <h1 className="text-3xl font-black font-tajawal mb-1">{suggestedTitle}</h1>
                            <p className="text-emerald-100 text-xs font-semibold">إرشادات صحية معتمدة</p>
                          </div>
                        )}
                      </div>

                      {/* الصور في مربعات زجاجية - مع إمكانية التبديل */}
                      <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
                          {illustrations.map((illustration, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.2, duration: 0.5 }}
                              className={`glass-effect rounded-2xl p-4 cursor-pointer transition-all ${
                                selectedImageIndex === index 
                                  ? "border-2 border-emerald-500 shadow-lg shadow-emerald-500/30" 
                                  : "border border-emerald-500/20 hover:border-emerald-500/40"
                              }`}
                              onClick={() => setSelectedImageIndex(index)}
                            >
                              <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4 mb-3">
                                <img
                                  src={illustration}
                                  alt={`Illustration ${index + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              {microLearningPoints[index] && (
                                <p className="text-sm font-bold text-emerald-700 font-tajawal text-center">
                                  {microLearningPoints[index]}
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* التذييل */}
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white">
                        <p className="text-sm font-bold font-tajawal text-center">
                          إعداد: {healthCenterName || "قطاع كركوك الأول"}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 min-h-[700px]">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium font-tajawal">سيظهر الإنفوجرافيك المكوّني هنا</p>
                    </div>
                  </div>
                )}
              </div>

              {/* زر تصدير PDF - مع Glow Effect */}
              {illustrations.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => handleExport("pdf")}
                  disabled={isExporting}
                  className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-black font-tajawal shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 neon-glow"
                >
                  {isExporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري التصدير...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>تصدير PDF</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* خلية الإعدادات - Control Panel (4 أعمدة) */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cellVariants}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* لوحة التحكم */}
            <div className="glass-effect rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center neon-glow">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-black text-emerald-400 font-tajawal">إعدادات البوستر</h2>
              </div>

          <div className="space-y-6">
                {/* حقل الموضوع - Floating Label */}
                <div className="relative">
                  <label className="absolute right-4 top-3 text-slate-400 text-sm font-medium flex items-center gap-2 pointer-events-none transition-all">
                    <Search className="w-4 h-4 text-emerald-500 neon-glow" />
                    <span className={topic ? "opacity-0" : ""}>المناسبة الصحية أو الموضوع</span>
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 pr-12 border-2 border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-slate-100 font-medium resize-none placeholder:text-slate-500"
                    placeholder=""
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="mt-3 p-4 bg-slate-800/50 rounded-xl border border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-2 font-tajawal">
                        <Sparkles className="w-3 h-3" />
                        مواضيع مقترحة
                      </p>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {suggestions.filter((s) => s.priority === "high").slice(0, 6).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setTopic(suggestion.topic);
                              setShowSuggestions(false);
                            }}
                            className="text-right p-3 bg-slate-900/50 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-slate-800/50 transition-all text-sm font-semibold text-slate-200"
                          >
                            <div className="flex items-center justify-between">
                              <span>{suggestion.topic}</span>
                              <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                                {suggestion.officialCategory}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {showSuggestions ? "إخفاء الاقتراحات" : "اقتراحات تلقائية"}
                  </button>
                </div>

                {/* اختيار المركز الصحي - من القائمة */}
                <div>
                  <label className="block text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2 font-tajawal">
                    <Building2 className="w-4 h-4 neon-glow" />
                    اسم المركز الصحي
                  </label>
                  <select
                    value={healthCenterName}
                    onChange={(e) => setHealthCenterName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-900/50 backdrop-blur-sm text-slate-100 font-medium"
                  >
                    <option value="">اختر المركز الصحي</option>
                    {healthCentersList.map((center, idx) => (
                      <option key={idx} value={center} className="bg-slate-800">
                        {center}
                      </option>
                    ))}
                  </select>
                </div>

                {/* زر التوليد */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className={`w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-black font-tajawal shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 neon-glow ${
                    !isGenerating ? "hover:scale-[1.02]" : ""
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري التوليد...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>توليد إنفوجرافيك ذكي</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* خلية الإحصائيات السريعة - Quick Stats */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={cellVariants}
              transition={{ delay: 0.4 }}
              className="glass-effect rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center neon-glow">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black text-emerald-400 font-tajawal">الإحصائيات السريعة</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-xs text-slate-400 mb-1 font-tajawal">رصيد النقاط الحالي</p>
                  <motion.p
                    key={centerScore}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-black text-emerald-400 font-tajawal"
                  >
                    {centerScore}
                  </motion.p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-xs text-slate-400 mb-1 font-tajawal">المركز الصحي</p>
                  <p className="text-sm font-bold text-slate-200 font-tajawal">
                    {healthCenterName || "غير محدد"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
