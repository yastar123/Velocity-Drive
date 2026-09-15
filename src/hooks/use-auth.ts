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
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem("velocity_user");
      if (raw) {
        const u = JSON.parse(raw);
        return {
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh",
          user: u,
        };
      }
    } catch {
      /* ignore invalid JSON in storage */
    }
    return null;
  });
  const [role, setRole] = useState<AppRole | null>(() => {
    try {
      const raw = localStorage.getItem("velocity_user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u.role === "admin" || u.email === "admin@velocitydriver.com") return "admin";
        return u.role || "user";
      }
    } catch {
      /* ignore invalid JSON in storage */
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s: any) => {
      if (!active) return;
      setSession(s);
      if (!s) {
        setRole(null);
      } else if (
        s.user?.email === "admin@velocitydriver.com" ||
        (s.user as any)?.role === "admin"
      ) {
        setRole("admin");
      }
    });
    supabase.auth.getSession().then(({ data }: any) => {
      if (active) {
        setSession(data.session);
        if (
          data.session?.user?.email === "admin@velocitydriver.com" ||
          (data.session?.user as any)?.role === "admin"
        ) {
          setRole("admin");
        }
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
      if (email === "admin@velocitydriver.com") {
        setRole("admin");
        return;
      }
      const existing = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
      if (!existing.data) {
        await supabase.from("profiles").insert({ id: userId, email, full_name: fullName ?? email });
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      let roles = (data ?? []).map((r: any) => r.role as AppRole);

      // Hardcode admin fallback for the demo account if DB is down or unseeded
      if (email === "admin@velocitydriver.com") {
        roles = ["admin"];
      }

      if (roles.length === 0 && !error) {
        await supabase.from("user_roles").insert({ user_id: userId, role: "user" });
        roles = ["user"];
      }
      if (!active) return;
      setRole(roles.includes("admin") ? "admin" : (roles[0] ?? "user"));
    })();
    return () => {
      active = false;
    };
  }, [userId, email, fullName]);

  const isAdmin = role === "admin" || email === "admin@velocitydriver.com";

  return {
    session,
    user: session?.user ?? (null as User | null),
    role: isAdmin ? "admin" : (role ?? "user"),
    isAdmin,
    loading,
  };
}
