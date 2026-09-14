import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AppShell, Card, PageIntro, QuickActions, SectionTitle } from '@/components/menara-ui'
import { meta, rupiah } from '@/lib/menara-data'
import { fetchProducts, type Product } from '@/lib/content'

export const Route = createFileRoute('/vip')({
  head: () => meta('Katalog Produk', 'Pilih paket investasi sesuai tujuan dan kemampuan Anda.'),
  component: Page,
})

function Page() {
  const [items, setItems] = useState<Product[]>([])
  const [tab, setTab] = useState<'REGULER' | 'VIP' | 'SEMUA'>('REGULER')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchProducts().then((p) => {
      setItems(p)
      setLoading(false)
    })
  }, [])

  const list = tab === 'SEMUA' ? items : items.filter((p) => p.type === tab)

  return (
    <AppShell>
      <PageIntro eyebrow={`${items.length} PRODUK`} title="Pilihan untuk langkah berikutnya">
        Pilih paket berdasarkan tujuan dan kemampuan Anda.
      </PageIntro>
      <QuickActions />
      <div className="mt-5 grid grid-cols-3 gap-2">
        {(['REGULER', 'VIP', 'SEMUA'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn-primary' : 'btn-secondary'}>
            {t}
          </button>
        ))}
      </div>
      <SectionTitle aside={<span className="text-xs text-primary">{list.length} produk</span>}>
        Katalog Menara
      </SectionTitle>
      {loading && <Card>Memuat produk…</Card>}
      {!loading && list.length === 0 && <Card>Belum ada produk pada kategori ini.</Card>}
      <div className="space-y-3">
        {list.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <span className="eyebrow">{p.type}</span>
                <h2 className="mt-2 font-display text-xl font-bold">{p.name}</h2>
              </div>
              <span className="font-display text-lg font-bold text-primary">{rupiah(p.price)}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="stat">
                <span>Harian</span>
                <strong>{rupiah(p.daily)}</strong>
              </div>
              <div className="stat">
                <span>Durasi</span>
                <strong>{p.days} hari</strong>
              </div>
              <div className="stat">
                <span>Hasil</span>
                <strong className="text-primary">{rupiah(p.total)}</strong>
              </div>
            </div>
            <Link to="/package/details/$id" params={{ id: p.id }} className="btn-primary mt-4 w-full">
              Beli
            </Link>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
