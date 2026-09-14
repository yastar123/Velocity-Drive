import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { fetchAnnouncements, fetchSiteContent, type Announcement } from "@/lib/content";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const floors = [
  ["L01", "Lantai Dasar", "Rp100.000", "1,2%/hari", 82],
  ["L02", "Lantai Perak", "Rp500.000", "1,5%/hari", 64],
  ["L03", "Lantai Emas", "Rp2.500.000", "1,8%/hari", 41],
  ["L04", "Lantai Mahkota", "Rp10.000.000", "2,2%/hari", 12],
] as const;

export const Route = createFileRoute("/home")({
  head: () => meta("Dasbor Investor", "Ringkasan saldo, lantai investasi, dan akses utama akun."),
  component: HomePage,
});

function HomePage() {
  const { isAdmin } = useAuth();
  const [news, setNews] = useState<Announcement[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState(0);
  const [deposited, setDeposited] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    void fetchAnnouncements().then(setNews);
    void fetchSiteContent().then(setText);
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const [{ data: profile }, { data: deps }, { count }] = await Promise.all([
        supabase.from("profiles").select("balance").eq("id", auth.user.id).maybeSingle(),
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
      setBalance(Number(profile?.balance ?? 0));
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
      <PageIntro
        eyebrow="DASBOR INVESTOR"
        title={text["home_hero_title"] ?? "Selamat datang kembali"}
      >
        {text["home_hero_text"] ?? "Pantau saldo dan progres investasi Anda."}
      </PageIntro>
      <Card className="overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Saldo Utama (IDR)</p>
            <p className="mt-2 font-display text-4xl font-bold">{rupiah(balance)}</p>
            <p className="mt-1 text-xs text-primary">Saldo tersedia untuk pembelian produk</p>
          </div>
          <span className="status-dot">AKTIF</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Stat label="Total Deposit" value={rupiah(deposited)} />
          <Stat label="Produk Aktif" value={`${activeCount} Produk`} accent />
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
      <QuickActions />
      <SectionTitle aside={<span className="text-xs text-primary">4 lantai</span>}>
        Lantai Investasi
      </SectionTitle>
      <div className="space-y-2">
        {floors.map((f) => (
          <Card key={f[0]}>
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span className="font-display text-sm font-bold text-primary">{f[0]}</span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold">{f[1]}</h3>
                <p className="text-[10px] text-muted-foreground">
                  Minimal {f[2]} • {f[3]}
                </p>
              </div>
              <span className="text-xs font-bold">{f[4]}%</span>
            </div>
            <div className="progress mt-3">
              <i style={{ width: `${f[4]}%` }} />
            </div>
          </Card>
        ))}
      </div>
      <SectionTitle>Undang & Tumbuh</SectionTitle>
      <Card>
        <p className="font-display text-lg font-bold">Ajak satu orang, tambah satu lantai</p>
        <div className="mt-3 flex items-center justify-between rounded bg-muted p-2">
          <code className="text-primary">963tts5608</code>
          <CopyButton text="963tts5608" />
        </div>
        <Link to="/my-team" className="btn-secondary mt-3 w-full">
          Lihat Tim Saya
        </Link>
      </Card>
      <SectionTitle>Tentang Kami</SectionTitle>
      <Card>
        <h3 className="font-display text-lg font-bold text-primary">
          {text["about_title"] ?? "Bangun kekayaan lantai demi lantai"}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {text["about_text"] ??
            "Model investasi berbasis lantai dengan informasi performa yang transparan."}
        </p>
        <Link to="/about" className="btn-secondary mt-4 w-full">
          Selengkapnya
        </Link>
      </Card>
      <Notice>Investasi memiliki risiko. Pelajari rincian produk sebelum membeli.</Notice>
      <p className="mt-6 text-center text-[10px] text-muted-foreground">© 2026 Velocity Driver</p>
    </AppShell>
  );
}
