import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, Empty, PageIntro, Stat } from "@/components/menara-ui";
import { meta, rupiah } from "@/lib/menara-data";
import { fetchMyOrders, type Order } from "@/lib/content";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ordered")({
  head: () => meta("Portofolio Aktif", "Pantau produk aktif dan jadwal klaim."),
  component: Page,
});

function Page() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setSignedIn(false);
      setOrders(await fetchMyOrders(data.user.id));
    })();
  }, []);

  const active = orders.filter((o) => o.status === "active");
  const earnings = active.reduce((s, o) => s + o.total, 0);

  return (
    <AppShell>
      <PageIntro eyebrow="PORTOFOLIO" title="Portofolio & Produk Aktif">
        Pantau setiap langkah, pendapatan, progres, dan jadwal klaim.
      </PageIntro>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat label="Estimasi Hasil" value={rupiah(earnings)} accent />
        <Stat label="Produk Aktif" value={String(active.length)} />
      </div>
      {!signedIn && <Card>Masuk untuk melihat produk aktif Anda.</Card>}
      {signedIn && orders.length === 0 && (
        <Empty
          title="Belum Ada Produk Aktif"
          text="Produk yang Anda beli akan muncul di sini lengkap dengan progres dan jadwal klaim."
        />
      )}
      <div className="space-y-2">
        {orders.map((o) => (
          <Card key={o.id}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-base font-bold">{o.product_name}</h2>
                <p className="text-[10px] uppercase text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("id-ID")} • {o.status}
                </p>
              </div>
              <span className="font-display text-sm font-bold text-primary">{rupiah(o.price)}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Harian" value={rupiah(o.daily)} />
              <Stat label="Profit / Jam" value={rupiah(Math.round(o.daily / 24))} accent />
              <Stat label="Durasi" value={`${o.days} hari`} />
            </div>
            <div className="mt-2.5 rounded border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-400">
              ⚡ <strong>Profit Masuk Per Jam:</strong> {rupiah(Math.round(o.daily / 24))} dihitung
              & masuk otomatis setiap jam ke saldo Anda.
            </div>
          </Card>
        ))}
      </div>
      <Link to="/vip" className="btn-primary mt-4 w-full">
        Lihat Produk
      </Link>
    </AppShell>
  );
}
