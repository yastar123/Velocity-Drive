import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpFromLine } from 'lucide-react'
import { AppShell, Card, Notice, PageIntro, SectionTitle, Stat } from '@/components/menara-ui'
import { PaymentImage, ScheduleBanner, StatusBadge } from '@/components/payment-ui'
import { banks, meta, rupiah } from '@/lib/menara-data'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  fetchPaymentSettings,
  isWindowOpen,
  tanggal,
  type PaymentSettings,
  type WithdrawRequest,
} from '@/lib/payments'

export const Route = createFileRoute('/_authenticated/withdraw')({
  head: () => meta('Penarikan Manual', 'Ajukan penarikan saldo ke rekening bank atau e-wallet Anda.'),
  component: Page,
})

function Page() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [balance, setBalance] = useState(0)
  const [rows, setRows] = useState<WithdrawRequest[]>([])
  const [method, setMethod] = useState('BCA')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const [s, profile, list] = await Promise.all([
      fetchPaymentSettings(),
      supabase.from('profiles').select('balance,full_name').eq('id', user.id).maybeSingle(),
      supabase
        .from('withdraw_requests')
        .select('id,user_id,amount,method,account_name,account_number,proof_path,status,admin_note,created_at,reviewed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setSettings(s)
    setBalance(Number(profile.data?.balance ?? 0))
    setAccountName((prev) => prev || (profile.data?.full_name ?? ''))
    setRows((list.data ?? []) as WithdrawRequest[])
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const enabled = settings?.withdraw_enabled ?? false
  const open = settings ? isWindowOpen(settings.withdraw_start, settings.withdraw_end) : false
  const canSubmit = Boolean(settings) && enabled && open
  const minimum = settings?.min_withdraw ?? 0

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!user || !settings) return
    setErr(null)
    setMsg(null)
    const value = Number(amount)
    if (!Number.isFinite(value) || value < minimum) {
      setErr(`Nominal minimal ${rupiah(minimum)}.`)
      return
    }
    if (value > balance) {
      setErr('Nominal melebihi saldo Anda.')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.from('withdraw_requests').insert({
        user_id: user.id,
        amount: value,
        method,
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
      })
      if (error) throw new Error(error.message)
      setMsg('Permintaan penarikan terkirim. Admin akan mentransfer manual dan mengirim bukti transfernya di sini.')
      setAmount('')
      await load()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Gagal mengirim permintaan penarikan.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell back="/profile" title="PENARIKAN MANUAL">
      <PageIntro eyebrow="TARIK SALDO" title="Penarikan ke rekening Anda">
        Kirim nomor rekening atau e-wallet beserta nominalnya. Admin mentransfer manual lalu melampirkan bukti transfer.
      </PageIntro>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat label="Saldo Tersedia" value={rupiah(balance)} accent />
        <Stat label="Minimal" value={rupiah(minimum)} />
      </div>

      {settings && (
        <ScheduleBanner
          label="Penarikan"
          start={settings.withdraw_start}
          end={settings.withdraw_end}
          open={open}
          enabled={enabled}
        />
      )}

      <SectionTitle>Formulir Penarikan</SectionTitle>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label>
            <span className="label">Bank / E-Wallet</span>
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
              {banks.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Nama Pemilik Rekening</span>
            <input required className="field" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </label>
          <label>
            <span className="label">Nomor Rekening / E-Wallet</span>
            <input
              required
              inputMode="numeric"
              className="field"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            />
          </label>
          <label>
            <span className="label">Nominal Penarikan</span>
            <input
              required
              type="number"
              inputMode="numeric"
              className="field"
              min={minimum || 1}
              placeholder={`Minimal ${rupiah(minimum)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <button className="btn-primary w-full disabled:opacity-50" disabled={busy || !canSubmit}>
            <ArrowUpFromLine size={15} /> {busy ? 'Mengirim…' : 'Ajukan Penarikan'}
          </button>
          {!canSubmit && settings && (
            <p className="text-center text-[11px] text-muted-foreground">
              Formulir aktif hanya pada jam layanan penarikan.
            </p>
          )}
          {err && <p className="text-center text-xs text-destructive">{err}</p>}
          {msg && <p className="text-center text-xs text-primary">{msg}</p>}
        </form>
      </Card>

      <SectionTitle aside={<span className="text-xs text-muted-foreground">{rows.length} permintaan</span>}>
        Permintaan Penarikan Anda
      </SectionTitle>
      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-primary">{rupiah(r.amount)}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {r.method} • {r.account_number} • {r.account_name}
                </p>
                <p className="text-[11px] text-muted-foreground">{tanggal(r.created_at)}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            {r.admin_note && <p className="mt-2 text-[11px] text-muted-foreground">Catatan admin: {r.admin_note}</p>}
            {r.proof_path && (
              <div className="mt-3">
                <p className="label">Bukti Transfer Admin</p>
                <PaymentImage path={r.proof_path} alt="Bukti transfer dari admin" className="max-h-72" />
              </div>
            )}
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Belum ada permintaan penarikan.</p>}
      </div>

      <Notice>Pastikan nama dan nomor rekening benar. Kesalahan data dapat memperlambat proses transfer.</Notice>
      <Link to="/history" className="btn-secondary mt-4 w-full">
        Lihat Riwayat
      </Link>
    </AppShell>
  )
}
