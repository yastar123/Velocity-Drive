import { useCallback, useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { rupiah } from '@/lib/menara-data'
import {
  fetchAnnouncements,
  fetchFaqs,
  fetchProducts,
  fetchSiteContentRows,
  type Announcement,
  type BonusCode,
  type Faq,
  type Order,
  type Product,
  type SiteContent,
} from '@/lib/content'

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="panel space-y-2">{children}</section>
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

function useFeedback() {
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const report = (error: { message: string } | null, okText: string) => {
    if (error) {
      setErr(error.message)
      setMsg(null)
    } else {
      setMsg(okText)
      setErr(null)
    }
  }
  const node = (
    <>
      {err && <p className="notice text-destructive">{err}</p>}
      {msg && <p className="notice">{msg}</p>}
    </>
  )
  return { report, node }
}

/* ---------------- Produk ---------------- */

const emptyProduct = {
  name: '',
  price: 0,
  daily: 0,
  total: 0,
  days: 30,
  type: 'REGULER',
  description: '',
  active: true,
  sort: 0,
}

export function ProductsPanel() {
  const [items, setItems] = useState<Product[]>([])
  const [draft, setDraft] = useState({ ...emptyProduct })
  const { report, node } = useFeedback()

  const load = useCallback(async () => setItems(await fetchProducts(true)), [])
  useEffect(() => {
    void load()
  }, [load])

  async function create() {
    const { error } = await supabase.from('products').insert(draft)
    report(error, 'Produk ditambahkan.')
    if (!error) setDraft({ ...emptyProduct })
    await load()
  }
  async function save(p: Product) {
    const { id, ...rest } = p
    const { error } = await supabase.from('products').update(rest).eq('id', id)
    report(error, 'Produk diperbarui.')
    await load()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    report(error, 'Produk dihapus.')
    await load()
  }

  const patch = (id: string, part: Partial<Product>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...part } : x)))

  return (
    <section className="mt-5 space-y-3">
      {node}
      <Panel>
        <h3 className="font-display text-sm font-bold text-primary">Tambah Produk</h3>
        <Row label="Nama produk">
          <input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <Row label="Harga">
            <input type="number" className="field" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
          </Row>
          <Row label="Hasil harian">
            <input type="number" className="field" value={draft.daily} onChange={(e) => setDraft({ ...draft, daily: Number(e.target.value) })} />
          </Row>
          <Row label="Total hasil">
            <input type="number" className="field" value={draft.total} onChange={(e) => setDraft({ ...draft, total: Number(e.target.value) })} />
          </Row>
          <Row label="Durasi (hari)">
            <input type="number" className="field" value={draft.days} onChange={(e) => setDraft({ ...draft, days: Number(e.target.value) })} />
          </Row>
          <Row label="Tipe">
            <select className="field" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              <option value="REGULER">REGULER</option>
              <option value="VIP">VIP</option>
            </select>
          </Row>
          <Row label="Urutan">
            <input type="number" className="field" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} />
          </Row>
        </div>
        <Row label="Deskripsi">
          <textarea className="field" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </Row>
        <button className="btn-primary w-full" onClick={() => void create()} disabled={!draft.name}>
          <Plus size={14} /> Tambah Produk
        </button>
      </Panel>

      <h3 className="mt-4 font-display text-base font-bold">Daftar Produk ({items.length})</h3>
      {items.map((p) => (
        <Panel key={p.id}>
          <div className="flex items-center justify-between">
            <strong className="font-display text-sm">{p.name}</strong>
            <span className="text-xs text-primary">{rupiah(p.price)}</span>
          </div>
          <Row label="Nama">
            <input className="field" value={p.name} onChange={(e) => patch(p.id, { name: e.target.value })} />
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <Row label="Harga">
              <input type="number" className="field" value={p.price} onChange={(e) => patch(p.id, { price: Number(e.target.value) })} />
            </Row>
            <Row label="Harian">
              <input type="number" className="field" value={p.daily} onChange={(e) => patch(p.id, { daily: Number(e.target.value) })} />
            </Row>
            <Row label="Total">
              <input type="number" className="field" value={p.total} onChange={(e) => patch(p.id, { total: Number(e.target.value) })} />
            </Row>
            <Row label="Durasi (hari)">
              <input type="number" className="field" value={p.days} onChange={(e) => patch(p.id, { days: Number(e.target.value) })} />
            </Row>
            <Row label="Tipe">
              <select className="field" value={p.type} onChange={(e) => patch(p.id, { type: e.target.value })}>
                <option value="REGULER">REGULER</option>
                <option value="VIP">VIP</option>
              </select>
            </Row>
            <Row label="Urutan">
              <input type="number" className="field" value={p.sort} onChange={(e) => patch(p.id, { sort: Number(e.target.value) })} />
            </Row>
          </div>
          <Row label="Deskripsi">
            <textarea className="field" rows={2} value={p.description ?? ''} onChange={(e) => patch(p.id, { description: e.target.value })} />
          </Row>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={p.active} onChange={(e) => patch(p.id, { active: e.target.checked })} />
            Tampilkan produk ini ke pengguna
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={() => void save(p)}>
              <Save size={14} /> Simpan
            </button>
            <button className="btn-secondary" onClick={() => void remove(p.id)}>
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </Panel>
      ))}
    </section>
  )
}

