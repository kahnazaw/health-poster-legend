"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Paperclip, Image as ImageIcon, Users, Hash, MessageSquare, Plus, Search, Bell, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatRoom {
  id: string;
  name: string;
  type: "public" | "private" | "group";
  description?: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: "text" | "image" | "poster" | "file" | "link";
  metadata?: any;
  created_at: string;
  user_name?: string;
  user_center?: string;
}

export default function ChatPage() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      fetchRooms();
      checkNotificationPermission();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      subscribeToMessages();
      markAsRead();
    }
    return () => {
      if (selectedRoom) {
        unsubscribeFromMessages();
      }
    };
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
      }
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // جلب عدد الرسائل غير المقروءة لكل غرفة
      const roomsWithUnread = await Promise.all(
        (data || []).map(async (room) => {
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id)
            .gt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // آخر 7 أيام

          return {
            ...room,
            unread_count: count || 0,
          };
        })
      );

      setRooms(roomsWithUnread as ChatRoom[]);

      // تحديد القناة العامة كافتراضية
      const publicRoom = roomsWithUnread.find((r) => r.type === "public");
      if (publicRoom) {
        setSelectedRoom(publicRoom.id);
      }
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoom) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          profiles!inner(full_name, health_center_name)
        `)
        .eq("room_id", selectedRoom)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      const formattedMessages = (data || []).map((msg: any) => ({
        ...msg,
        user_name: msg.profiles?.full_name || "غير معروف",
        user_center: msg.profiles?.health_center_name || "",
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedRoom) return;

    // إلغاء الاشتراك السابق إن وجد
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room:${selectedRoom}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${selectedRoom}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          fetchUserInfo(newMessage.user_id).then((userInfo) => {
            setMessages((prev) => [
              ...prev,
              {
                ...newMessage,
                user_name: userInfo.full_name,
                user_center: userInfo.health_center_name,
              },
            ]);

            // إرسال تنبيه
            if (notificationsEnabled && newMessage.user_id !== user?.id) {
              showNotification(newMessage, userInfo);
            }
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return channel;
  };

  const unsubscribeFromMessages = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const fetchUserInfo = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, health_center_name")
      .eq("id", userId)
      .single();

    return {
      full_name: data?.full_name || "غير معروف",
      health_center_name: data?.health_center_name || "",
    };
  };

  const showNotification = (message: ChatMessage, userInfo: any) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`${userInfo.full_name} - ${userInfo.health_center_name}`, {
        body: message.content.substring(0, 100),
        icon: "/logo.png",
        tag: message.id,
      });
    }
  };

  const markAsRead = async () => {
    if (!selectedRoom || !user) return;

    await supabase
      .from("chat_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", selectedRoom)
      .eq("user_id", user.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      const { error } = await supabase.from("chat_messages").insert({
        room_id: selectedRoom,
        user_id: user.id,
        content: newMessage.trim(),
        message_type: "text",
      });

      if (error) throw error;

      const messageContent = newMessage.trim();
      setNewMessage("");

      // استدعاء المساعد الآلي (فقط في القنوات العامة والمجموعات)
      const currentRoom = rooms.find((r) => r.id === selectedRoom);
      if (currentRoom && (currentRoom.type === "public" || currentRoom.type === "group")) {
        // انتظر قليلاً ثم استدع المساعد
        setTimeout(async () => {
          try {
            await fetch("/api/chat/bot", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: messageContent,
                userId: user.id,
                roomId: selectedRoom,
              }),
            });
          } catch (error) {
            console.error("Error calling bot:", error);
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert("حدث خطأ أثناء إرسال الرسالة");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentRoom = rooms.find((r) => r.id === selectedRoom);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* الشريط الجانبي */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* الهيدر */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-emerald-700">
          <h1 className="text-xl font-black text-white font-tajawal flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            الدردشة
          </h1>
          <p className="text-sm text-emerald-100 mt-1">قطاع كركوك الأول</p>
        </div>

        {/* البحث */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في المحادثات..."
              className="w-full pr-10 pl-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* قائمة الغرف */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-bold text-gray-500 mb-2 px-2">القنوات</div>
            {rooms
              .filter((r) => r.type === "public" || r.type === "group")
              .map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full text-right p-3 rounded-xl mb-2 transition-colors flex items-center gap-3 ${
                    selectedRoom === room.id
                      ? "bg-emerald-100 text-emerald-700 font-bold"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {room.type === "public" ? (
                    <Hash className="w-5 h-5" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{room.name}</div>
                    {room.description && (
                      <div className="text-xs text-gray-500 truncate">{room.description}</div>
                    )}
                  </div>
                  {room.unread_count && room.unread_count > 0 && (
                    <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                      {room.unread_count}
                    </span>
                  )}
                </button>
              ))}

            <div className="text-xs font-bold text-gray-500 mb-2 px-2 mt-4">الرسائل الخاصة</div>
            {rooms
              .filter((r) => r.type === "private")
              .map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full text-right p-3 rounded-xl mb-2 transition-colors flex items-center gap-3 ${
                    selectedRoom === room.id
                      ? "bg-emerald-100 text-emerald-700 font-bold"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <div className="flex-1 font-semibold">{room.name}</div>
                  {room.unread_count && room.unread_count > 0 && (
                    <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                      {room.unread_count}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* إعدادات */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={requestNotificationPermission}
            className="w-full flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            <span className="text-sm font-semibold">
              {notificationsEnabled ? "التنبيهات مفعلة" : "تفعيل التنبيهات"}
            </span>
          </button>
        </div>
      </div>

      {/* منطقة الدردشة */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* هيدر الغرفة */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900 font-tajawal">{currentRoom?.name}</h2>
                  {currentRoom?.description && (
                    <p className="text-sm text-gray-600">{currentRoom.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {currentRoom?.type === "public" && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                      عامة
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* الرسائل */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <p className="mt-2 text-gray-600">جاري تحميل الرسائل...</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.user_id === user?.id ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          message.user_name === "مساعد قطاع كركوك الأول" ? "bg-purple-600" : "bg-emerald-600"
                        }`}
                      >
                        {message.user_name === "مساعد قطاع كركوك الأول" ? "🤖" : message.user_name?.charAt(0) || "?"}
                      </div>
                      <div className={`flex-1 ${message.user_id === user?.id ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{message.user_name}</span>
                          {message.user_name === "مساعد قطاع كركوك الأول" && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              مساعد ذكي
                            </span>
                          )}
                          {message.user_center && message.user_name !== "مساعد قطاع كركوك الأول" && (
                            <span className="text-xs text-gray-500">{message.user_center}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString("ar", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={`inline-block px-4 py-2 rounded-2xl ${
                            message.user_id === user?.id
                              ? "bg-emerald-600 text-white"
                              : message.user_name === "مساعد قطاع كركوك الأول"
                              ? "bg-purple-50 border-2 border-purple-200 text-gray-900"
                              : "bg-white border border-gray-200 text-gray-900"
                          }`}
                        >
                          {message.message_type === "poster" && message.metadata?.imageUrl ? (
                            <div className="space-y-2">
                              <p className="font-bold mb-2">{message.content}</p>
                              <div className="bg-white rounded-lg p-2">
                                <img
                                  src={message.metadata.imageUrl}
                                  alt={message.metadata.title}
                                  className="max-w-full h-auto rounded-lg"
                                />
                                {message.metadata.microLearningPoints && (
                                  <div className="mt-2 text-sm">
                                    <p className="font-bold mb-1">النقاط التعليمية:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {message.metadata.microLearningPoints.map((point: string, idx: number) => (
                                        <li key={idx}>{point}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* إدخال الرسالة */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="إرفاق ملف"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="إرسال صورة"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالة..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  إرسال
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">اختر محادثة للبدء</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

