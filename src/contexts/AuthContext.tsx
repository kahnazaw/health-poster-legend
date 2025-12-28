"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, SignInWithPasswordCredentials } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export interface Profile {
  full_name: string;
  health_center_name: string;
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
        if (metadata?.full_name && metadata?.health_center_name) {
          setProfile({
            full_name: String(metadata.full_name),
            health_center_name: String(metadata.health_center_name),
            role: metadata.role === "admin" ? "admin" : "center_user",
            is_approved: Boolean(metadata.is_approved),
          });
        } else {
          setProfile(null);
        }
      } else if (data) {
        setProfile({
          full_name: data.full_name || "",
          health_center_name: data.health_center_name || "",
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser);
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