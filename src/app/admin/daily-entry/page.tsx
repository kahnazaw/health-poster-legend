"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Users, Presentation, UsersRound, Save, CheckCircle, AlertCircle } from "lucide-react";

interface HealthTopic {
  id: string;
  category_name: string;
  topic_name: string;
  display_order: number;
}

interface DailyEntry {
  topic_id: string;
  individual_meetings: number;
  lectures: number;
  seminars: number;
}

export default function DailyEntryPage() {
  const { user, profile } = useAuth();
  const [topics, setTopics] = useState<HealthTopic[]>([]);
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [existingEntries, setExistingEntries] = useState<Set<string>>(new Set());

  // جلب المواضيع الصحية
  useEffect(() => {
    fetchTopics();
  }, []);

  // جلب الإدخالات الموجودة للتاريخ المحدد
  useEffect(() => {
    if (user && selectedDate) {
      fetchExistingEntries();
    }
  }, [user, selectedDate]);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from("health_topics")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setTopics(data || []);

      // تهيئة الإدخالات
      const initialEntries: Record<string, DailyEntry> = {};
      data?.forEach((topic) => {
        initialEntries[topic.id] = {
          topic_id: topic.id,
          individual_meetings: 0,
          lectures: 0,
          seminars: 0,
        };
      });
      setEntries(initialEntries);
    } catch (error: any) {
      console.error("Error fetching topics:", error);
      alert("حدث خطأ أثناء جلب المواضيع الصحية");
    }
  };

  const fetchExistingEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_statistics")
        .select("topic_id, individual_meetings, lectures, seminars")
        .eq("user_id", user?.id)
        .eq("entry_date", selectedDate);

      if (error) throw error;

      // تحديث الإدخالات الموجودة
      const updatedEntries = { ...entries };
      const existing = new Set<string>();

      data?.forEach((entry) => {
        updatedEntries[entry.topic_id] = {
          topic_id: entry.topic_id,
          individual_meetings: entry.individual_meetings || 0,
          lectures: entry.lectures || 0,
          seminars: entry.seminars || 0,
        };
        existing.add(entry.topic_id);
      });

      setEntries(updatedEntries);
      setExistingEntries(existing);
    } catch (error: any) {
      console.error("Error fetching existing entries:", error);
    }
  };

  const handleInputChange = (
    topicId: string,
    field: "individual_meetings" | "lectures" | "seminars",
    value: number
  ) => {
    setEntries((prev) => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        [field]: Math.max(0, value), // منع القيم السالبة
      },
    }));
  };

  const handleSave = async () => {
    if (!user || !profile) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const entriesToSave = Object.values(entries).map((entry) => ({
        user_id: user.id,
        center_id: user.id, // استخدام user.id كـ center_id لأن profiles.id = auth.users.id
        topic_id: entry.topic_id,
        individual_meetings: entry.individual_meetings,
        lectures: entry.lectures,
        seminars: entry.seminars,
        entry_date: selectedDate,
      }));

      // حذف الإدخالات القديمة للتاريخ المحدد
      if (existingEntries.size > 0) {
        const { error: deleteError } = await supabase
          .from("daily_statistics")
          .delete()
          .eq("user_id", user.id)
          .eq("entry_date", selectedDate);

        if (deleteError) throw deleteError;
      }

      // إدراج الإدخالات الجديدة
      const { error: insertError } = await supabase
        .from("daily_statistics")
        .insert(entriesToSave);

      if (insertError) throw insertError;

      setSaveStatus("success");
      setExistingEntries(new Set(entriesToSave.map((e) => e.topic_id)));

      // إعادة جلب الإدخالات
      await fetchExistingEntries();

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: any) {
      console.error("Error saving entries:", error);
      setSaveStatus("error");
      alert(`حدث خطأ أثناء الحفظ: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // تجميع المواضيع حسب الفئة
  const groupedTopics = topics.reduce((acc, topic) => {
    if (!acc[topic.category_name]) {
      acc[topic.category_name] = [];
    }
    acc[topic.category_name].push(topic);
    return acc;
  }, {} as Record<string, HealthTopic[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* الهيدر */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#059669] font-tajawal">
                إدخال الإحصائيات اليومية
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {profile?.health_center_name || "مركز صحي"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* رسالة الحالة */}
        {saveStatus === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 font-bold">تم حفظ البيانات بنجاح!</p>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-bold">حدث خطأ أثناء الحفظ</p>
          </div>
        )}

        {/* جدول الإدخال */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-right font-black text-sm">الفئة</th>
                  <th className="px-6 py-4 text-right font-black text-sm">الموضوع</th>
                  <th className="px-6 py-4 text-center font-black text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="w-4 h-4" />
                      اللقاءات الفردية
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-black text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Presentation className="w-4 h-4" />
                      المحاضرات
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-black text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <UsersRound className="w-4 h-4" />
                      الندوات
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(groupedTopics).map(([category, categoryTopics]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={5}
                        className="px-6 py-3 font-black text-gray-800 text-sm"
                      >
                        {category}
                      </td>
                    </tr>
                    {categoryTopics.map((topic) => {
                      const entry = entries[topic.id] || {
                        topic_id: topic.id,
                        individual_meetings: 0,
                        lectures: 0,
                        seminars: 0,
                      };
                      const isExisting = existingEntries.has(topic.id);

                      return (
                        <tr
                          key={topic.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            isExisting ? "bg-emerald-50/30" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-gray-500 text-sm"></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {topic.topic_name}
                              </span>
                              {isExisting && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                  محفوظ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              value={entry.individual_meetings}
                              onChange={(e) =>
                                handleInputChange(
                                  topic.id,
                                  "individual_meetings",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-semibold"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              value={entry.lectures}
                              onChange={(e) =>
                                handleInputChange(
                                  topic.id,
                                  "lectures",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-semibold"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              value={entry.seminars}
                              onChange={(e) =>
                                handleInputChange(
                                  topic.id,
                                  "seminars",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-semibold"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* زر الحفظ */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-black text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>حفظ الإحصائيات</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