/* ---------------- Konten: FAQ, pengumuman, teks halaman ---------------- */

export function ContentPanel() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [news, setNews] = useState<Announcement[]>([])
  const [texts, setTexts] = useState<SiteContent[]>([])
  const [faqDraft, setFaqDraft] = useState({ question: '', answer: '', sort: 0, active: true })
  const [newsDraft, setNewsDraft] = useState({ message: '', sort: 0, active: true })
  const { report, node } = useFeedback()

  const load = useCallback(async () => {
    setFaqs(await fetchFaqs(true))
    setNews(await fetchAnnouncements(true))
    setTexts(await fetchSiteContentRows())
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="mt-5 space-y-3">
      {node}
      <Panel>
        <h3 className="font-display text-sm font-bold text-primary">Tambah FAQ</h3>
        <Row label="Pertanyaan">
          <input className="field" value={faqDraft.question} onChange={(e) => setFaqDraft({ ...faqDraft, question: e.target.value })} />
        </Row>
        <Row label="Jawaban">
          <textarea className="field" rows={3} value={faqDraft.answer} onChange={(e) => setFaqDraft({ ...faqDraft, answer: e.target.value })} />
        </Row>
        <button
          className="btn-primary w-full"
          disabled={!faqDraft.question || !faqDraft.answer}
          onClick={() =>
            void (async () => {
              const { error } = await supabase.from('faqs').insert(faqDraft)
              report(error, 'FAQ ditambahkan.')
              setFaqDraft({ question: '', answer: '', sort: 0, active: true })
              await load()
            })()
          }
        >
          <Plus size={14} /> Tambah FAQ
        </button>
      </Panel>

      {faqs.map((f) => (
        <Panel key={f.id}>
          <Row label="Pertanyaan">
            <input className="field" value={f.question} onChange={(e) => setFaqs((xs) => xs.map((x) => (x.id === f.id ? { ...x, question: e.target.value } : x)))} />
          </Row>
          <Row label="Jawaban">
            <textarea className="field" rows={3} value={f.answer} onChange={(e) => setFaqs((xs) => xs.map((x) => (x.id === f.id ? { ...x, answer: e.target.value } : x)))} />
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <Row label="Urutan">
              <input type="number" className="field" value={f.sort} onChange={(e) => setFaqs((xs) => xs.map((x) => (x.id === f.id ? { ...x, sort: Number(e.target.value) } : x)))} />
            </Row>
            <label className="mt-5 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={f.active} onChange={(e) => setFaqs((xs) => xs.map((x) => (x.id === f.id ? { ...x, active: e.target.checked } : x)))} />
              Tampilkan
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from('faqs').update({ question: f.question, answer: f.answer, sort: f.sort, active: f.active }).eq('id', f.id)
                  report(error, 'FAQ diperbarui.')
                  await load()
                })()
              }
            >
              <Save size={14} /> Simpan
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from('faqs').delete().eq('id', f.id)
                  report(error, 'FAQ dihapus.')
                  await load()
                })()
              }
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </Panel>
      ))}

      <h3 className="mt-4 font-display text-base font-bold">Pengumuman Berjalan</h3>
      <Panel>
        <Row label="Pesan baru">
          <input className="field" value={newsDraft.message} onChange={(e) => setNewsDraft({ ...newsDraft, message: e.target.value })} />
        </Row>
        <button
          className="btn-primary w-full"
          disabled={!newsDraft.message}
          onClick={() =>
            void (async () => {
              const { error } = await supabase.from('announcements').insert(newsDraft)
              report(error, 'Pengumuman ditambahkan.')
              setNewsDraft({ message: '', sort: 0, active: true })
              await load()
            })()
          }
        >
          <Plus size={14} /> Tambah Pengumuman
        </button>
      </Panel>
      {news.map((n) => (
        <Panel key={n.id}>
          <Row label="Pesan">
            <input className="field" value={n.message} onChange={(e) => setNews((xs) => xs.map((x) => (x.id === n.id ? { ...x, message: e.target.value } : x)))} />
          </Row>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={n.active} onChange={(e) => setNews((xs) => xs.map((x) => (x.id === n.id ? { ...x, active: e.target.checked } : x)))} />
            Tampilkan di beranda
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from('announcements').update({ message: n.message, active: n.active, sort: n.sort }).eq('id', n.id)
                  report(error, 'Pengumuman diperbarui.')
                  await load()
                })()
              }
            >
              <Save size={14} /> Simpan
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from('announcements').delete().eq('id', n.id)
                  report(error, 'Pengumuman dihapus.')
                  await load()
                })()
              }
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </Panel>
      ))}

      <h3 className="mt-4 font-display text-base font-bold">Teks Halaman</h3>
      {texts.map((t) => (
        <Panel key={t.key}>
          <Row label={t.label ?? t.key}>
            <textarea className="field" rows={2} value={t.value} onChange={(e) => setTexts((xs) => xs.map((x) => (x.key === t.key ? { ...x, value: e.target.value } : x)))} />
          </Row>
          <button
            className="btn-primary w-full"
            onClick={() =>
              void (async () => {
                const { error } = await supabase.from('site_content').update({ value: t.value }).eq('key', t.key)
                report(error, 'Teks diperbarui.')
                await load()
              })()
            }
          >
            <Save size={14} /> Simpan
          </button>
        </Panel>
      ))}
    </section>
  )
}

