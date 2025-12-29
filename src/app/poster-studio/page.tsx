"use client";

import { useState } from "react";
import { Sparkles, Image as ImageIcon, Palette, Users, Zap } from "lucide-react";
import Image from "next/image";

export default function PosterStudioPage() {
  const [campaignType, setCampaignType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const campaignTypes = [
    { value: "vaccination", label: "حملة تلقيح" },
    { value: "health_awareness", label: "توعية صحية" },
    { value: "administrative", label: "إعلان إداري" },
    { value: "prevention", label: "الوقاية من الأمراض" },
    { value: "nutrition", label: "التغذية الصحية" },
    { value: "maternal_health", label: "صحة الأم والطفل" },
  ];

  const targetAudiences = [
    { value: "children", label: "أطفال" },
    { value: "elderly", label: "كبار السن" },
    { value: "medical_staff", label: "الطاقم الطبي" },
    { value: "general_public", label: "عامة الناس" },
    { value: "women", label: "النساء" },
    { value: "youth", label: "الشباب" },
  ];

  const visualStyles = [
    { value: "official_trusted", label: "رسمي وموثوق" },
    { value: "friendly_cartoon", label: "ودي كرتوني (للأطفال)" },
    { value: "modern_infographic", label: "إنفوجرافيك حديث" },
    { value: "minimalist", label: "تصميم بسيط وأنيق" },
    { value: "vibrant", label: "ملون وجذاب" },
  ];

  const handleGenerate = async () => {
    if (!campaignType || !targetAudience || !visualStyle) {
      alert("يرجى اختيار جميع الخيارات المطلوبة");
      return;
    }

    setIsGenerating(true);
    // TODO: إضافة منطق توليد الصورة بالذكاء الاصطناعي
    setTimeout(() => {
      setGeneratedImage("/logo.png"); // صورة مؤقتة للاختبار
      setIsGenerating(false);
    }, 2000);
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
                {/* نوع الحملة الصحية */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    نوع الحملة الصحية
                  </label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 font-medium"
                  >
                    <option value="">اختر نوع الحملة</option>
                    {campaignTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* الجمهور المستهدف */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    الجمهور المستهدف
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 font-medium"
                  >
                    <option value="">اختر الجمهور المستهدف</option>
                    {targetAudiences.map((audience) => (
                      <option key={audience.value} value={audience.value}>
                        {audience.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* الأسلوب الفني */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    الأسلوب الفني
                  </label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 font-medium"
                  >
                    <option value="">اختر الأسلوب الفني</option>
                    {visualStyles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* زر التوليد */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !campaignType || !targetAudience || !visualStyle}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-black text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري التوليد...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>توليد البوستر بالذكاء الاصطناعي</span>
                    </>
                  )}
                </button>
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

              {/* منطقة المعاينة مع الطبقات المتراكبة */}
              <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                {/* الطبقة الخلفية - صورة الذكاء الاصطناعي */}
                <div className="absolute inset-0">
                  {generatedImage ? (
                    <Image
                      src={generatedImage}
                      alt="Generated Poster"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="text-center">
                        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">سيظهر البوستر المولد هنا</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* الطبقة العلوية - شريط الشعار */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-600/90 to-emerald-700/90 backdrop-blur-sm p-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 bg-white rounded-lg p-1.5">
                        <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                      </div>
                      <div className="text-white">
                        <p className="text-sm font-black">دائرة صحة كركوك</p>
                        <p className="text-xs font-bold opacity-90">القطاع الأول</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* الطبقة السفلية - التذييل الرسمي */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm p-4 z-10">
                  <div className="text-center">
                    <p className="text-white text-sm font-bold">
                      رسالة صحية معتمدة من قطاع كركوك الأول
                    </p>
                    <p className="text-white/80 text-xs mt-1">
                      دائرة صحة كركوك - وحدة تعزيز الصحة
                    </p>
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              {generatedImage && (
                <div className="mt-4 flex gap-3">
                  <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                    تحميل البوستر
                  </button>
                  <button className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors">
                    إعادة التوليد
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

