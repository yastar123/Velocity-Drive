import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Save,
  Trash2,
  Image as ImageIcon,
  Upload,
  Calculator,
  Search,
  Car,
  Layers,
  Sparkles,
  ExternalLink,
  Megaphone,
  HelpCircle,
  FileText,
  Gift,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rupiah } from "@/lib/menara-data";
import {
  defaultCarImages,
  getProductImageUrl,
  fetchAnnouncements,
  fetchFaqs,
  fetchProducts,
  fetchSiteContentRows,
  fetchBanners,
  type Announcement,
  type BonusCode,
  type Faq,
  type Order,
  type Product,
  type SiteContent,
  type Banner,
} from "@/lib/content";

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="panel space-y-2">{children}</section>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function useFeedback() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const report = (error: { message: string } | null, okText: string) => {
    if (error) {
      setErr(error.message);
      setMsg(null);
    } else {
      setMsg(okText);
      setErr(null);
    }
  };
  const node = (
    <>
      {err && <p className="notice text-destructive">{err}</p>}
      {msg && <p className="notice">{msg}</p>}
    </>
  );
  return { report, node };
}

/* ---------------- Produk Presets & CRUD ---------------- */

export const CAR_PRESETS = [
  {
    name: "Toyota Supra",
    price: 120000,
    daily: 25000,
    total: 750000,
    days: 30,
    url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Honda Civic Type R",
    price: 350000,
    daily: 65000,
    total: 3900000,
    days: 60,
    url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mitsubishi Lancer Evo X",
    price: 750000,
    daily: 165000,
    total: 14850000,
    days: 90,
    url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mazda MX-5",
    price: 1300000,
    daily: 235000,
    total: 21150000,
    days: 90,
    url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "BMW M5",
    price: 2700000,
    daily: 495000,
    total: 59400000,
    days: 120,
    url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mercedes-Benz AMG GT",
    price: 5200000,
    daily: 1125000,
    total: 202500000,
    days: 180,
    url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Audi R8",
    price: 5200000,
    daily: 1125000,
    total: 202500000,
    days: 180,
    url: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Porsche 911",
    price: 15000000,
    daily: 3500000,
    total: 630000000,
    days: 180,
    url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Lamborghini",
    price: 25000000,
    daily: 5000000,
    total: 900000000,
    days: 180,
    url: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&q=80",
  },
];

const emptyProduct = {
  name: "",
  price: 0,
  daily: 0,
  total: 0,
  days: 30,
  type: "REGULER",
  image_url: "",
  description: "",
  active: true,
  sort: 0,
};

