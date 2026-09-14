import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AppShell, Card, CopyButton, Notice, PageIntro, SectionTitle, Stat } from '@/components/menara-ui'
import { meta, rupiah } from '@/lib/menara-data'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/profile')({
  ssr: false,
  head: () => meta('Profil & Pusat Akun', 'Kelola identitas, saldo, keamanan, dan bantuan.'),
  component: Page,
})

const menus = [['Isi Saldo', '/deposit'], ['Penarikan', '/withdraw'], ['Riwayat', '/history'], ['Promo', '/exchange'], ['Rekening Bank', '/add-bank-create'], ['Tim & Referral', '/my-team'], ['Ubah Kata Sandi', '/change/password'], ['Tentang Kami', '/about'], ['FAQ & Bantuan', '/faq']]

function Page() {
  const { user, role, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)
  const [name, setName] = useState('')

  useEffect(() => {
    if (!user) return
    void supabase
      .from('profiles')
      .select('full_name,balance')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.full_name ?? '')
          setBalance(Number(data.balance ?? 0))
        }
      })
  }, [user])

  async function signOut() {
    await supabase.auth.signOut()
    await navigate({ to: '/auth', replace: true })
  }

  const initials = (name || user?.email || 'PS').slice(0, 2).toUpperCase()

  return (
    <AppShell>
      <PageIntro eyebrow="RUANG PERSONAL ANDA" title="Profil & Pusat Akun" />
      <Card>
        <div className="flex items-center gap-3">
          <div className="brand-mark !size-12 text-lg">{initials}</div>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold">{name || (loading ? 'Memuat…' : 'Tamu')}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {user ? `Peran: ${role === 'admin' ? 'Admin' : 'Pengguna'}` : 'Belum masuk'}
            </p>
          </div>
        </div>
        <div className="mt-4 data-row"><span>Email</span><strong className="text-right text-[11px]">{user?.email ?? '-'}</strong></div>
        <div className="data-row"><span>Status Akun</span><strong>{user ? 'Aktif' : 'Belum masuk'}</strong></div>
        <div className="data-row"><span>Kode Referral</span><div className="flex items-center gap-2"><strong>963tts5608</strong><CopyButton text="963tts5608" /></div></div>
      </Card>

      {isAdmin && (
        <Link to="/admin" className="btn-primary mt-4 w-full">Buka Panel Admin</Link>
      )}

      <SectionTitle>Ringkasan Saldo</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Utama" value={rupiah(balance)} accent />
        <Stat label="Deposit" value="Rp0" />
        <Stat label="Penarikan" value="Rp0" />
      </div>

      <SectionTitle>Semua Menu</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {menus.map((m) => <Link key={m[0]} to={m[1] as '/'} className="btn-secondary min-h-12 text-center">{m[0]}</Link>)}
        <a href="https://t.me/" className="btn-secondary min-h-12 text-center" target="_blank" rel="noreferrer">Layanan Pelanggan</a>
        {user
          ? <button className="btn-secondary min-h-12" onClick={() => void signOut()}>Keluar</button>
          : <Link to="/auth" className="btn-secondary min-h-12 text-center">Masuk</Link>}
      </div>
      <Notice>Jaga kerahasiaan password dan OTP. Admin resmi tidak pernah meminta password melalui chat.</Notice>
    </AppShell>
  )
}
