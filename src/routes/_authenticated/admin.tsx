import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { meta, rupiah } from "@/lib/menara-data";
import { PaymentImage, StatusBadge } from "@/components/payment-ui";
import {
  fetchPaymentSettings,
  hhmm,
  tanggal,
  uploadPaymentImage,
  type DepositRequest,
  type PaymentSettings,
  type WithdrawRequest,
} from "@/lib/payments";
import { BonusPanel, ContentPanel, OrdersPanel, ProductsPanel } from "@/components/admin-crud";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () =>
    meta("Panel Admin", "Kelola deposit, penarikan, jam kerja, QRIS, akun, dan saldo pengguna."),
  component: AdminPage,
});

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  balance: number;
  role: "admin" | "user";
  created_at: string;
};

const tabs = [
  "Ringkasan",
  "Deposit",
  "Penarikan",
  "Akun",
  "Produk",
  "Pesanan",
  "Konten",
  "Bonus",
  "Pengaturan",
] as const;
type Tab = (typeof tabs)[number];

function AdminPage() {
  const { isAdmin, role, loading, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [rows, setRows] = useState<Row[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [totals, setTotals] = useState({
    products: 0,
    activeProducts: 0,
    orders: 0,
    activeOrders: 0,
  });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && role && !isAdmin) void navigate({ to: "/home", replace: true });
  }, [loading, role, isAdmin, navigate]);

  const load = useCallback(async () => {
    const [{ data: profiles, error: pe }, { data: roles }, dep, wit, s] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,balance,created_at").order("created_at"),
      supabase.from("user_roles").select("user_id,role"),
      supabase
        .from("deposit_requests")
        .select(
          "id,user_id,amount,method,sender_name,proof_path,status,admin_note,created_at,reviewed_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("withdraw_requests")
        .select(
          "id,user_id,amount,method,account_name,account_number,proof_path,status,admin_note,created_at,reviewed_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      fetchPaymentSettings(),
    ]);
    if (pe) {
      setErr(pe.message);
      return;
    }
    const map = new Map<string, "admin" | "user">();
    for (const r of roles ?? []) {
      const current = map.get(r.user_id);
      if (r.role === "admin" || !current) map.set(r.user_id, r.role as "admin" | "user");
    }
    setRows(
      (profiles ?? []).map((p) => ({
        ...p,
        balance: Number(p.balance ?? 0),
        role: map.get(p.id) ?? "user",
      })),
    );
    setDeposits((dep.data ?? []) as DepositRequest[]);
    setWithdraws((wit.data ?? []) as WithdrawRequest[]);
    setSettings(s);
    const [prod, ord] = await Promise.all([
      supabase.from("products").select("id,active"),
      supabase.from("orders").select("id,status"),
    ]);
    setTotals({
      products: prod.data?.length ?? 0,
      activeProducts: (prod.data ?? []).filter((p) => p.active).length,
      orders: ord.data?.length ?? 0,
      activeOrders: (ord.data ?? []).filter((o) => o.status === "active").length,
    });
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const nameOf = useCallback(
    (id: string) => {
      const r = rows.find((x) => x.id === id);
      return r ? r.full_name || r.email || id.slice(0, 8) : id.slice(0, 8);
    },
    [rows],
  );
  const balanceOf = useCallback(
    (id: string) => rows.find((x) => x.id === id)?.balance ?? 0,
    [rows],
  );

  async function setRole(row: Row, next: "admin" | "user") {
    if (row.role === next) return;
    setBusy(row.id);
    setErr(null);
    const del = await supabase.from("user_roles").delete().eq("user_id", row.id);
    if (del.error) {
      setErr(del.error.message);
      setBusy(null);
      return;
    }
    const ins = await supabase.from("user_roles").insert({ user_id: row.id, role: next });
    if (ins.error) setErr(ins.error.message);
    await load();
    setBusy(null);
  }

  async function saveBalance(row: Row, value: number) {
    setBusy(row.id);
    setErr(null);
    setMsg(null);
    const { error } = await supabase.rpc("admin_set_balance", {
      _user_id: row.id,
      _balance: value,
    });
    if (error) setErr(error.message);
    else setMsg(`Saldo ${nameOf(row.id)} diperbarui menjadi ${rupiah(value)}.`);
    await load();
    setBusy(null);
  }

  async function reviewDeposit(id: string, approve: boolean, note: string) {
    setBusy(id);
    setErr(null);
    setMsg(null);
    const trimmed = note.trim();
    const { error } = await supabase.rpc("review_deposit", {
      _id: id,
      _approve: approve,
      ...(trimmed ? { _note: trimmed } : {}),
    });
    if (error) setErr(error.message);
    else setMsg(approve ? "Deposit disetujui dan saldo pengguna ditambah." : "Deposit ditolak.");
    await load();
    setBusy(null);
  }

  async function reviewWithdraw(
    r: WithdrawRequest,
    approve: boolean,
    note: string,
    proof: File | null,
  ) {
    setBusy(r.id);
    setErr(null);
    setMsg(null);
    try {
      let proofPath: string | undefined;
      if (approve && proof) proofPath = await uploadPaymentImage("withdraw", r.user_id, proof);
      const trimmed = note.trim();
      const { error } = await supabase.rpc("review_withdraw", {
        _id: r.id,
        _approve: approve,
        ...(trimmed ? { _note: trimmed } : {}),
        ...(proofPath ? { _proof_path: proofPath } : {}),
      });
      if (error) throw new Error(error.message);
      setMsg(approve ? "Penarikan disetujui dan saldo pengguna dikurangi." : "Penarikan ditolak.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memproses penarikan.");
    } finally {
      setBusy(null);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        (r.email ?? "").toLowerCase().includes(s) || (r.full_name ?? "").toLowerCase().includes(s),
    );
  }, [rows, q]);

  const admins = rows.filter((r) => r.role === "admin").length;
  const pendingDep = deposits.filter((d) => d.status === "pending").length;
  const pendingWit = withdraws.filter((w) => w.status === "pending").length;
  const totalBalance = rows.reduce((n, r) => n + r.balance, 0);
  const depApproved = deposits
    .filter((d) => d.status === "approved")
    .reduce((n, d) => n + Number(d.amount), 0);
  const witApproved = withdraws
    .filter((w) => w.status === "approved")
    .reduce((n, w) => n + Number(w.amount), 0);

  if (loading || (!role && !err)) {
    return (
      <main className="grid min-h-screen place-items-center bg-stage text-sm text-muted-foreground">
        Memuat…
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-stage text-sm text-muted-foreground">
        Akses ditolak.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stage">
      <div className="mx-auto min-h-screen w-full max-w-[430px] border-x border-border bg-background px-4 pb-16 pt-4 shadow-app">
        <header className="mb-5 flex items-center gap-3">
          <Link to="/profile" className="icon-btn" aria-label="Kembali">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-primary">PANEL ADMIN</p>
            <p className="truncate text-[9px] font-semibold uppercase text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2">
          <div className="stat">
            <span>Total Akun</span>
            <strong>{rows.length}</strong>
          </div>
          <div className="stat">
            <span>Deposit Baru</span>
            <strong className="text-primary">{pendingDep}</strong>
          </div>
          <div className="stat">
            <span>Tarik Baru</span>
            <strong className="text-primary">{pendingWit}</strong>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              className={`${tab === t ? "btn-primary" : "btn-secondary"} !px-2 !text-[11px]`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {err && <p className="notice mt-3 text-destructive">{err}</p>}
        {msg && <p className="notice mt-3">{msg}</p>}

        {tab === "Ringkasan" && (
          <section className="mt-5 space-y-3">
            <h2 className="font-display text-base font-bold">Ringkasan Aplikasi</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="stat">
                <span>Total Saldo Pengguna</span>
                <strong className="text-primary">{rupiah(totalBalance)}</strong>
              </div>
              <div className="stat">
                <span>Admin Aktif</span>
                <strong>{admins}</strong>
              </div>
              <div className="stat">
                <span>Deposit Disetujui</span>
                <strong className="text-primary">{rupiah(depApproved)}</strong>
              </div>
              <div className="stat">
                <span>Penarikan Disetujui</span>
                <strong className="text-primary">{rupiah(witApproved)}</strong>
              </div>
              <div className="stat">
                <span>Produk Aktif</span>
                <strong>
                  {totals.activeProducts}/{totals.products}
                </strong>
              </div>
              <div className="stat">
                <span>Pesanan Berjalan</span>
                <strong>
                  {totals.activeOrders}/{totals.orders}
                </strong>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary !text-[11px]" onClick={() => setTab("Deposit")}>
                Proses Deposit ({pendingDep})
              </button>
              <button className="btn-primary !text-[11px]" onClick={() => setTab("Penarikan")}>
                Proses Penarikan ({pendingWit})
              </button>
              <button className="btn-secondary !text-[11px]" onClick={() => setTab("Produk")}>
                Kelola Produk
              </button>
              <button className="btn-secondary !text-[11px]" onClick={() => setTab("Konten")}>
                Kelola Konten
              </button>
            </div>
            <div className="notice">
              <Clock className="shrink-0" size={16} />
              <span>
                Semua data di panel ini dapat ditambah, diubah, dan dihapus langsung: akun, saldo,
                produk, pesanan, FAQ, pengumuman, teks halaman, kode bonus, dan pengaturan
                pembayaran.
              </span>
            </div>
          </section>
        )}

        {tab === "Deposit" && (
          <section className="mt-5 space-y-2">
            <h2 className="mb-3 font-display text-base font-bold">Permintaan Deposit</h2>
            {deposits.map((d) => (
              <DepositCard
                key={d.id}
                row={d}
                name={nameOf(d.user_id)}
                busy={busy === d.id}
                onReview={(approve, note) => void reviewDeposit(d.id, approve, note)}
              />
            ))}
            {deposits.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada permintaan deposit.</p>
            )}
          </section>
        )}

        {tab === "Penarikan" && (
          <section className="mt-5 space-y-2">
            <h2 className="mb-3 font-display text-base font-bold">Permintaan Penarikan</h2>
            {withdraws.map((w) => (
              <WithdrawCard
                key={w.id}
                row={w}
                name={nameOf(w.user_id)}
                balance={balanceOf(w.user_id)}
                busy={busy === w.id}
                onReview={(approve, note, proof) => void reviewWithdraw(w, approve, note, proof)}
              />
            ))}
            {withdraws.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada permintaan penarikan.</p>
            )}
          </section>
        )}

        {tab === "Akun" && (
          <section className="mt-5">
            <label className="label" htmlFor="cari">
              Cari akun
            </label>
            <input
              id="cari"
              className="field"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nama atau email"
            />
            <div className="mb-3 mt-6 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Users size={16} /> Daftar Akun
              </h2>
              <span className="text-xs text-muted-foreground">
                {filtered.length} hasil • {admins} admin
              </span>
            </div>
            <div className="space-y-2">
              {filtered.map((r) => (
                <AccountCard
                  key={r.id}
                  row={r}
                  self={r.id === user?.id}
                  busy={busy === r.id}
                  onRole={(next) => void setRole(r, next)}
                  onBalance={(value) => void saveBalance(r, value)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada akun yang cocok.</p>
              )}
            </div>
          </section>
        )}

        {tab === "Produk" && <ProductsPanel />}
        {tab === "Pesanan" && <OrdersPanel nameOf={nameOf} />}
        {tab === "Konten" && <ContentPanel />}
        {tab === "Bonus" && <BonusPanel />}

        {tab === "Pengaturan" && (
          <SettingsPanel
            settings={settings}
            adminId={user?.id ?? ""}
            onSaved={async (text) => {
              setMsg(text);
              setErr(null);
              await load();
            }}
            onError={(text) => {
              setErr(text);
              setMsg(null);
            }}
          />
        )}

        <div className="notice mt-6">
          <ShieldCheck className="shrink-0" size={16} />
          <span>
            Menyetujui deposit menambah saldo pengguna, menyetujui penarikan mengurangi saldo.
            Periksa bukti transfer sebelum memproses.
          </span>
        </div>
      </div>
    </main>
  );
}

function DepositCard({
  row,
  name,
  busy,
  onReview,
}: {
  row: DepositRequest;
  name: string;
  busy: boolean;
  onReview: (approve: boolean, note: string) => void;
}) {
  const [note, setNote] = useState("");
  const pending = row.status === "pending";
  return (
    <section className="panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-primary">{rupiah(row.amount)}</p>
          <p className="truncate text-[11px] text-muted-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">
            {row.method}
            {row.sender_name ? ` • ${row.sender_name}` : ""} • {tanggal(row.created_at)}
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>
      {row.proof_path && (
        <div className="mt-3">
          <p className="label">Bukti Pembayaran Pengguna</p>
          <PaymentImage
            path={row.proof_path}
            alt="Bukti pembayaran pengguna"
            className="max-h-72"
          />
        </div>
      )}
      {row.admin_note && (
        <p className="mt-2 text-[11px] text-muted-foreground">Catatan: {row.admin_note}</p>
      )}
      {pending && (
        <div className="mt-3 space-y-2">
          <input
            className="field"
            placeholder="Catatan untuk pengguna (opsional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-secondary disabled:opacity-50"
              disabled={busy}
              onClick={() => onReview(false, note)}
            >
              Tolak
            </button>
            <button
              className="btn-primary disabled:opacity-50"
              disabled={busy}
              onClick={() => onReview(true, note)}
            >
              Setujui & Tambah Saldo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function WithdrawCard({
  row,
  name,
  balance,
  busy,
  onReview,
}: {
  row: WithdrawRequest;
  name: string;
  balance: number;
  busy: boolean;
  onReview: (approve: boolean, note: string, proof: File | null) => void;
}) {
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const pending = row.status === "pending";
  return (
    <section className="panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-primary">{rupiah(row.amount)}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {name} • saldo {rupiah(balance)}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {row.method} • {row.account_number} • {row.account_name}
          </p>
          <p className="text-[11px] text-muted-foreground">{tanggal(row.created_at)}</p>
        </div>
        <StatusBadge status={row.status} />
      </div>
      {row.admin_note && (
        <p className="mt-2 text-[11px] text-muted-foreground">Catatan: {row.admin_note}</p>
      )}
      {row.proof_path && (
        <div className="mt-3">
          <p className="label">Bukti Transfer Terkirim</p>
          <PaymentImage path={row.proof_path} alt="Bukti transfer admin" className="max-h-72" />
        </div>
      )}
      {pending && (
        <div className="mt-3 space-y-2">
          <div>
            <p className="label">Bukti Transfer Manual (unggah sebelum menyetujui)</p>
            <input
              className="field"
              type="file"
              accept="image/*"
              onChange={(e) => setProof(e.target.files?.[0] ?? null)}
            />
          </div>
          <input
            className="field"
            placeholder="Catatan untuk pengguna (opsional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-secondary disabled:opacity-50"
              disabled={busy}
              onClick={() => onReview(false, note, null)}
            >
              Tolak
            </button>
            <button
              className="btn-primary disabled:opacity-50"
              disabled={busy || !proof}
              onClick={() => onReview(true, note, proof)}
            >
              Sudah Ditransfer
            </button>
          </div>
          {!proof && (
            <p className="text-[10px] text-muted-foreground">
              Unggah bukti transfer untuk mengaktifkan tombol persetujuan.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function AccountCard({
  row,
  self,
  busy,
  onRole,
  onBalance,
}: {
  row: Row;
  self: boolean;
  busy: boolean;
  onRole: (next: "admin" | "user") => void;
  onBalance: (value: number) => void;
}) {
  const [value, setValue] = useState(String(row.balance));
  useEffect(() => setValue(String(row.balance)), [row.balance]);
  const parsed = Number(value);
  return (
    <section className="panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">{row.full_name ?? "Tanpa Nama"}</p>
          <p className="truncate text-[11px] text-muted-foreground">{row.email}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Saldo {rupiah(row.balance)}</p>
        </div>
        <span className="status-dot">{row.role === "admin" ? "ADMIN" : "USER"}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="btn-secondary disabled:opacity-50"
          disabled={busy || row.role === "user" || self}
          onClick={() => onRole("user")}
        >
          Jadikan User
        </button>
        <button
          className="btn-primary disabled:opacity-50"
          disabled={busy || row.role === "admin"}
          onClick={() => onRole("admin")}
        >
          Jadikan Admin
        </button>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          className="field"
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`Saldo ${row.email ?? ""}`}
        />
        <button
          className="btn-secondary disabled:opacity-50"
          disabled={busy || !Number.isFinite(parsed) || parsed < 0 || parsed === row.balance}
          onClick={() => onBalance(parsed)}
        >
          Set Saldo
        </button>
      </div>
    </section>
  );
}

function SettingsPanel({
  settings,
  adminId,
  onSaved,
  onError,
}: {
  settings: PaymentSettings | null;
  adminId: string;
  onSaved: (text: string) => Promise<void>;
  onError: (text: string) => void;
}) {
  const [form, setForm] = useState<PaymentSettings | null>(settings);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  if (!form) return <p className="mt-5 text-sm text-muted-foreground">Memuat pengaturan…</p>;

  function patch(next: Partial<PaymentSettings>) {
    setForm((prev) => (prev ? { ...prev, ...next } : prev));
  }

  async function save() {
    setBusy(true);
    try {
      let qrisPath = form!.qris_path;
      if (file) qrisPath = await uploadPaymentImage("qris", adminId, file);
      const { error } = await supabase
        .from("payment_settings")
        .update({
          qris_path: qrisPath,
          qris_owner_name: form!.qris_owner_name,
          bank_instruction: form!.bank_instruction,
          deposit_enabled: form!.deposit_enabled,
          withdraw_enabled: form!.withdraw_enabled,
          deposit_start: form!.deposit_start,
          deposit_end: form!.deposit_end,
          withdraw_start: form!.withdraw_start,
          withdraw_end: form!.withdraw_end,
          min_deposit: form!.min_deposit,
          min_withdraw: form!.min_withdraw,
        })
        .eq("id", true);
      if (error) throw new Error(error.message);
      setFile(null);
      await onSaved("Pengaturan pembayaran tersimpan.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal menyimpan pengaturan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 space-y-4">
      <h2 className="flex items-center gap-2 font-display text-base font-bold">
        <Clock size={16} /> Pengaturan Pembayaran
      </h2>

      <div className="panel space-y-3">
        <p className="label">Kode QRIS</p>
        <PaymentImage path={form.qris_path} alt="Kode QRIS saat ini" className="max-h-72" />
        <input
          className="field"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label>
          <span className="label">Nama Penerima QRIS</span>
          <input
            className="field"
            value={form.qris_owner_name ?? ""}
            onChange={(e) => patch({ qris_owner_name: e.target.value })}
          />
        </label>
        <label>
          <span className="label">Petunjuk Pembayaran</span>
          <textarea
            className="field min-h-24"
            value={form.bank_instruction ?? ""}
            placeholder="Contoh: Transfer ke BCA 1234567890 a/n Velocity Driver, lalu unggah bukti."
            onChange={(e) => patch({ bank_instruction: e.target.value })}
          />
        </label>
      </div>

      <div className="panel space-y-3">
        <p className="label">Jam Kerja Deposit (WIB)</p>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="label">Mulai</span>
            <input
              className="field"
              type="time"
              value={hhmm(form.deposit_start)}
              onChange={(e) => patch({ deposit_start: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Selesai</span>
            <input
              className="field"
              type="time"
              value={hhmm(form.deposit_end)}
              onChange={(e) => patch({ deposit_end: e.target.value })}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.deposit_enabled}
            onChange={(e) => patch({ deposit_enabled: e.target.checked })}
          />
          Menu deposit aktif untuk semua pengguna
        </label>
        <label>
          <span className="label">Minimal Deposit</span>
          <input
            className="field"
            type="number"
            min={0}
            value={form.min_deposit}
            onChange={(e) => patch({ min_deposit: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="panel space-y-3">
        <p className="label">Jam Kerja Penarikan (WIB)</p>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="label">Mulai</span>
            <input
              className="field"
              type="time"
              value={hhmm(form.withdraw_start)}
              onChange={(e) => patch({ withdraw_start: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Selesai</span>
            <input
              className="field"
              type="time"
              value={hhmm(form.withdraw_end)}
              onChange={(e) => patch({ withdraw_end: e.target.value })}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.withdraw_enabled}
            onChange={(e) => patch({ withdraw_enabled: e.target.checked })}
          />
          Menu penarikan aktif untuk semua pengguna
        </label>
        <label>
          <span className="label">Minimal Penarikan</span>
          <input
            className="field"
            type="number"
            min={0}
            value={form.min_withdraw}
            onChange={(e) => patch({ min_withdraw: Number(e.target.value) })}
          />
        </label>
      </div>

      <button
        className="btn-primary w-full disabled:opacity-50"
        disabled={busy}
        onClick={() => void save()}
      >
        {busy ? "Menyimpan…" : "Simpan Pengaturan"}
      </button>
    </section>
  );
}