export function ProductsPanel() {
  const [items, setItems] = useState<Product[]>([]);
  const [draft, setDraft] = useState({ ...emptyProduct });
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const { report, node } = useFeedback();

  const load = useCallback(async () => setItems(await fetchProducts(true)), []);
  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!draft.name.trim()) return;
    const payload = {
      ...draft,
      image_url: draft.image_url?.trim() || null,
    };
    const { error } = await supabase.from("products").insert(payload);
    report(error, "Produk baru berhasil ditambahkan.");
    if (!error) setDraft({ ...emptyProduct });
    await load();
  }

  async function save(p: Product) {
    const { id, ...rest } = p;
    const payload = {
      ...rest,
      image_url: rest.image_url?.trim() || null,
    };
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    report(error, `Produk "${p.name}" berhasil diperbarui.`);
    await load();
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Yakin ingin menghapus produk "${name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    report(error, `Produk "${name}" berhasil dihapus.`);
    await load();
  }

  const patch = (id: string, part: Partial<Product>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...part } : x)));

  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    onSelect: (dataUrl: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        onSelect(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  const filteredItems = items.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterActive === "active") return p.active;
    if (filterActive === "inactive") return !p.active;
    return true;
  });

  return (
    <section className="mt-5 space-y-4">
      {node}

      {/* CREATE NEW PRODUCT */}
      <Panel>
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
            <Plus className="size-4" /> Tambah Produk Baru
          </h3>
          <span className="text-[11px] text-muted-foreground">Admin CRUD</span>
        </div>

        {/* Preset Quick Fill */}
        <div className="rounded-lg bg-muted/40 p-2.5 border border-border/60">
          <span className="block text-[11px] font-semibold text-foreground mb-1.5">
            ⚡ Preset Cepat Armada Kendaraan:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CAR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    name: preset.name,
                    price: preset.price,
                    daily: preset.daily,
                    total: preset.total,
                    days: preset.days,
                    image_url: preset.url,
                  })
                }
                className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <Row label="Nama Produk Kendaraan">
          <input
            className="field font-semibold"
            placeholder="Contoh: Toyota Supra / Porsche 911"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Row>

        {/* Product Image URL & Upload */}
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-2.5">
          <Row label="URL Gambar Produk (Bisa URL Web atau Upload)">
            <div className="flex gap-2">
              <input
                className="field text-xs"
                placeholder="https://images.unsplash.com/..."
                value={draft.image_url ?? ""}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
              />
              <label className="flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors">
                <Upload size={14} />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, (url) => setDraft({ ...draft, image_url: url }))
                  }
                />
              </label>
            </div>
          </Row>

          {/* Live Preview */}
          {draft.image_url ? (
            <div className="relative aspect-[16/9] max-h-40 w-full overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={draft.image_url}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <span className="absolute top-1.5 left-1.5 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold text-white">
                Pratinjau Gambar
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground italic">
              <ImageIcon size={14} /> Belum ada gambar disetel (akan memakai default mobil jika nama
              cocok)
            </div>
          )}
        </div>

        {/* Price & Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <Row label="Harga Paket (Rp)">
            <input
              type="number"
              className="field"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
            />
          </Row>
          <Row label="Profit Harian (Rp)">
            <input
              type="number"
              className="field"
              value={draft.daily}
              onChange={(e) => setDraft({ ...draft, daily: Number(e.target.value) })}
            />
          </Row>
          <Row label="Durasi (Hari)">
            <input
              type="number"
              className="field"
              value={draft.days}
              onChange={(e) => setDraft({ ...draft, days: Number(e.target.value) })}
            />
          </Row>
          <Row label="Total Hasil (Rp)">
            <div className="flex gap-1.5">
              <input
                type="number"
                className="field"
                value={draft.total}
                onChange={(e) => setDraft({ ...draft, total: Number(e.target.value) })}
              />
              <button
                type="button"
                title="Hitung Otomatis Harian × Hari"
                onClick={() => setDraft({ ...draft, total: draft.daily * draft.days })}
                className="shrink-0 rounded-lg border border-border bg-background px-2 text-xs text-muted-foreground hover:text-primary hover:border-primary"
              >
                <Calculator size={14} />
              </button>
            </div>
          </Row>
          <Row label="Tipe Paket">
            <select
              className="field"
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            >
              <option value="REGULER">REGULER</option>
              <option value="VIP">VIP</option>
            </select>
          </Row>
          <Row label="Urutan Tampil (Sort)">
            <input
              type="number"
              className="field"
              value={draft.sort}
              onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
            />
          </Row>
        </div>

        <Row label="Deskripsi / Catatan">
          <textarea
            className="field"
            rows={2}
            placeholder="Deskripsi armada kendaraan..."
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Row>

        <button
          className="btn-primary w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold"
          onClick={() => void create()}
          disabled={!draft.name}
        >
          <Plus size={16} /> Tambah Produk ke Database
        </button>
      </Panel>

      {/* SEARCH & FILTER LIST */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-2 pt-2">
        <div className="flex items-center gap-2">
          <Car className="size-4 text-primary" />
          <h3 className="font-display text-base font-bold text-foreground">
            Daftar Produk ({filteredItems.length} dari {items.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari armada..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field pl-8 py-1 text-xs"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
            className="field py-1 text-xs"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif</option>
            <option value="inactive">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <Panel>
          <p className="text-center py-4 text-xs text-muted-foreground">
            Tidak ada produk yang cocok dengan pencarian.
          </p>
        </Panel>
      )}

      {/* PRODUCT LIST (EDIT & DELETE) */}
      {filteredItems.map((p) => {
        const previewImg = getProductImageUrl(p);

        return (
          <Panel key={p.id}>
            {/* Header with thumbnail */}
            <div className="flex items-start gap-3 border-b border-border/70 pb-2.5">
              <div className="relative aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={previewImg}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      p.active
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.active ? "Aktif" : "Nonaktif"} • {p.type}
                  </span>
                  <span className="font-display text-sm font-extrabold text-primary">
                    {rupiah(p.price)}
                  </span>
                </div>
                <h4 className="mt-1 font-display text-sm font-bold text-foreground leading-tight truncate">
                  {p.name}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Harian: {rupiah(p.daily)} • {p.days} hari • Total: {rupiah(p.total)}
                </p>
              </div>
            </div>

            {/* Editable Fields */}
            <Row label="Nama Produk">
              <input
                className="field font-medium"
                value={p.name}
                onChange={(e) => patch(p.id, { name: e.target.value })}
              />
            </Row>

            {/* Image URL & Upload for Existing Product */}
            <div className="space-y-1.5 rounded-lg border border-border/50 bg-muted/15 p-2">
              <Row label="URL Gambar Produk">
                <div className="flex gap-2">
                  <input
                    className="field text-xs"
                    value={p.image_url ?? ""}
                    placeholder="https://images.unsplash.com/..."
                    onChange={(e) => patch(p.id, { image_url: e.target.value })}
                  />
                  <label className="flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors">
                    <Upload size={13} />
                    <span className="text-[11px]">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => patch(p.id, { image_url: url }))
                      }
                    />
                  </label>
                </div>
              </Row>

              {/* Quick preset selector for existing item */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground overflow-x-auto py-1">
                <span className="shrink-0 font-medium">Preset:</span>
                {CAR_PRESETS.slice(0, 5).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => patch(p.id, { image_url: preset.url })}
                    className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[9px] hover:border-primary hover:text-primary"
                  >
                    {preset.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Row label="Harga Paket (Rp)">
                <input
                  type="number"
                  className="field"
                  value={p.price}
                  onChange={(e) => patch(p.id, { price: Number(e.target.value) })}
                />
              </Row>
              <Row label="Profit Harian (Rp)">
                <input
                  type="number"
                  className="field"
                  value={p.daily}
                  onChange={(e) => patch(p.id, { daily: Number(e.target.value) })}
                />
              </Row>
              <Row label="Durasi (Hari)">
                <input
                  type="number"
                  className="field"
                  value={p.days}
                  onChange={(e) => patch(p.id, { days: Number(e.target.value) })}
                />
              </Row>
              <Row label="Total Hasil (Rp)">
                <div className="flex gap-1">
                  <input
                    type="number"
                    className="field"
                    value={p.total}
                    onChange={(e) => patch(p.id, { total: Number(e.target.value) })}
                  />
                  <button
                    type="button"
                    title="Hitung Otomatis Harian × Hari"
                    onClick={() => patch(p.id, { total: p.daily * p.days })}
                    className="shrink-0 rounded-lg border border-border bg-background px-2 text-xs text-muted-foreground hover:text-primary hover:border-primary"
                  >
                    <Calculator size={13} />
                  </button>
                </div>
              </Row>
              <Row label="Tipe">
                <select
                  className="field"
                  value={p.type}
                  onChange={(e) => patch(p.id, { type: e.target.value })}
                >
                  <option value="REGULER">REGULER</option>
                  <option value="VIP">VIP</option>
                </select>
              </Row>
              <Row label="Urutan (Sort)">
                <input
                  type="number"
                  className="field"
                  value={p.sort}
                  onChange={(e) => patch(p.id, { sort: Number(e.target.value) })}
                />
              </Row>
            </div>

            <Row label="Deskripsi">
              <textarea
                className="field"
                rows={2}
                value={p.description ?? ""}
                onChange={(e) => patch(p.id, { description: e.target.value })}
              />
            </Row>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer py-1">
              <input
                type="checkbox"
                checked={p.active}
                onChange={(e) => patch(p.id, { active: e.target.checked })}
                className="size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Tampilkan produk ini ke katalog pengguna</span>
            </label>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                className="btn-primary flex items-center justify-center gap-1.5 py-2 text-xs font-bold"
                onClick={() => void save(p)}
              >
                <Save size={14} /> Simpan Perubahan
              </button>
              <button
                className="btn-secondary flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
                onClick={() => void remove(p.id, p.name)}
              >
                <Trash2 size={14} /> Hapus Produk
              </button>
            </div>
          </Panel>
        );
      })}
    </section>
  );
}

