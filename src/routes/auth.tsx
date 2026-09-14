import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { meta } from '@/lib/menara-data'

export const Route = createFileRoute('/auth')({
  ssr: false,
  head: () => meta('Masuk Akun', 'Masuk ke akun investor atau panel admin Menara Miliarder.'),
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function landingFor(userId: string) {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()
    return data ? ('/admin' as const) : ('/home' as const)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const to = await landingFor(data.session.user.id)
      void navigate({ to, replace: true })
    })
  }, [navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'login') {
        const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const to = signIn.user ? await landingFor(signIn.user.id) : ('/home' as const)
        await navigate({ to, replace: true })

      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        })
        if (error) throw error
        if (!data.session) {
          setMsg('Akun dibuat. Cek email Anda untuk konfirmasi sebelum masuk.')
        } else {
          const uid = data.session.user.id
          await supabase.from('profiles').upsert({ id: uid, email, full_name: name || email })
          await supabase.from('user_roles').insert({ user_id: uid, role: 'user' })
          await navigate({ to: '/home', replace: true })
        }
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Terjadi kesalahan.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-stage">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center border-x border-border bg-background px-5 py-10 shadow-app">
        <div className="mb-6 flex items-center gap-3">
          <div className="brand-mark"><Crown size={18} /></div>
          <div>
            <p className="font-display text-sm font-bold text-primary">MENARA MILIARDER</p>
            <p className="text-[9px] font-semibold uppercase text-muted-foreground">Portal Akun</p>
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold">{mode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akun admin otomatis diarahkan ke panel admin setelah masuk.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="label" htmlFor="name">Nama Lengkap</label>
              <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
          </div>
          <div>
            <label className="label" htmlFor="password">Kata Sandi</label>
            <input id="password" type="password" required minLength={6} className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {msg && <p className="notice">{msg}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 text-xs text-muted-foreground underline"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(null) }}
        >
          {mode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk'}
        </button>

        <div className="mt-6 rounded-md border border-border bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground">
          <p className="mb-1 font-bold text-primary">Akun Demo</p>
          <p>Admin — admin@menara.com / Menara123!</p>
          <p>User — user@menara.com / Menara123!</p>
        </div>
      </div>
    </main>
  )
}