/* ---------------- Kode bonus ---------------- */

export function BonusPanel() {
  const [items, setItems] = useState<BonusCode[]>([])
  const [draft, setDraft] = useState({ code: '', amount: 0, max_uses: 1, active: true })
  const { report, node } = useFeedback()

  const load = useCallback(async () => {
    const { data } = await supabase.from('bonus_codes').select('id,code,amount,max_uses,used_count,active').order('code')
    setItems((data ?? []) as BonusCode[])
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="mt-5 space-y-3">
      {node}
      <Panel>
        <h3 className="font-display text-sm font-bold text-primary">Tambah Kode Bonus</h3>
        <div className="grid grid-cols-2 gap-2">
          <Row label="Kode">
            <input className="field uppercase" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
          </Row>
          <Row label="Nominal">
            <input type="number" className="field" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
          </Row>
          <Row label="Batas pemakaian">
            <input type="number" className="field" value={draft.max_uses} onChange={(e) => setDraft({ ...draft, max_uses: Number(e.target.value) })} />
          </Row>
        </div>
        <button
          className="btn-primary w-full"
          disabled={!draft.code}
          onClick={() =>
            void (async () => {
              const { error } = await supabase.from('bonus_codes').insert(draft)
              report(error, 'Kode bonus dibuat.')
              setDraft({ code: '', amount: 0, max_uses: 1, active: true })
              await load()
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
              <input type="number" className="field" value={b.amount} onChange={(e) => setItems((xs) => xs.map((x) => (x.id === b.id ? { ...x, amount: Number(e.target.value) } : x)))} />
            </Row>
            <Row label="Batas pemakaian">
              <input type="number" className="field" value={b.max_uses} onChange={(e) => setItems((xs) => xs.map((x) => (x.id === b.id ? { ...x, max_uses: Number(e.target.value) } : x)))} />
            </Row>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={b.active} onChange={(e) => setItems((xs) => xs.map((x) => (x.id === b.id ? { ...x, active: e.target.checked } : x)))} />
            Kode aktif
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from('bonus_codes').update({ amount: b.amount, max_uses: b.max_uses, active: b.active }).eq('id', b.id)
                  report(error, 'Kode diperbarui.')
                  await load()
                })()
              }
            >
              <Save size={14} /> Simpan
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from('bonus_codes').delete().eq('id', b.id)
                  report(error, 'Kode dihapus.')
                  await load()
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
  )
}

/* ---------------- Pesanan ---------------- */

export function OrdersPanel({ nameOf }: { nameOf: (id: string) => string }) {
  const [items, setItems] = useState<Order[]>([])
  const { report, node } = useFeedback()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id,user_id,product_id,product_name,price,daily,days,total,status,created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    setItems((data ?? []) as Order[])
  }, [])
  useEffect(() => {
    void load()
  }, [load])

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
                {nameOf(o.user_id)} • {new Date(o.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            <span className="text-xs text-primary">{rupiah(o.price)}</span>
          </div>
          <Row label="Status">
            <select
              className="field"
              value={o.status}
              onChange={(e) => setItems((xs) => xs.map((x) => (x.id === o.id ? { ...x, status: e.target.value } : x)))}
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
                  const { error } = await supabase.from('orders').update({ status: o.status }).eq('id', o.id)
                  report(error, 'Status pesanan diperbarui.')
                  await load()
                })()
              }
            >
              <Save size={14} /> Simpan
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                void (async () => {
                  const { error } = await supabase.from('orders').delete().eq('id', o.id)
                  report(error, 'Pesanan dihapus.')
                  await load()
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
  )
}
