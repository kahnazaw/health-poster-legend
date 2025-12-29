"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, Copy, TrendingUp, Calendar, Globe, Sparkles, Users, Image as ImageIcon, Eye } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface PosterItem {
  id: string;
  user_id: string;
  campaign_type: string;
  target_audience: string;
  visual_style: string;
  language: "ar" | "tr";
  generated_at: string;
  suggested_title?: string;
  prompt?: string;
  image_url?: string;
  download_count?: number;
  user_name?: string;
}

export default function GalleryPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [posters, setPosters] = useState<PosterItem[]>([]);
  const [filteredPosters, setFilteredPosters] = useState<PosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<PosterItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // فلاتر البحث
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCampaignType, setFilterCampaignType] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "trending" | "downloads">("recent");

  const campaignTypes = [
    { value: "vaccination", label: "حملة تلقيح" },
    { value: "health_awareness", label: "توعية صحية" },
    { value: "administrative", label: "إعلان إداري" },
    { value: "prevention", label: "الوقاية من الأمراض" },
    { value: "nutrition", label: "التغذية الصحية" },
    { value: "maternal_health", label: "صحة الأم والطفل" },
  ];

  // جلب البوسترات من قاعدة البيانات
  useEffect(() => {
    fetchPosters();
  }, []);

  // تطبيق الفلاتر والبحث
  useEffect(() => {
    let filtered = [...posters];

    // فلترة حسب نوع الحملة
    if (filterCampaignType) {
      filtered = filtered.filter((p) => p.campaign_type === filterCampaignType);
    }

    // فلترة حسب اللغة
    if (filterLanguage) {
      filtered = filtered.filter((p) => p.language === filterLanguage);
    }

    // فلترة حسب التاريخ
    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      filtered = filtered.filter((p) => {
        const posterDate = new Date(p.generated_at);
        return posterDate.toDateString() === filterDateObj.toDateString();
      });
    }

    // البحث النصي
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.suggested_title?.toLowerCase().includes(query) ||
          campaignTypes.find((ct) => ct.value === p.campaign_type)?.label.toLowerCase().includes(query) ||
          p.prompt?.toLowerCase().includes(query)
      );
    }

    // الترتيب
    if (sortBy === "trending" || sortBy === "downloads") {
      filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    } else if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
    }

    setFilteredPosters(filtered);
  }, [posters, filterCampaignType, filterLanguage, filterDate, searchQuery, sortBy]);

  const fetchPosters = async () => {
    try {
      setLoading(true);
      
      // جلب آخر 50 بوستر مع معلومات المستخدم
      const { data, error } = await supabase
        .from("poster_analytics")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .order("generated_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // معالجة البيانات
      const processedPosters: PosterItem[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        campaign_type: item.campaign_type,
        target_audience: item.target_audience,
        visual_style: item.visual_style,
        language: item.language,
        generated_at: item.generated_at,
        suggested_title: item.suggested_title,
        prompt: item.prompt,
        image_url: item.image_url,
        download_count: item.download_count || 0,
        user_name: item.profiles?.full_name || "مستخدم",
      }));

      setPosters(processedPosters);
    } catch (error) {
      console.error("Error fetching posters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseThisStyle = (poster: PosterItem) => {
    // توجيه إلى poster-studio مع تعبئة الخيارات
    const params = new URLSearchParams({
      campaignType: poster.campaign_type,
      targetAudience: poster.target_audience,
      visualStyle: poster.visual_style,
      language: poster.language,
    });
    router.push(`/poster-studio?${params.toString()}`);
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      alert("تم نسخ البرومبت بنجاح!");
    } catch (error) {
      console.error("Error copying prompt:", error);
      alert("فشل نسخ البرومبت");
    }
  };

  const getCampaignLabel = (value: string) => {
    return campaignTypes.find((ct) => ct.value === value)?.label || value;
  };

  const getTags = (poster: PosterItem): string[] => {
    const tags: string[] = [];
    
    // Tags بناءً على نوع الحملة
    if (poster.campaign_type === "vaccination") tags.push("#تلقيح_كركوك");
    if (poster.campaign_type === "maternal_health") tags.push("#صحة_الطفل");
    if (poster.campaign_type === "prevention") tags.push("#الوقاية");
    if (poster.campaign_type === "nutrition") tags.push("#التغذية_الصحية");
    
    // Tags بناءً على الجمهور
    if (poster.target_audience === "children") tags.push("#صحة_الأطفال");
    if (poster.target_audience === "elderly") tags.push("#كبار_السن");
    if (poster.target_audience === "women") tags.push("#صحة_المرأة");
    
    // Tag اللغة
    if (poster.language === "tr") tags.push("#تركماني");
    
    return tags;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المعرض...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ترويسة */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-white rounded-xl p-2 shadow-sm border border-slate-100">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#059669] font-tajawal">
                  المعرض الرقمي للحملات الصحية
                </h1>
                <p className="text-sm text-gray-600 mt-1">أرشيف شامل لجميع البوسترات التوعوية - قطاع كركوك الأول</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">إجمالي البوسترات</p>
              <p className="text-2xl font-black text-emerald-600">{filteredPosters.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* شريط البحث والفلترة */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث في البوسترات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* فلترة نوع الحملة */}
            <select
              value={filterCampaignType}
              onChange={(e) => setFilterCampaignType(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">جميع أنواع الحملات</option>
              {campaignTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* فلترة اللغة */}
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">جميع اللغات</option>
              <option value="ar">العربية</option>
              <option value="tr">التركمانية</option>
            </select>

            {/* الترتيب */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recent" | "trending" | "downloads")}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="recent">الأحدث</option>
              <option value="trending">الأكثر رواجاً</option>
              <option value="downloads">الأكثر تحميلاً</option>
            </select>
          </div>

          {/* فلترة التاريخ */}
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                إلغاء فلترة التاريخ
              </button>
            )}
          </div>
        </div>

        {/* شبكة البوسترات */}
        {filteredPosters.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">لا توجد بوسترات متاحة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosters.map((poster) => (
              <div
                key={poster.id}
                onClick={() => {
                  setSelectedPoster(poster);
                  setShowModal(true);
                }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                {/* صورة البوستر */}
                <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden">
                  {poster.image_url ? (
                    <img
                      src={poster.image_url}
                      alt={poster.suggested_title || "Poster"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Badge الأكثر رواجاً */}
                  {poster.download_count && poster.download_count > 5 && (
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      رواج
                    </div>
                  )}
                </div>

                {/* معلومات البوستر */}
                <div className="p-4">
                  <h3 className="font-black text-gray-900 mb-2 line-clamp-2">
                    {poster.suggested_title || getCampaignLabel(poster.campaign_type)}
                  </h3>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {getTags(poster).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* معلومات إضافية */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>{poster.language === "ar" ? "عربي" : "تركماني"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(poster.generated_at).toLocaleDateString("ar-IQ")}</span>
                    </div>
                  </div>

                  {/* عداد التحميلات */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Download className="w-3 h-3" />
                      <span>{poster.download_count || 0} تحميل</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {poster.user_name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal عرض البوستر الكامل */}
      {showModal && selectedPoster && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  {selectedPoster.suggested_title || getCampaignLabel(selectedPoster.campaign_type)}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* صورة البوستر */}
              {selectedPoster.image_url && (
                <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-200">
                  <img
                    src={selectedPoster.image_url}
                    alt={selectedPoster.suggested_title || "Poster"}
                    className="w-full"
                  />
                </div>
              )}

              {/* معلومات البوستر */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 mb-1">نوع الحملة</p>
                  <p className="font-black text-gray-900">{getCampaignLabel(selectedPoster.campaign_type)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 mb-1">الجمهور المستهدف</p>
                  <p className="font-black text-gray-900">{selectedPoster.target_audience}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 mb-1">الأسلوب الفني</p>
                  <p className="font-black text-gray-900">{selectedPoster.visual_style}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 mb-1">اللغة</p>
                  <p className="font-black text-gray-900">{selectedPoster.language === "ar" ? "العربية" : "التركمانية"}</p>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={() => {
                    if (selectedPoster.image_url) {
                      const link = document.createElement("a");
                      link.href = selectedPoster.image_url;
                      link.download = `بوستر_${selectedPoster.suggested_title || selectedPoster.id}.png`;
                      link.click();
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  تحميل بدقة عالية
                </button>
                <button
                  onClick={() => handleUseThisStyle(selectedPoster)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  استخدام هذا النمط
                </button>
                {selectedPoster.prompt && (
                  <button
                    onClick={() => handleCopyPrompt(selectedPoster.prompt!)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    نسخ البرومبت
                  </button>
                )}
              </div>

              {/* البرومبت المستخدم */}
              {selectedPoster.prompt && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 mb-2">البرومبت المستخدم:</p>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedPoster.prompt}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

