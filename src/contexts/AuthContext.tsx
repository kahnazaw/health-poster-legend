"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, SignInWithPasswordCredentials } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export interface Profile {
  full_name: string;
  health_center_name?: string; // Optional field - removed from requirements
  role: "admin" | "center_user";
  is_approved: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, health_center_name, role, is_approved")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        // Fallback to user metadata if profile doesn't exist yet
        const metadata = currentUser.user_metadata;
        if (metadata?.full_name) {
          setProfile({
            full_name: String(metadata.full_name),
            health_center_name: metadata.health_center_name ? String(metadata.health_center_name) : undefined,
            role: metadata.role === "admin" ? "admin" : "center_user",
            is_approved: Boolean(metadata.is_approved),
          });
        } else {
          setProfile(null);
        }
      } else if (data) {
        setProfile({
          full_name: data.full_name || "",
          health_center_name: data.health_center_name || undefined,
          role: (data.role === "admin" ? "admin" : "center_user") as "admin" | "center_user",
          is_approved: Boolean(data.is_approved),
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // تحميل الجلسة فوراً (مهم جداً بعد إعادة التحميل)
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        
        if (error) {
          console.error("Error loading session:", error);
        }
        
        setUser(currentUser);
        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error in loadSession:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // الاستماع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}