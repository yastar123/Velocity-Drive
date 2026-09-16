import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gift,
  ArrowDownToLine,
  ArrowUpFromLine,
  Percent,
  Clock,
  Users,
  Zap,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Car,
} from "lucide-react";
import { AppShell, Card, QuickActions } from "@/components/menara-ui";
import { meta, rupiah } from "@/lib/menara-data";
import { fetchProducts, getProductImageUrl, type Product } from "@/lib/content";

export const Route = createFileRoute("/vip")({
  head: () => meta("Katalog Produk", "Pilih armada kendaraan dan paket investasi Velocity Driver."),
  component: Page,
});

// Brand colors and metadata mapping for realistic vehicle styling
const carMeta: Record<string, { brand: string; color: string; badgeBg: string }> = {
  "Toyota Supra": {
    brand: "TOYOTA",
    color: "text-amber-500",
    badgeBg: "bg-amber-500/10 border-amber-500/20",
  },
  "Honda Civic Type R": {
    brand: "HONDA",
    color: "text-red-500",
    badgeBg: "bg-red-500/10 border-red-500/20",
  },
  "Mitsubishi Lancer Evo X": {
    brand: "MITSUBISHI",
    color: "text-rose-600",
    badgeBg: "bg-rose-600/10 border-rose-600/20",
  },
  "Mazda MX-5": {
    brand: "MAZDA",
    color: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  "BMW M5": { brand: "BMW", color: "text-blue-500", badgeBg: "bg-blue-500/10 border-blue-500/20" },
  "Mercedes-Benz AMG GT": {
    brand: "MERCEDES-BENZ",
    color: "text-slate-400",
    badgeBg: "bg-slate-500/10 border-slate-500/20",
  },
  "Audi R8": {
    brand: "AUDI",
    color: "text-orange-500",
    badgeBg: "bg-orange-500/10 border-orange-500/20",
  },
  "Porsche 911": {
    brand: "PORSCHE",
    color: "text-yellow-500",
    badgeBg: "bg-yellow-500/10 border-yellow-500/20",
  },
  Lamborghini: {
    brand: "LAMBORGHINI",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-400/10 border-emerald-400/20",
  },
};

function Page() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchProducts().then((p) => {
      setItems(p);
      setLoading(false);
    });
  }, []);

  // Filter out any VIP items as requested
  const list = items.filter((p) => p.type !== "VIP");

  return (
    <AppShell>
      {/* Top Rules / Information Grid */}
      <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Gift className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase">
              Bonus Daftar
            </span>
            <strong className="block text-xs font-bold text-foreground">Rp20.000</strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
            <ArrowDownToLine className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase">
              Min. Deposit
            </span>
            <strong className="block text-xs font-bold text-foreground">Rp150.000</strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
            <ArrowUpFromLine className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase">
              Min. Penarikan
            </span>
            <strong className="block text-xs font-bold text-foreground">Rp50.000</strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
            <Percent className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase">
              Fee Penarikan
            </span>
            <strong className="block text-xs font-bold text-foreground">6% + Rp5.000</strong>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-2 flex items-center gap-2.5 rounded-lg border border-border/80 bg-card p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Clock className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase">
              Penarikan
            </span>
            <strong className="block text-xs font-bold text-foreground">24 Jam Bebas</strong>
          </div>
        </div>
      </div>

      {/* Referral & Hourly Profit Banners */}
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Users className="size-4 shrink-0 text-primary" />
            <div>
              <span className="text-[11px] font-bold text-foreground">KOMISI REFERRAL: </span>
              <span className="text-[11px] font-extrabold text-primary">30% - 3% - 1%</span>
              <p className="text-[10px] text-muted-foreground">
                LEVEL 1 (30%) • LEVEL 2 (3%) • LEVEL 3 (1%)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5">
          <Zap className="size-4 shrink-0 text-emerald-500" />
          <div>
            <span className="text-[11px] font-bold text-foreground">PROFIT MASUK PER JAM: </span>
            <span className="text-[11px] text-muted-foreground">
              Profit dihitung dan masuk otomatis setiap jam ke saldo.
            </span>
          </div>
        </div>
      </div>

      <div className="my-4">
        <QuickActions />
      </div>

      {/* Section Header */}
      <div className="mt-6 flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <Car className="size-4 text-primary" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Daftar Paket Produk
          </h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          {list.length} Armada
        </span>
      </div>

      {loading && (
        <Card className="mt-3 text-center py-6 text-sm text-muted-foreground">
          Memuat armada produk…
        </Card>
      )}
      {!loading && list.length === 0 && <Card className="mt-3">Belum ada produk tersedia.</Card>}

      {/* Product Cards List */}
      <div className="mt-3 space-y-3">
        {list.map((p, idx) => {
          const metaInfo = carMeta[p.name] || {
            brand: "SUPERCAR",
            color: "text-primary",
            badgeBg: "bg-primary/10 border-primary/20",
          };
          const imageUrl = getProductImageUrl(p);

          return (
            <Card
              key={p.id}
              className="group relative overflow-hidden border-border transition-all hover:border-primary/40 p-3"
            >
              {/* Car Image Banner */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={imageUrl}
                  alt={p.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-md border ${metaInfo.badgeBg} ${metaInfo.color} bg-background/85`}
                  >
                    {metaInfo.brand}
                  </span>
                </div>

                <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                  #{idx + 1}
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between text-white">
                  <div>
                    <h3 className="font-display text-base font-bold text-white drop-shadow leading-tight">
                      {p.name}
                    </h3>
                    <span className="text-[10px] text-white/80 font-medium">
                      Aktif {p.days} Hari • {p.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] uppercase tracking-wider text-white/80 font-medium">
                      Harga Paket
                    </span>
                    <span className="font-display text-sm font-black text-amber-400 drop-shadow">
                      {rupiah(p.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profit & Duration Stats */}
              <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2 text-center">
                <div>
                  <span className="block text-[10px] text-muted-foreground">Profit Harian</span>
                  <strong className="block text-xs font-bold text-emerald-500">
                    {rupiah(p.daily)}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">Durasi</span>
                  <strong className="block text-xs font-bold text-foreground">{p.days} hari</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">Total Hasil</span>
                  <strong className="block text-xs font-bold text-primary">
                    {rupiah(p.total)}
                  </strong>
                </div>
              </div>

              <Link
                to="/package/details/$id"
                params={{ id: p.id }}
                className="btn-primary mt-2.5 flex w-full items-center justify-center gap-1.5 py-2 text-xs font-bold"
              >
                Beli Paket
              </Link>
            </Card>
          );
        })}
      </div>

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

      {/* Footer Note */}
      <div className="mt-4 mb-6 rounded-lg border border-dashed border-border p-3.5 text-center">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <strong>Catatan:</strong> Profit dihitung berdasarkan persentase paket harian, masuk
          setiap jam secara otomatis ke saldo Anda.
        </p>
      </div>
    </AppShell>
  );
}
