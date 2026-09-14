import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Card, Notice, PageIntro, SectionTitle, Stat } from "@/components/menara-ui";
import { meta, rupiah } from "@/lib/menara-data";
import { fetchProduct, type Product } from "@/lib/content";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/package/details/$id")({
  head: () => meta("Detail Produk", "Rincian paket sebelum pembelian."),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<Product | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadBalance = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setBalance(null);
    const { data } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", auth.user.id)
      .maybeSingle();
    setBalance(Number(data?.balance ?? 0));
  };

  useEffect(() => {
    void fetchProduct(id).then(setP);
    void loadBalance();
  }, [id]);

  async function buy() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setBusy(false);
      void navigate({ to: "/auth" });
      return;
    }
    const { error } = await supabase.rpc("buy_product", { _product_id: id });
    if (error) setErr(error.message);
    else {
      setMsg("Pembelian berhasil. Produk aktif dapat dilihat di Portofolio.");
      await loadBalance();
    }
    setBusy(false);
  }

  if (!p) {
    return (
      <AppShell back="/vip" title="DETAIL PRODUK">
        <Card>Memuat produk…</Card>
      </AppShell>
    );
  }

  const enough = balance !== null && balance >= p.price;

  return (
    <AppShell back="/vip" title="DETAIL PRODUK">
      <PageIntro eyebrow={p.type} title={p.name}>
        Rincian sebelum pembelian • Kode produk #{p.id.slice(0, 8).toUpperCase()}
      </PageIntro>
      <Card>
        <p className="font-display text-3xl font-bold text-primary">{rupiah(p.price)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Estimasi Harian" value={rupiah(p.daily)} />
          <Stat label="Masa Aktif" value={`${p.days} hari`} />
          <Stat label="Estimasi Hasil" value={rupiah(p.total)} accent />
          <Stat label="Tipe Produk" value={p.type} />
        </div>
      </Card>
      <SectionTitle>Saldo Pembelian</SectionTitle>
      <Card>
        <div className="data-row">
          <span>Sumber dana</span>
          <strong>Saldo deposit</strong>
        </div>
        <div className="data-row">
          <span>Saldo tersedia</span>
          <strong>{balance === null ? "Belum masuk" : rupiah(balance)}</strong>
        </div>
        <div className="data-row">
          <span>Estimasi sisa saldo</span>
          <strong>{balance === null ? "-" : rupiah(Math.max(0, balance - p.price))}</strong>
        </div>
        {!enough && balance !== null && (
          <Notice>Saldo kurang {rupiah(p.price - balance)}. Silakan isi saldo dulu.</Notice>
        )}
        <button
          onClick={() => void buy()}
          disabled={busy || !enough}
          className="btn-primary mt-3 w-full disabled:opacity-50"
        >
          {busy ? "Memproses…" : "Beli Sekarang"}
        </button>
        {msg && <p className="mt-3 text-center text-xs text-primary">{msg}</p>}
        {err && <p className="mt-3 text-center text-xs text-destructive">{err}</p>}
      </Card>
      <SectionTitle>Informasi Paket</SectionTitle>
      <Card>
        {[
          ["Harga paket", rupiah(p.price)],
          ["Estimasi harian", rupiah(p.daily)],
          ["Estimasi hasil total", rupiah(p.total)],
          ["Masa berlaku", `${p.days} hari`],
          [
            "Rasio estimasi",
            `${((p.total / Math.max(1, p.price)) * 100).toFixed(1).replace(".", ",")}%`,
          ],
          ["Tipe produk", p.type],
        ].map((x) => (
          <div className="data-row" key={x[0]}>
            <span>{x[0]}</span>
            <strong>{x[1]}</strong>
          </div>
        ))}
      </Card>
      <SectionTitle>Tentang Produk</SectionTitle>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {p.description ??
          "Paket investasi Velocity Driver dengan estimasi hasil berkala. Periksa seluruh rincian dan risiko sebelum membeli."}
      </p>
      <Link to="/deposit" className="btn-secondary mt-4 w-full">
        Isi Saldo
      </Link>
    </AppShell>
  );
}