/* ---------------- Banners: Carousel Slider CRUD ---------------- */

export const BANNER_PRESETS = [
  {
    title: "Armada Supercar Eksklusif",
    url: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
    link: "/vip",
  },
  {
    title: "Dividen Harian Super Cepat",
    url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    link: "/vip",
  },
  {
    title: "Komisi Referral Hingga 30%",
    url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
    link: "/my-team",
  },
  {
    title: "Investasi Terpercaya & Aman",
    url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
    link: "/deposit",
  },
  {
    title: "Komunitas Supercar Indonesia",
    url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    link: "/vip",
  },
];

export function BannerPanel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [draft, setDraft] = useState({
    title: "",
    image_url:
      "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
    link_url: "/vip",
    sort: 1,
    active: true,
  });
  const { report, node } = useFeedback();

  const load = useCallback(async () => {
    const data = await fetchBanners(true);
    setBanners(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    onSelect: (dataUrl: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2.5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        onSelect(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="space-y-4">
      {node}

      {/* CREATE NEW BANNER */}
      <Panel>
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
            <Plus className="size-4" /> Tambah Banner Slider Beranda
          </h3>
          <span className="text-[11px] text-muted-foreground">Carousel Banner CRUD</span>
        </div>

        {/* Presets */}
        <div className="rounded-lg bg-muted/40 p-2.5 border border-border/60">
          <span className="block text-[11px] font-semibold text-foreground mb-1.5">
            ⚡ Preset Cepat Banner Supercar:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BANNER_PRESETS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    title: p.title,
                    image_url: p.url,
                    link_url: p.link,
                  })
                }
                className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <Row label="Judul / Teks Banner (Opsional)">
          <input
            className="field"
            placeholder="Contoh: Armada Supercar Eksklusif"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Row>

        <Row label="URL Gambar Banner">
          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder="https://... atau unggah dari perangkat"
              value={draft.image_url}
              onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
            />
            <label className="btn-secondary flex cursor-pointer items-center gap-1.5 shrink-0 px-3 text-xs">
              <Upload className="size-3.5" /> Unggah Foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(e, (url) => setDraft({ ...draft, image_url: url }))
                }
              />
            </label>
          </div>
        </Row>

        {/* Live Preview */}
        {draft.image_url && (
          <div className="overflow-hidden rounded-lg border border-border bg-zinc-950">
            <div className="relative aspect-[21/9] w-full">
              <img
                src={draft.image_url}
                alt="Preview Banner"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
              {draft.title && (
                <div className="absolute bottom-2.5 left-3">
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/30">
                    Preview Banner
                  </span>
                  <p className="font-display text-sm font-bold text-foreground drop-shadow">
                    {draft.title}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Row label="Tautan Tujuan (Link Action)">
            <input
              className="field"
              placeholder="/vip atau https://..."
              value={draft.link_url}
              onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
            />
          </Row>
          <Row label="Urutan Urutan Tampil (Sort)">
            <input
              type="number"
              className="field"
              value={draft.sort}
              onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
            />
          </Row>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
          />
          Aktifkan banner ini di beranda
        </label>

        <button
          type="button"
          className="btn-primary w-full"
          disabled={!draft.image_url}
          onClick={() =>
            void (async () => {
              const { error } = await supabase.from("banners").insert({
                title: draft.title || null,
                image_url: draft.image_url,
                link_url: draft.link_url || null,
                sort: draft.sort,
                active: draft.active,
              });
              report(error, "Banner berhasil ditambahkan ke carousel.");
              setDraft({
                title: "",
                image_url:
                  "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
                link_url: "/vip",
                sort: banners.length + 1,
                active: true,
              });
              await load();
            })()
          }
        >
          <Plus size={14} /> Simpan Banner Baru
        </button>
      </Panel>

      {/* LIST OF EXISTING BANNERS */}
      <h3 className="font-display text-base font-bold flex items-center justify-between">
        <span>Daftar Banner Carousel ({banners.length})</span>
        <span className="text-xs font-normal text-muted-foreground">Auto-rotasi di Beranda</span>
      </h3>

      {banners.map((b) => (
        <Panel key={b.id}>
          <div className="flex gap-3">
            <div className="relative aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-md bg-zinc-950 border border-border">
              <img
                src={b.image_url}
                alt={b.title || "Banner"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80";
                }}
              />
              <span
                className={`absolute top-1 left-1 rounded px-1 text-[8px] font-bold uppercase ${
                  b.active
                    ? "bg-emerald-500/90 text-white"
                    : "bg-muted-foreground/80 text-foreground"
                }`}
              >
                {b.active ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <Row label="Judul Banner">
                <input
                  className="field"
                  value={b.title ?? ""}
                  placeholder="Judul banner"
                  onChange={(e) =>
                    setBanners((xs) =>
                      xs.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x)),
                    )
                  }
                />
              </Row>
              <Row label="URL Gambar">
                <div className="flex gap-2">
                  <input
                    className="field flex-1 text-xs"
                    value={b.image_url}
                    onChange={(e) =>
                      setBanners((xs) =>
                        xs.map((x) => (x.id === b.id ? { ...x, image_url: e.target.value } : x)),
                      )
                    }
                  />
                  <label className="btn-secondary flex cursor-pointer items-center gap-1 shrink-0 px-2 py-1 text-[11px]">
                    <Upload className="size-3" /> Ganti
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) =>
                          setBanners((xs) =>
                            xs.map((x) => (x.id === b.id ? { ...x, image_url: url } : x)),
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              </Row>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Row label="Tautan (Link URL)">
              <input
                className="field"
                value={b.link_url ?? ""}
                placeholder="/vip"
                onChange={(e) =>
                  setBanners((xs) =>
                    xs.map((x) => (x.id === b.id ? { ...x, link_url: e.target.value } : x)),
                  )
                }
              />
            </Row>
            <Row label="Urutan (Sort)">
              <input
                type="number"
                className="field"
                value={b.sort}
                onChange={(e) =>
                  setBanners((xs) =>
                    xs.map((x) => (x.id === b.id ? { ...x, sort: Number(e.target.value) } : x)),
                  )
                }
              />
            </Row>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={b.active}
              onChange={(e) =>
                setBanners((xs) =>
                  xs.map((x) => (x.id === b.id ? { ...x, active: e.target.checked } : x)),
                )
              }
            />
            Tampilkan di Carousel Beranda
          </label>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase
                    .from("banners")
                    .update({
                      title: b.title || null,
                      image_url: b.image_url,
                      link_url: b.link_url || null,
                      sort: b.sort,
                      active: b.active,
                    })
                    .eq("id", b.id);
                  report(error, "Banner berhasil diperbarui.");
                  await load();
                })()
              }
            >
              <Save size={14} /> Simpan
            </button>
            <button
              type="button"
              className="btn-secondary text-destructive"
              onClick={() =>
                void (async () => {
                  if (confirm("Hapus banner ini dari carousel?")) {
                    const { error } = await supabase.from("banners").delete().eq("id", b.id);
                    report(error, "Banner dihapus.");
                    await load();
                  }
                })()
              }
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </Panel>
      ))}
    </section>
  );
}

