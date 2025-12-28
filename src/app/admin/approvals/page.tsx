"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  health_center_name: string;
  role: "admin" | "center_user";
  is_approved: boolean;
  created_at: string;
}

export default function AdminApprovalsPage() {
  const { signOut } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const { data: pendingData, error: pendingError } = await supabase
        .from("profiles")
        .select("id, email, full_name, health_center_name, role, is_approved, created_at")
        .eq("is_approved", false)
        .order("created_at", { ascending: true });

      const { data: allData, error: allError } = await supabase
        .from("profiles")
        .select("id, email, full_name, health_center_name, role, is_approved, created_at")
        .order("created_at", { ascending: false });

      if (pendingError || allError) {
        console.error("Error fetching users:", pendingError || allError);
        setError("حدث خطأ أثناء تحميل قائمة المستخدمين");
      } else {
        setPendingUsers(pendingData || []);
        setAllUsers(allData || []);
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

      // Log audit event
      await logAudit(userId, "approved");

      setSuccessMessage("تمت الموافقة على المستخدم بنجاح");
      setApproving(null);
      await loadPendingUsers();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ غير متوقع");
      setApproving(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setRejecting(userId);
      setError("");
      setSuccessMessage("");

      // Log audit event
      await logAudit(userId, "rejected");

      // Option: Keep user but mark as rejected, or delete
      // For now, we'll keep the user but they remain unapproved
      // Admin can delete manually if needed
      setSuccessMessage("تم رفض المستخدم (يمكن حذفه يدوياً إذا لزم الأمر)");
      setRejecting(null);
      await loadPendingUsers();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ غير متوقع");
      setRejecting(null);
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {showAll ? "قائمة جميع المستخدمين" : "قائمة المستخدمين المعلقة الموافقة"}
              </h2>
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showAll ? "إظهار المعلقة فقط" : "إظهار الكل"}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">جاري التحميل...</p>
              </div>
            ) : (showAll ? allUsers : pendingUsers).length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p className="text-lg">لا توجد {showAll ? "مستخدمين" : "طلبات موافقة معلقة"}</p>
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
                        الدور
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        حالة الموافقة
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        الإجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAll ? allUsers : pendingUsers).map((user) => (
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
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {user.role === "admin" ? "مدير" : "مستخدم مركز"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.is_approved
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {user.is_approved ? "موافق عليه" : "قيد المراجعة"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            {!user.is_approved && (
                              <>
                                <button
                                  onClick={() => handleApprove(user.id)}
                                  disabled={approving === user.id}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  {approving === user.id ? "..." : "✅ موافقة"}
                                </button>
                                <button
                                  onClick={() => handleReject(user.id)}
                                  disabled={rejecting === user.id}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  {rejecting === user.id ? "..." : "❌ رفض"}
                                </button>
                              </>
                            )}
                            {user.is_approved && (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </div>
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

