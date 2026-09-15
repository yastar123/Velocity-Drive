/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s: any) => {
      if (!active) return;
      setSession(s);
      if (!s) setRole(null);
    });
    supabase.auth.getSession().then(({ data }: any) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;
  const email = session?.user.email ?? null;
  const fullName = (session?.user.user_metadata?.["full_name"] as string | undefined) ?? null;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void (async () => {
      const existing = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
      if (!existing.data) {
        await supabase.from("profiles").insert({ id: userId, email, full_name: fullName ?? email });
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      let roles = (data ?? []).map((r: any) => r.role as AppRole);
      if (roles.length === 0) {
        await supabase.from("user_roles").insert({ user_id: userId, role: "user" });
        roles = ["user"];
      }
      if (!active) return;
      setRole(roles.includes("admin") ? "admin" : (roles[0] ?? "user"));
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return {
    session,
    user: session?.user ?? (null as User | null),
    role,
    isAdmin: role === "admin",
    loading,
  };
}
