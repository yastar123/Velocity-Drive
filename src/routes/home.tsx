import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import {
  AppShell,
  Card,
  CopyButton,
  Notice,
  PageIntro,
  QuickActions,
  SectionTitle,
  Stat,
} from "@/components/menara-ui";
import { meta, rupiah } from "@/lib/menara-data";
import { WelcomeModal } from "@/components/welcome-modal";
import { BannerCarousel } from "@/components/banner-carousel";
import {
  fetchAnnouncements,
  fetchSiteContent,
  fetchProducts,
  getProductImageUrl,
  type Announcement,
  type Product,
} from "@/lib/content";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/home")({
  head: () => meta("Dasbor Investor", "Ringkasan saldo, armada investasi, dan akses utama akun."),
  component: HomePage,
});

function HomePage() {
  const { isAdmin } = useAuth();
  const [news, setNews] = useState<Announcement[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState(0);
  const [deposited, setDeposited] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [refCode, setRefCode] = useState("VELOCITY99");
  const [userName, setUserName] = useState("Investor");

  useEffect(() => {
    void fetchAnnouncements().then(setNews);
    void fetchSiteContent().then(setText);
    void fetchProducts().then((p) => setProducts(p.slice(0, 4)));
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const emailName = auth.user.email ? auth.user.email.split("@")[0] : "Investor";
      setUserName(emailName);

      const [{ data: profile }, { data: deps }, { count }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, balance, referral_code")
          .eq("id", auth.user.id)
          .maybeSingle(),
        supabase
          .from("deposit_requests")
          .select("amount")
          .eq("user_id", auth.user.id)
          .eq("status", "approved"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.user.id)
          .eq("status", "active"),
      ]);
      if (profile?.full_name?.trim()) {
        setUserName(profile.full_name.trim());
      }
      setBalance(Number(profile?.balance ?? 0));
      if (profile?.referral_code) setRefCode(profile.referral_code);
      setDeposited((deps ?? []).reduce((s, d) => s + Number(d.amount ?? 0), 0));
      setActiveCount(count ?? 0);
    })();
  }, []);

  return (
    <AppShell>
      {isAdmin && (
        <Link to="/admin" className="btn-primary mb-4 w-full">
          Buka Panel Admin
        </Link>
      )}

      <div>
        <PageIntro
          eyebrow="DASBOR INVESTOR"
          title={text["home_hero_title"] ?? "Selamat datang di Velocity Driver"}
        >
          {text["home_hero_text"] ?? "Pantau saldo dan armada investasi supercar Anda."}
        </PageIntro>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Saldo Utama (IDR)</p>
            <p className="mt-2 font-display text-4xl font-bold">{rupiah(balance)}</p>
            <p className="mt-1 text-xs text-primary">Saldo tersedia untuk pembelian armada</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Stat label="Total Deposit" value={rupiah(deposited)} />
          <Stat label="Produk Aktif" value={`${activeCount} Armada`} accent />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link className="btn-primary" to="/deposit">
            Isi Saldo
          </Link>
          <Link className="btn-secondary" to="/withdraw">
            Penarikan
          </Link>
        </div>
      </Card>

      {news.length > 0 && (
        <div className="my-4 overflow-hidden border-y border-border py-2 text-[10px] text-primary">
          <p className="whitespace-nowrap">● {news.map((n) => n.message).join("  •  ")}</p>
        </div>
      )}

      <div className="my-4">
        <QuickActions />
      </div>

      {/* Auto-Rotating Full-Width Banner Carousel */}
      <div className="my-4">
        <BannerCarousel />
      </div>

      {/* Featured Fleet Section */}
      <SectionTitle
        aside={
          <Link to="/vip" className="flex items-center gap-1 text-xs font-semibold text-primary">
            Lihat Semua <ChevronRight className="size-3.5" />
          </Link>
        }
      >
        Armada Investasi Pilihan
      </SectionTitle>

      <div className="space-y-3">
        {products.map((p) => (
          <Card
            key={p.id}
            className="group overflow-hidden p-3 transition-all hover:border-primary/40"
          >
            <div className="flex gap-3">
              <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={getProductImageUrl(p)}
                  alt={p.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80";
                  }}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <h3 className="truncate font-display text-sm font-bold text-foreground">
                    {p.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-primary">{rupiah(p.price)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Profit {rupiah(p.daily)}/hari • {p.days} hari
                  </p>
                </div>
                <Link
                  to="/package/details/$id"
                  params={{ id: p.id }}
                  className="mt-2 inline-flex w-fit items-center rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20"
                >
                  Beli Armada
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Kode Referral Anda</SectionTitle>
      <Card>
        <p className="font-display text-base font-bold">Ajak rekan & raih komisi hingga 30%</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Bagikan kode referral Anda ke relasi dan dapatkan komisi instan saat mereka membeli
          armada.
        </p>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-muted p-2.5">
          <code className="font-mono text-sm font-bold text-primary">{refCode}</code>
          <CopyButton text={refCode} />
        </div>
        <Link to="/my-team" className="btn-secondary mt-3 w-full">
          Lihat Tim Saya
        </Link>
      </Card>

      {/* Bottom Trust Claims Section */}
      <div className="mt-8 mb-5 grid grid-cols-2 gap-2.5 text-center sm:grid-cols-4">
        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-sm">
          <ShieldCheck className="mx-auto size-5 text-emerald-500" />
          <strong className="mt-1.5 block text-xs font-bold text-foreground leading-tight">
            Investasi aman
          </strong>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-sm">
          <TrendingUp className="mx-auto size-5 text-primary" />
          <strong className="mt-1.5 block text-xs font-bold text-foreground leading-tight">
            Profit stabil
          </strong>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-sm">
          <Zap className="mx-auto size-5 text-amber-500" />
          <strong className="mt-1.5 block text-xs font-bold text-foreground leading-tight">
            Profit harian langsung masuk
          </strong>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-sm">
          <CheckCircle2 className="mx-auto size-5 text-blue-500" />
          <strong className="mt-1.5 block text-xs font-bold text-foreground leading-tight">
            Transparan terpercaya
          </strong>
        </div>
      </div>

      <Notice className="my-5">
        Profit dihitung berdasarkan paket harian dan masuk otomatis setiap jam ke saldo Anda.
      </Notice>
      <p className="mt-6 mb-4 text-center text-[10px] text-muted-foreground">
        © 2026 Velocity Driver
      </p>

      {/* Pop Up Selamat Datang Setengah Layar Bawah */}
      <WelcomeModal userName={userName} telegramUrl={text.telegram_url || "https://t.me/"} />
    </AppShell>
  );
}
