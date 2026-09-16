import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  RefreshCw,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { meta, rupiah } from "@/lib/menara-data";
import { PaymentImage, StatusBadge } from "@/components/payment-ui";
import { DeviceImageUpload } from "@/components/device-image-upload";
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
  "CMS",
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.email === "admin@velocitydriver.com") return;
    if (!loading && role && !isAdmin) void navigate({ to: "/home", replace: true });
  }, [loading, role, isAdmin, navigate, user?.email]);

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

  const navItems = [
    { id: "Ringkasan" as const, label: "Ringkasan Dasbor", icon: LayoutDashboard },
    {
      id: "Deposit" as const,
      label: "Verifikasi Deposit",
      icon: ArrowDownToLine,
      badge: pendingDep,
    },
    {
      id: "Penarikan" as const,
      label: "Verifikasi Penarikan",
      icon: ArrowUpFromLine,
      badge: pendingWit,
    },
    { id: "Akun" as const, label: "Kelola Pengguna", icon: Users, count: rows.length },
    { id: "Produk" as const, label: "Kelola Produk", icon: Package, count: totals.products },
    { id: "Pesanan" as const, label: "Riwayat Pesanan", icon: ShoppingBag, count: totals.orders },
    { id: "CMS" as const, label: "CMS & Konten Publik", icon: Layers },
    { id: "Bonus" as const, label: "Kode Bonus", icon: Gift },
    { id: "Pengaturan" as const, label: "Pengaturan Sistem", icon: Settings },
  ];

  if (loading || (!role && !err && user?.email !== "admin@velocitydriver.com")) {
    return (
      <main className="grid min-h-screen place-items-center bg-stage text-sm text-muted-foreground">
        Memuat Panel Admin…
      </main>
    );
  }
  if (!isAdmin && user?.email !== "admin@velocitydriver.com") {
    return (
      <main className="grid min-h-screen place-items-center bg-stage text-sm text-muted-foreground">
        Akses ditolak.
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-stage text-foreground flex flex-col lg:flex-row">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0c1017] border-r border-border/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Velocity Driver"
              className="h-8 w-auto shrink-0 object-contain"
            />
            <div>
              <h1 className="font-display font-bold text-sm tracking-wider text-primary leading-tight">
                VELOCITY DRIVER
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                ADMIN CONSOLE
              </p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin Profile Box */}
        <div className="p-3.5 mx-3 my-3 rounded-lg bg-muted/30 border border-border/60 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary text-black font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-foreground">
              {user?.email || "admin@velocitydriver.com"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
                SUPER ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 flex-1 overflow-y-auto space-y-1 py-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
            Navigasi Admin
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-primary text-black font-bold shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} className={active ? "text-black" : "text-primary/80"} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 ? (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? "bg-black text-primary" : "bg-primary text-black animate-pulse"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : item.count !== undefined ? (
                  <span
                    className={`text-[10px] ${
                      active ? "text-black/80 font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/60 space-y-2 bg-[#080b10]">
          <Link
            to="/home"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-secondary/70 hover:bg-secondary border border-border text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink size={14} className="text-primary" />
              <span>Buka Tampilan Investor</span>
            </div>
            <span className="text-muted-foreground text-xs">&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              await navigate({ to: "/auth", replace: true });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={14} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg bg-secondary border border-border text-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu admin"
            >
              <Menu size={18} />
            </button>
            <img
              src="/logo.png"
              alt="Velocity Driver"
              className="h-7 w-auto shrink-0 object-contain lg:hidden"
            />
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                <span>Admin Console</span>
                <span>/</span>
                <span className="text-primary font-bold">{tab}</span>
              </div>
              <h2 className="font-display text-base lg:text-lg font-bold text-foreground leading-tight">
                {tab === "Ringkasan" ? "Dasbor Ringkasan Sistem" : tab}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-primary" : ""} />
              <span>{refreshing ? "Memperbarui…" : "Segarkan"}</span>
            </button>

            <Link
              to="/home"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-black font-bold text-xs hover:opacity-90 shadow-sm transition-opacity"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Tampilan Investor</span>
              <span className="sm:hidden">Investor</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {err && <p className="notice text-destructive">{err}</p>}
          {msg && <p className="notice">{msg}</p>}

          {tab === "Ringkasan" && (
            <div className="space-y-6">
              {/* Top Quick Attention Cards if pending exists */}
              {(pendingDep > 0 || pendingWit > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pendingDep > 0 && (
                    <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                          <ArrowDownToLine size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">
                            {pendingDep} Deposit Menunggu
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Verifikasi bukti pembayaran pengguna
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTab("Deposit")}
                        className="btn-primary !py-1.5 !px-3 !text-xs"
                      >
                        Proses &rarr;
                      </button>
                    </div>
                  )}
                  {pendingWit > 0 && (
                    <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                          <ArrowUpFromLine size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">
                            {pendingWit} Penarikan Menunggu
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Kirim dana dan konfirmasi penarikan
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTab("Penarikan")}
                        className="btn-primary !py-1.5 !px-3 !text-xs"
                      >
                        Proses &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Main Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="panel flex flex-col justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Total Akun Pengguna
                  </span>
                  <p className="mt-2 text-2xl font-bold font-display text-foreground">
                    {rows.length}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {admins} peran Administrator
                  </p>
                </div>

                <div className="panel flex flex-col justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Total Saldo Beredar
                  </span>
                  <p className="mt-2 text-2xl font-bold font-display text-primary">
                    {rupiah(totalBalance)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Saldo seluruh investor</p>
                </div>

                <div className="panel flex flex-col justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Deposit Disetujui
                  </span>
                  <p className="mt-2 text-2xl font-bold font-display text-foreground">
                    {rupiah(depApproved)}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-500 font-semibold">
                    {deposits.filter((d) => d.status === "approved").length} transaksi sukses
                  </p>
                </div>

                <div className="panel flex flex-col justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Penarikan Disetujui
                  </span>
                  <p className="mt-2 text-2xl font-bold font-display text-foreground">
                    {rupiah(witApproved)}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-500 font-semibold">
                    {withdraws.filter((w) => w.status === "approved").length} pencairan sukses
                  </p>
                </div>
              </div>

              {/* Secondary Stats & Quick Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="panel space-y-3 lg:col-span-2">
                  <h3 className="font-display font-bold text-sm text-foreground flex items-center justify-between">
                    <span>Aksi Cepat Manajemen</span>
                    <span className="text-xs text-muted-foreground font-normal">Kontrol Penuh</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      className="p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left transition-colors flex flex-col gap-1.5"
                      onClick={() => setTab("Deposit")}
                    >
                      <ArrowDownToLine size={18} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        Deposit ({pendingDep})
                      </span>
                      <span className="text-[10px] text-muted-foreground">Verifikasi transfer</span>
                    </button>
                    <button
                      className="p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left transition-colors flex flex-col gap-1.5"
                      onClick={() => setTab("Penarikan")}
                    >
                      <ArrowUpFromLine size={18} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        Penarikan ({pendingWit})
                      </span>
                      <span className="text-[10px] text-muted-foreground">Pencairan dana</span>
                    </button>
                    <button
                      className="p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left transition-colors flex flex-col gap-1.5"
                      onClick={() => setTab("Akun")}
                    >
                      <Users size={18} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">Akun & Saldo</span>
                      <span className="text-[10px] text-muted-foreground">Ubah saldo / role</span>
                    </button>
                    <button
                      className="p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left transition-colors flex flex-col gap-1.5"
                      onClick={() => setTab("Produk")}
                    >
                      <Package size={18} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">Produk Investasi</span>
                      <span className="text-[10px] text-muted-foreground">
                        {totals.products} total produk
                      </span>
                    </button>
                    <button
                      className="p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left transition-colors flex flex-col gap-1.5"
                      onClick={() => setTab("CMS")}
                    >
                      <Layers size={18} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">CMS Konten</span>
                      <span className="text-[10px] text-muted-foreground">Banner, FAQ, Info</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <div className="notice">
                      <Clock className="shrink-0" size={16} />
                      <span>
                        Semua data di panel ini dapat ditambah, diubah, dan dihapus langsung: akun,
                        saldo, produk investasi, pesanan berjalan, pengumuman, kode bonus, dan
                        rekening QRIS / bank.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="panel space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm text-foreground mb-3">
                      Status Operasional
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="text-muted-foreground">Jam Deposit</span>
                        <span className="font-mono font-semibold">
                          {settings?.deposit_start ? hhmm(settings.deposit_start) : "00:00"} -{" "}
                          {settings?.deposit_end ? hhmm(settings.deposit_end) : "23:59"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="text-muted-foreground">Jam Penarikan</span>
                        <span className="font-mono font-semibold">
                          {settings?.withdraw_start ? hhmm(settings.withdraw_start) : "08:00"} -{" "}
                          {settings?.withdraw_end ? hhmm(settings.withdraw_end) : "20:00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="text-muted-foreground">Produk Aktif</span>
                        <span className="font-semibold text-primary">
                          {totals.activeProducts} dari {totals.products}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pesanan Aktif</span>
                        <span className="font-semibold text-primary">
                          {totals.activeOrders} dari {totals.orders}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setTab("Pengaturan")}
                    className="btn-secondary !w-full !text-xs mt-2"
                  >
                    Buka Pengaturan Lengkap
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "Deposit" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">
                    Verifikasi Permintaan Deposit
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Tinjau transfer dan bukti pembayaran dari investor ({deposits.length}{" "}
                    permintaan)
                  </p>
                </div>
                {pendingDep > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/40">
                    {pendingDep} Menunggu Verifikasi
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {deposits.map((d) => (
                  <DepositCard
                    key={d.id}
                    row={d}
                    name={nameOf(d.user_id)}
                    busy={busy === d.id}
                    onReview={(approve, note) => void reviewDeposit(d.id, approve, note)}
                  />
                ))}
              </div>
              {deposits.length === 0 && (
                <p className="text-sm text-muted-foreground p-8 text-center panel">
                  Belum ada permintaan deposit.
                </p>
              )}
            </section>
          )}

          {tab === "Penarikan" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">
                    Verifikasi Permintaan Penarikan Dana
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Kirim dana ke rekening bank / e-wallet investor ({withdraws.length} permintaan)
                  </p>
                </div>
                {pendingWit > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/40">
                    {pendingWit} Menunggu Proses
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {withdraws.map((w) => (
                  <WithdrawCard
                    key={w.id}
                    row={w}
                    name={nameOf(w.user_id)}
                    balance={balanceOf(w.user_id)}
                    busy={busy === w.id}
                    onReview={(approve, note, proof) =>
                      void reviewWithdraw(w, approve, note, proof)
                    }
                  />
                ))}
              </div>
              {withdraws.length === 0 && (
                <p className="text-sm text-muted-foreground p-8 text-center panel">
                  Belum ada permintaan penarikan.
                </p>
              )}
            </section>
          )}

          {tab === "Akun" && (
            <section className="space-y-4">
              <div className="panel">
                <label className="label" htmlFor="cari">
                  Cari Pengguna
                </label>
                <input
                  id="cari"
                  className="field"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ketik nama atau alamat email pengguna…"
                />
              </div>

              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                  <Users size={16} /> Daftar Akun Terdaftar
                </h2>
                <span className="text-xs text-muted-foreground">
                  {filtered.length} hasil • {admins} admin
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              </div>
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground p-8 text-center panel">
                  Tidak ada akun yang cocok.
                </p>
              )}
            </section>
          )}

          {tab === "Produk" && <ProductsPanel />}
          {tab === "Pesanan" && <OrdersPanel nameOf={nameOf} />}
          {tab === "CMS" && <ContentPanel />}
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
        </main>
      </div>
    </div>
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
            <DeviceImageUpload
              id={`withdraw-proof-${row.id}`}
              label="Bukti Transfer Manual (Unggah dari Perangkat)"
              hint="Unggah bukti transfer dari perangkat untuk menyelesaikan verifikasi penarikan dana investor."
              value={proof}
              onChange={(f) => setProof(f)}
              disabled={busy}
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
  const [telegramUrl, setTelegramUrl] = useState("https://t.me/");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(settings);
    void (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "telegram_url")
        .maybeSingle();
      if (data?.value) {
        setTelegramUrl(data.value);
      }
    })();
  }, [settings]);

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

      // Simpan link Telegram ke site_content
      const trimmedTelegram = telegramUrl.trim() || "https://t.me/";
      const { data: existingContent } = await supabase
        .from("site_content")
        .select("key")
        .eq("key", "telegram_url")
        .maybeSingle();

      if (existingContent) {
        const { error: telError } = await supabase
          .from("site_content")
          .update({ value: trimmedTelegram })
          .eq("key", "telegram_url");
        if (telError) throw new Error(telError.message);
      } else {
        const { error: telError } = await supabase.from("site_content").insert({
          key: "telegram_url",
          value: trimmedTelegram,
          label: "Tautan Telegram Pop-up & CS",
        });
        if (telError) throw new Error(telError.message);
      }

      setFile(null);
      await onSaved("Pengaturan sistem & Telegram tersimpan.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal menyimpan pengaturan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 space-y-4">
      <h2 className="flex items-center gap-2 font-display text-base font-bold">
        <Clock size={16} /> Pengaturan Pembayaran & Sistem
      </h2>

      {/* Pengaturan Tautan Telegram */}
      <div className="panel space-y-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-primary">
          <Send size={15} /> Tautan Telegram (Pop-up Beranda & CS)
        </h3>
        <label>
          <span className="label">Link Telegram Resmi / Channel / CS</span>
          <div className="relative mt-1">
            <input
              className="field pr-9 font-mono text-xs"
              type="url"
              placeholder="https://t.me/username_anda"
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
            />
            {telegramUrl.startsWith("http") && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
                title="Buka tautan di tab baru"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
            Tautan ini otomatis digunakan saat pengguna menekan tombol <strong>Telegram</strong> di
            pop-up beranda serta menu <strong>Layanan Pelanggan</strong> di profil.
          </span>
        </label>
      </div>

      <div className="panel space-y-3">
        <div>
          <DeviceImageUpload
            id="qris-image-upload"
            label="Kode QRIS Pembayaran (Unggah dari Perangkat)"
            hint="Tarik gambar kode QRIS baru ke sini atau klik untuk memilih file dari komputer/HP Anda."
            value={file}
            currentImageUrl={form.qris_path}
            onChange={(f) => setFile(f)}
          />
        </div>
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
