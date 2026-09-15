import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meta } from "@/lib/menara-data";

export const Route = createFileRoute("/auth")({
  head: () => meta("Masuk Akun", "Masuk ke akun investor atau panel admin Velocity Driver."),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function landingFor(userId: string, userEmail?: string) {
    if (userEmail === "admin@velocitydriver.com") return "/admin" as const;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return data ? ("/admin" as const) : ("/home" as const);
  }

  useEffect(() => {
    if (!isMounted) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const to = await landingFor(data.session.user.id, data.session.user.email);
      void navigate({ to, replace: true });
    });
  }, [navigate, isMounted]);

  async function handleQuickLogin(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setBusy(true);
    setMsg(null);
    try {
      const { data: signIn, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });
      if (error) throw error;
      const to =
        demoEmail === "admin@velocitydriver.com" ? ("/admin" as const) : ("/home" as const);
      await navigate({ to, replace: true });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (email.trim().toLowerCase() === "admin@velocitydriver.com") {
          await navigate({ to: "/admin", replace: true });
        } else {
          const to = signIn.user
            ? await landingFor(signIn.user.id, signIn.user.email)
            : ("/home" as const);
          await navigate({ to, replace: true });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg("Akun dibuat. Cek email Anda untuk konfirmasi sebelum masuk.");
        } else {
          const uid = data.session.user.id;
          await supabase.from("profiles").upsert({ id: uid, email, full_name: name || email });
          await supabase.from("user_roles").insert({ user_id: uid, role: "user" });
          await navigate({ to: "/home", replace: true });
        }
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  if (!isMounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-stage">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center border-x border-border bg-background px-5 py-10 shadow-app">
        <div className="mb-6 flex items-center gap-3">
          <div className="brand-mark">
            <Crown size={18} />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-primary">VELOCITY DRIVER</p>
            <p className="text-[9px] font-semibold uppercase text-muted-foreground">Portal Akun</p>
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold">
          {mode === "login" ? "Masuk ke akun Anda" : "Buat akun baru"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akun admin otomatis diarahkan ke panel admin setelah masuk.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <div>
              <label className="label" htmlFor="name">
                Nama Lengkap
              </label>
              <input
                id="name"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {msg && <p className="notice">{msg}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? "Memproses…" : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 text-xs text-muted-foreground underline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMsg(null);
          }}
        >
          {mode === "login" ? "Belum punya akun? Daftar di sini" : "Sudah punya akun? Masuk"}
        </button>

        <div className="mt-6 rounded-md border border-primary/30 bg-muted/60 p-3.5 text-xs">
          <p className="font-bold text-primary flex items-center justify-between mb-2">
            <span>Akses Cepat Akun Demo</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase font-mono">
              1-Klik
            </span>
          </p>
          <div className="space-y-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleQuickLogin("admin@velocitydriver.com", "Velocity123!")}
              className="w-full flex items-center justify-between p-2.5 rounded bg-primary/10 hover:bg-primary/20 border border-primary/40 text-left transition-colors text-xs disabled:opacity-50"
            >
              <div>
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Crown size={14} className="text-primary" />
                  Masuk sebagai Admin Demo
                </p>
                <p className="text-[10px] text-muted-foreground">
                  admin@velocitydriver.com • Panel & Sidebar Lengkap
                </p>
              </div>
              <span className="text-primary font-bold text-[11px] shrink-0">&rarr;</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleQuickLogin("user@velocitydriver.com", "Velocity123!")}
              className="w-full flex items-center justify-between p-2.5 rounded bg-secondary/80 hover:bg-secondary border border-border text-left transition-colors text-xs disabled:opacity-50"
            >
              <div>
                <p className="font-medium text-foreground">Masuk sebagai Investor Demo</p>
                <p className="text-[10px] text-muted-foreground">
                  user@velocitydriver.com • Tampilan Dasbor User
                </p>
              </div>
              <span className="text-muted-foreground font-bold text-[11px] shrink-0">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
