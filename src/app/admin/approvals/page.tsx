"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  health_center_name: string;
  created_at: string;
}

export default function AdminApprovalsPage() {
  const { signOut } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("id, email, full_name, health_center_name, created_at")
        .eq("is_approved", false)
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Error fetching pending users:", fetchError);
        setError("حدث خطأ أثناء تحميل قائمة المستخدمين");
      } else {
        setPendingUsers(data || []);
        setError("");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setApproving(userId);
      setError("");
      setSuccessMessage("");

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("id", userId);

      if (updateError) {
        console.error("Error approving user:", updateError);
        setError("حدث خطأ أثناء الموافقة على المستخدم");
        setApproving(null);
        return;
      }

      setSuccessMessage("تمت الموافقة على المستخدم بنجاح");
      setApproving(null);

      // Reload the list
      await loadPendingUsers();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ غير متوقع");
      setApproving(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <main className="min-h-screen bg-gray-50">
        {/* Official Header */}
        <div className="bg-white border-b-2 border-emerald-600 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                تسجيل الخروج
              </button>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                <img
                  src="/logo.png"
                  alt="شعار دائرة صحة كركوك"
                  className="h-20 w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                دائرة صحة كركوك
              </h2>
              <p className="text-lg text-gray-700 mb-1">قطاع كركوك الأول</p>
              <p className="text-base text-gray-600 mb-4">وحدة تعزيز الصحة</p>
              <h1 className="text-xl font-semibold text-emerald-700 border-t border-gray-200 pt-4">
                لوحة الموافقة على المستخدمين
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              قائمة المستخدمين المعلقة الموافقة
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">جاري التحميل...</p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p className="text-lg">لا توجد طلبات موافقة معلقة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        الاسم الرباعي
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        اسم المركز الصحي
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        البريد الإلكتروني
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        تاريخ التسجيل
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        الإجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {user.full_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {user.health_center_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={approving === user.id}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {approving === user.id
                              ? "جاري الموافقة..."
                              : "موافقة"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