/* ---------------- Konten: FAQ, pengumuman, teks halaman, CMS ---------------- */

export function ContentPanel() {
  const [activeSubTab, setActiveSubTab] = useState<"banners" | "news" | "faqs" | "texts">(
    "banners",
  );
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [news, setNews] = useState<Announcement[]>([]);
  const [texts, setTexts] = useState<SiteContent[]>([]);
  const [faqDraft, setFaqDraft] = useState({ question: "", answer: "", sort: 0, active: true });
  const [newsDraft, setNewsDraft] = useState({ message: "", sort: 0, active: true });
  const { report, node } = useFeedback();

  const load = useCallback(async () => {
    setFaqs(await fetchFaqs(true));
    setNews(await fetchAnnouncements(true));
    setTexts(await fetchSiteContentRows());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-5 space-y-4">
      {/* CMS Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2.5">
        <button
          type="button"
          onClick={() => setActiveSubTab("banners")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeSubTab === "banners"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Layers className="size-3.5" /> Banner Carousel
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("news")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeSubTab === "news"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Megaphone className="size-3.5" /> Pengumuman ({news.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("faqs")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeSubTab === "faqs"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <HelpCircle className="size-3.5" /> FAQ & Bantuan ({faqs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("texts")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeSubTab === "texts"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileText className="size-3.5" /> Teks Publik & Halaman ({texts.length})
        </button>
      </div>

      {node}

      {/* BANNER TAB */}
      {activeSubTab === "banners" && <BannerPanel />}

      {/* FAQ TAB */}
      {activeSubTab === "faqs" && (
        <div className="space-y-3">
          <Panel>
            <h3 className="font-display text-sm font-bold text-primary">Tambah FAQ Baru</h3>
            <Row label="Pertanyaan">
              <input
                className="field"
                value={faqDraft.question}
                onChange={(e) => setFaqDraft({ ...faqDraft, question: e.target.value })}
              />
            </Row>
            <Row label="Jawaban">
              <textarea
                className="field"
                rows={3}
                value={faqDraft.answer}
                onChange={(e) => setFaqDraft({ ...faqDraft, answer: e.target.value })}
              />
            </Row>
            <button
              className="btn-primary w-full"
              disabled={!faqDraft.question || !faqDraft.answer}
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from("faqs").insert(faqDraft);
                  report(error, "FAQ ditambahkan.");
                  setFaqDraft({ question: "", answer: "", sort: 0, active: true });
                  await load();
                })()
              }
            >
              <Plus size={14} /> Tambah FAQ
            </button>
          </Panel>

          {faqs.map((f) => (
            <Panel key={f.id}>
              <Row label="Pertanyaan">
                <input
                  className="field"
                  value={f.question}
                  onChange={(e) =>
                    setFaqs((xs) =>
                      xs.map((x) => (x.id === f.id ? { ...x, question: e.target.value } : x)),
                    )
                  }
                />
              </Row>
              <Row label="Jawaban">
                <textarea
                  className="field"
                  rows={3}
                  value={f.answer}
                  onChange={(e) =>
                    setFaqs((xs) =>
                      xs.map((x) => (x.id === f.id ? { ...x, answer: e.target.value } : x)),
                    )
                  }
                />
              </Row>
              <div className="grid grid-cols-2 gap-2">
                <Row label="Urutan">
                  <input
                    type="number"
                    className="field"
                    value={f.sort}
                    onChange={(e) =>
                      setFaqs((xs) =>
                        xs.map((x) => (x.id === f.id ? { ...x, sort: Number(e.target.value) } : x)),
                      )
                    }
                  />
                </Row>
                <label className="mt-5 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={f.active}
                    onChange={(e) =>
                      setFaqs((xs) =>
                        xs.map((x) => (x.id === f.id ? { ...x, active: e.target.checked } : x)),
                      )
                    }
                  />
                  Tampilkan
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="btn-primary"
                  onClick={() =>
                    void (async () => {
                      const { error } = await supabase
                        .from("faqs")
                        .update({
                          question: f.question,
                          answer: f.answer,
                          sort: f.sort,
                          active: f.active,
                        })
                        .eq("id", f.id);
                      report(error, "FAQ diperbarui.");
                      await load();
                    })()
                  }
                >
                  <Save size={14} /> Simpan
                </button>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    void (async () => {
                      const { error } = await supabase.from("faqs").delete().eq("id", f.id);
                      report(error, "FAQ dihapus.");
                      await load();
                    })()
                  }
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeSubTab === "news" && (
        <div className="space-y-3">
          <Panel>
            <h3 className="font-display text-sm font-bold text-primary">
              Tambah Pengumuman Berjalan
            </h3>
            <Row label="Pesan baru">
              <input
                className="field"
                placeholder="Pesan berjalan di beranda..."
                value={newsDraft.message}
                onChange={(e) => setNewsDraft({ ...newsDraft, message: e.target.value })}
              />
            </Row>
            <button
              className="btn-primary w-full"
              disabled={!newsDraft.message}
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from("announcements").insert(newsDraft);
                  report(error, "Pengumuman ditambahkan.");
                  setNewsDraft({ message: "", sort: 0, active: true });
                  await load();
                })()
              }
            >
              <Plus size={14} /> Tambah Pengumuman
            </button>
          </Panel>

          {news.map((n) => (
            <Panel key={n.id}>
              <Row label="Pesan">
                <input
                  className="field"
                  value={n.message}
                  onChange={(e) =>
                    setNews((xs) =>
                      xs.map((x) => (x.id === n.id ? { ...x, message: e.target.value } : x)),
                    )
                  }
                />
              </Row>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={n.active}
                  onChange={(e) =>
                    setNews((xs) =>
                      xs.map((x) => (x.id === n.id ? { ...x, active: e.target.checked } : x)),
                    )
                  }
                />
                Tampilkan di beranda
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="btn-primary"
                  onClick={() =>
                    void (async () => {
                      const { error } = await supabase
                        .from("announcements")
                        .update({ message: n.message, active: n.active, sort: n.sort })
                        .eq("id", n.id);
                      report(error, "Pengumuman diperbarui.");
                      await load();
                    })()
                  }
                >
                  <Save size={14} /> Simpan
                </button>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    void (async () => {
                      const { error } = await supabase
                        .from("announcements")
                        .delete()
                        .eq("id", n.id);
                      report(error, "Pengumuman dihapus.");
                      await load();
                    })()
                  }
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* SITE CONTENT / PUBLIC TEXTS TAB */}
      {activeSubTab === "texts" && (
        <div className="space-y-3">
          <h3 className="font-display text-base font-bold">Teks Konten Publik & Halaman</h3>
          {texts.map((t) => (
            <Panel key={t.key}>
              <Row label={t.label ?? t.key}>
                <textarea
                  className="field"
                  rows={2}
                  value={t.value}
                  onChange={(e) =>
                    setTexts((xs) =>
                      xs.map((x) => (x.key === t.key ? { ...x, value: e.target.value } : x)),
                    )
                  }
                />
              </Row>
              <button
                className="btn-primary w-full"
                onClick={() =>
                  void (async () => {
                    const { error } = await supabase
                      .from("site_content")
                      .update({ value: t.value })
                      .eq("key", t.key);
                    report(error, `Konten '${t.label ?? t.key}' berhasil diperbarui.`);
                    await load();
                  })()
                }
              >
                <Save size={14} /> Simpan Perubahan
              </button>
            </Panel>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Kode bonus ---------------- */

export function BonusPanel() {
  const [items, setItems] = useState<BonusCode[]>([]);
  const [draft, setDraft] = useState({ code: "", amount: 0, max_uses: 1, active: true });
  const { report, node } = useFeedback();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("bonus_codes")
      .select("id,code,amount,max_uses,used_count,active")
      .order("code");
    setItems((data ?? []) as BonusCode[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-5 space-y-3">
      {node}
      <Panel>
        <h3 className="font-display text-sm font-bold text-primary">Tambah Kode Bonus</h3>
        <div className="grid grid-cols-2 gap-2">
          <Row label="Kode">
            <input
              className="field uppercase"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            />
          </Row>
          <Row label="Nominal">
            <input
              type="number"
              className="field"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
            />
          </Row>
          <Row label="Batas pemakaian">
            <input
              type="number"
              className="field"
              value={draft.max_uses}
              onChange={(e) => setDraft({ ...draft, max_uses: Number(e.target.value) })}
            />
          </Row>
        </div>
        <button
          className="btn-primary w-full"
          disabled={!draft.code}
          onClick={() =>
            void (async () => {
              const { error } = await supabase.from("bonus_codes").insert(draft);
              report(error, "Kode bonus dibuat.");
              setDraft({ code: "", amount: 0, max_uses: 1, active: true });
              await load();
            })()
          }
        >
          <Plus size={14} /> Tambah Kode
        </button>
      </Panel>
      {items.map((b) => (
        <Panel key={b.id}>
          <div className="flex items-center justify-between">
            <strong className="font-display text-sm text-primary">{b.code}</strong>
            <span className="text-xs text-muted-foreground">
              {b.used_count}/{b.max_uses} dipakai
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Row label="Nominal">
              <input
                type="number"
                className="field"
                value={b.amount}
                onChange={(e) =>
                  setItems((xs) =>
                    xs.map((x) => (x.id === b.id ? { ...x, amount: Number(e.target.value) } : x)),
                  )
                }
              />
            </Row>
            <Row label="Batas pemakaian">
              <input
                type="number"
                className="field"
                value={b.max_uses}
                onChange={(e) =>
                  setItems((xs) =>
                    xs.map((x) => (x.id === b.id ? { ...x, max_uses: Number(e.target.value) } : x)),
                  )
                }
              />
            </Row>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={b.active}
              onChange={(e) =>
                setItems((xs) =>
                  xs.map((x) => (x.id === b.id ? { ...x, active: e.target.checked } : x)),
                )
              }
            />
            Kode aktif
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase
                    .from("bonus_codes")
                    .update({ amount: b.amount, max_uses: b.max_uses, active: b.active })
                    .eq("id", b.id);
                  report(error, "Kode diperbarui.");
                  await load();
                })()
              }
            >
              <Save size={14} /> Simpan
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from("bonus_codes").delete().eq("id", b.id);
                  report(error, "Kode dihapus.");
                  await load();
                })()
              }
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </Panel>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada kode bonus.</p>}
    </section>
  );
}

/* ---------------- Pesanan ---------------- */

export function OrdersPanel({ nameOf }: { nameOf: (id: string) => string }) {
  const [items, setItems] = useState<Order[]>([]);
  const { report, node } = useFeedback();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id,user_id,product_id,product_name,price,daily,days,total,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data ?? []) as Order[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-5 space-y-2">
      {node}
      <h3 className="font-display text-base font-bold">Pesanan Produk ({items.length})</h3>
      {items.map((o) => (
        <Panel key={o.id}>
          <div className="flex items-start justify-between">
            <div>
              <strong className="font-display text-sm">{o.product_name}</strong>
              <p className="text-[10px] uppercase text-muted-foreground">
                {nameOf(o.user_id)} • {new Date(o.created_at).toLocaleDateString("id-ID")}
              </p>
            </div>
            <span className="text-xs text-primary">{rupiah(o.price)}</span>
          </div>
          <Row label="Status">
            <select
              className="field"
              value={o.status}
              onChange={(e) =>
                setItems((xs) =>
                  xs.map((x) => (x.id === o.id ? { ...x, status: e.target.value } : x)),
                )
              }
            >
              <option value="active">Aktif</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase
                    .from("orders")
                    .update({ status: o.status })
                    .eq("id", o.id);
                  report(error, "Status pesanan diperbarui.");
                  await load();
                })()
              }
            >
              <Save size={14} /> Simpan
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from("orders").delete().eq("id", o.id);
                  report(error, "Pesanan dihapus.");
                  await load();
                })()
              }
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </Panel>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>}
    </section>
  );
}
