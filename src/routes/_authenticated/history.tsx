import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, Empty, PageIntro, SectionTitle, Stat } from "@/components/menara-ui";
import { PaymentImage, StatusBadge } from "@/components/payment-ui";
import { meta, rupiah } from "@/lib/menara-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { tanggal, type DepositRequest, type WithdrawRequest } from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/history")({
  head: () =>
    meta("Riwayat Transaksi", "Pantau seluruh permintaan deposit dan penarikan akun Anda."),
  component: Page,
});

type Item = {
  id: string;
  kind: "Deposit" | "Penarikan";
  amount: number;
  detail: string;
  status: DepositRequest["status"];
  note: string | null;
  proof: string | null;
  created_at: string;
};

const tabs = ["Semua", "Deposit", "Penarikan"] as const;

function Page() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Semua");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [dep, wit] = await Promise.all([
      supabase
        .from("deposit_requests")
        .select("id,amount,method,status,admin_note,proof_path,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("withdraw_requests")
        .select("id,amount,method,account_number,status,admin_note,proof_path,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    const list: Item[] = [
      ...(dep.data ?? []).map((d) => ({
        id: d.id,
        kind: "Deposit" as const,
        amount: Number(d.amount),
        detail: d.method,
        status: d.status as DepositRequest["status"],
        note: d.admin_note,
        proof: null,
        created_at: d.created_at,
      })),
      ...(wit.data ?? []).map((w) => ({
        id: w.id,
        kind: "Penarikan" as const,
        amount: Number(w.amount),
        detail: `${w.method} • ${w.account_number}`,
        status: w.status as WithdrawRequest["status"],
        note: w.admin_note,
        proof: w.proof_path,
        created_at: w.created_at,
      })),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at));
    setItems(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(
    () => (tab === "Semua" ? items : items.filter((i) => i.kind === tab)),
    [items, tab],
  );

  const masuk = items
    .filter((i) => i.kind === "Deposit" && i.status === "approved")
    .reduce((s, i) => s + i.amount, 0);
  const keluar = items
    .filter((i) => i.kind === "Penarikan" && i.status === "approved")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <AppShell back="/profile" title="RIWAYAT TRANSAKSI">
      <PageIntro eyebrow="AKTIVITAS KEUANGAN" title="Riwayat Transaksi">
        Pantau permintaan deposit dan penarikan beserta statusnya dalam satu tampilan.
      </PageIntro>

      <Stat
        label={`Selisih Pemasukan & Pengeluaran • ${items.length} transaksi`}
        value={rupiah(masuk - keluar)}
        accent
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Total Deposit Disetujui" value={rupiah(masuk)} />
        <Stat label="Total Penarikan Disetujui" value={rupiah(keluar)} />
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Akumulasi seluruh riwayat, bukan saldo tersedia.
      </p>

      <div className="my-5 grid grid-cols-3 gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            className={tab === t ? "btn-primary" : "btn-secondary"}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mb-2 text-right text-[10px] text-muted-foreground">
        {shown.length} dari {items.length} transaksi
      </p>

      <div className="space-y-2">
        {shown.map((i) => (
          <Card key={`${i.kind}-${i.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-primary">{rupiah(i.amount)}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {i.kind} • {i.detail}
                </p>
                <p className="text-[11px] text-muted-foreground">{tanggal(i.created_at)}</p>
              </div>
              <StatusBadge status={i.status} />
            </div>
            {i.note && (
              <p className="mt-2 text-[11px] text-muted-foreground">Catatan admin: {i.note}</p>
            )}
            {i.proof && (
              <div className="mt-3">
                <p className="label">Bukti Transfer Admin</p>
                <PaymentImage path={i.proof} alt="Bukti transfer dari admin" className="max-h-72" />
              </div>
            )}
          </Card>
        ))}
        {!loading && shown.length === 0 && (
          <Empty
            title="Belum Ada Transaksi"
            text="Riwayat deposit dan penarikan Anda akan muncul di halaman ini."
          />
        )}
      </div>

      <SectionTitle>Aksi Cepat</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Link to="/deposit" className="btn-secondary">
          Deposit
        </Link>
        <Link to="/withdraw" className="btn-secondary">
          Penarikan
        </Link>
      </div>
    </AppShell>
  );
}
