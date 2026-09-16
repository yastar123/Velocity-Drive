import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Building2,
  Copy,
  Crown,
  History,
  Home,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

export function AppShell({
  children,
  back,
  title = "VELOCITY DRIVER",
  subtitle = "KENDALIKAN KECEPATAN FINANSIAL ANDA",
}: {
  children: ReactNode;
  back?: string;
  title?: string;
  subtitle?: string;
}) {
  const { isAdmin } = useAuth();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.verified) {
          setIsHealthy(true);
        } else {
          setIsHealthy(false);
        }
      })
      .catch(() => {
        setIsHealthy(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-stage">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden border-x border-border bg-background shadow-app">
        {isAdmin && (
          <div className="bg-primary px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-black shadow-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown size={14} className="shrink-0" />
              <span className="truncate">Mode Admin Aktif</span>
            </div>
            <Link
              to="/admin"
              className="shrink-0 bg-black text-primary hover:bg-black/80 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors"
            >
              Buka Panel Admin &rarr;
            </Link>
          </div>
        )}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {back ? (
                <>
                  <Link to={back as "/"} className="icon-btn shrink-0" aria-label="Kembali">
                    <ArrowLeft size={18} />
                  </Link>
                  <Link to="/home" className="flex shrink-0 items-center">
                    <img
                      src="/logo.png"
                      alt="Velocity Driver"
                      className="h-7 w-auto shrink-0 object-contain"
                    />
                  </Link>
                </>
              ) : (
                <Link to="/home" className="flex shrink-0 items-center">
                  <img
                    src="/logo.png"
                    alt="Velocity Driver"
                    className="h-8 w-auto shrink-0 object-contain"
                  />
                </Link>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-primary">{title}</p>
                <p className="truncate text-[9px] font-semibold uppercase text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        </header>
        <div className="px-4 pb-28 pt-4">{children}</div>
        <BottomNav />
      </div>
    </main>
  );
}
export function BottomNav() {
  const { isAdmin } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = [
    ["/home", "Home", Home],
    ["/ordered", "Aktif", Sparkles],
    ["/vip", "Produk", Package],
    ["/my-team", "Team", Users],
    ["/profile", "Profil", UserRound],
    ...(isAdmin ? [["/admin", "Admin", Crown] as const] : []),
  ] as const;
  return (
    <nav
      className={`fixed bottom-0 left-1/2 z-50 grid w-full max-w-[430px] -translate-x-1/2 ${isAdmin ? "grid-cols-6" : "grid-cols-5"} border-t border-border bg-nav px-1 py-2`}
    >
      {nav.map(([to, label, Icon]) => (
        <Link
          key={to}
          to={to}
          className={`nav-item ${path === to ? "nav-active" : ""} ${label === "Admin" ? "!text-primary font-bold" : ""}`}
        >
          <Icon size={19} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="mb-5">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-foreground">
        {title}
      </h1>
      {children && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>}
    </section>
  );
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}
export function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong className={accent ? "text-primary" : ""}>{value}</strong>
    </div>
  );
}
export function QuickActions({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {[
        ["/deposit", "Isi Saldo", ArrowDownToLine],
        ["/withdraw", "Penarikan", ArrowUpFromLine],
        ["/history", "Riwayat", History],
        ["/add-bank-create", "Bank", WalletCards],
      ].map(([to, label, I]) => {
        const Icon = I as typeof Home;
        return (
          <Link key={label as string} to={to as "/"} className="quick">
            <Icon size={19} />
            <span>{label as string}</span>
          </Link>
        );
      })}
    </div>
  );
}
export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-bold">{children}</h2>
      {aside}
    </div>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <Card className="py-10 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-md bg-secondary text-primary">
        <Building2 />
      </div>
      <h2 className="font-display font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">{text}</p>
    </Card>
  );
}
export function Notice({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`notice ${className}`}>
      <ShieldCheck className="shrink-0 text-primary" size={16} />
      <span className="flex-1">{children}</span>
    </div>
  );
}
export function CopyButton({ text }: { text: string }) {
  return (
    <button
      className="icon-btn"
      aria-label="Salin"
      onClick={() => void navigator.clipboard.writeText(text)}
    >
      <Copy size={16} />
    </button>
  );
}
