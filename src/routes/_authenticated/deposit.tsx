import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Upload } from 'lucide-react'
import { AppShell, Card, CopyButton, Notice, PageIntro, SectionTitle, Stat } from '@/components/menara-ui'
import { PaymentImage, ScheduleBanner, StatusBadge } from '@/components/payment-ui'
import { banks, meta, rupiah } from '@/lib/menara-data'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  fetchPaymentSettings,
  isWindowOpen,
  tanggal,
  uploadPaymentImage,
  type DepositRequest,
  type PaymentSettings,
} from '@/lib/payments'

export const Route = createFileRoute('/_authenticated/deposit')({
  head: () => meta('Deposit Manual', 'Isi saldo dengan QRIS atau transfer bank, lalu kirim bukti pembayaran.'),
  component: Page,
})

const methods = ['QRIS', ...banks]

function Page() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [balance, setBalance] = useState(0)
  const [rows, setRows] = useState<DepositRequest[]>([])
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('QRIS')
  const [sender, setSender] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    const [s, profile, list] = await Promise.all([
      fetchPaymentSettings(),
      supabase.from('profiles').select('balance').eq('id', user.id).maybeSingle(),
      supabase
        .from('deposit_requests')
        .select('id,user_id,amount,method,sender_name,proof_path,status,admin_note,created_at,reviewed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setSettings(s)
    setBalance(Number(profile.data?.balance ?? 0))
    setRows((list.data ?? []) as DepositRequest[])
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const enabled = settings?.deposit_enabled ?? false
  const open = settings ? isWindowOpen(settings.deposit_start, settings.deposit_end) : false
  const canSubmit = Boolean(settings) && enabled && open
  const minimum = settings?.min_deposit ?? 0

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
    if (!file) {
      setErr('Unggah bukti pembayaran terlebih dahulu.')
      return
    }
    setBusy(true)
    try {
      const proof = await uploadPaymentImage('deposit', user.id, file)
      const { error } = await supabase.from('deposit_requests').insert({
        user_id: user.id,
        amount: value,
        method,
        sender_name: sender.trim() || null,
        proof_path: proof,
      })
      if (error) throw new Error(error.message)
      setMsg('Permintaan deposit terkirim. Admin akan memeriksa bukti Anda dan menambah saldo.')
      setAmount('')
      setSender('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      await load()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Gagal mengirim permintaan deposit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell back="/home" title="DEPOSIT MANUAL">
      <PageIntro eyebrow="ISI SALDO AKUN" title="Deposit dengan verifikasi admin">
        Bayar ke QRIS atau rekening resmi, unggah buktinya, lalu admin akan menambahkan saldo Anda.
      </PageIntro>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat label="Saldo Utama" value={rupiah(balance)} accent />
        <Stat label="Minimal" value={rupiah(minimum)} />
      </div>

      {settings && (
        <ScheduleBanner
          label="Deposit"
          start={settings.deposit_start}
          end={settings.deposit_end}
          open={open}
          enabled={enabled}
        />
      )}

      <SectionTitle>Kode QRIS Pembayaran</SectionTitle>
      <Card>
        {settings?.qris_path ? (
          <PaymentImage path={settings.qris_path} alt="Kode QRIS pembayaran" className="max-h-80" />
        ) : (
          <p className="text-xs text-muted-foreground">Admin belum mengunggah kode QRIS. Hubungi layanan pelanggan.</p>
        )}
        {settings?.qris_owner_name && (
          <div className="mt-3 data-row">
            <span>Nama Penerima</span>
            <div className="flex items-center gap-2">
              <strong>{settings.qris_owner_name}</strong>
              <CopyButton text={settings.qris_owner_name} />
            </div>
          </div>
        )}
        {settings?.bank_instruction && (
          <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
            {settings.bank_instruction}
          </p>
        )}
      </Card>

      <SectionTitle>Formulir Deposit</SectionTitle>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label>
            <span className="label">Metode Pembayaran</span>
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
              {methods.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Nominal Deposit</span>
            <input
              className="field"
              required
              inputMode="numeric"
              type="number"
              min={minimum || 1}
              placeholder={`Minimal ${rupiah(minimum)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Nama Pengirim</span>
            <input
              className="field"
              placeholder="Nama di rekening pengirim"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Bukti Pembayaran</span>
            <input
              ref={fileInput}
              className="field"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button className="btn-primary w-full disabled:opacity-50" disabled={busy || !canSubmit}>
            <Upload size={15} /> {busy ? 'Mengirim…' : 'Kirim Permintaan Deposit'}
          </button>
          {!canSubmit && settings && (
            <p className="text-center text-[11px] text-muted-foreground">
              Formulir aktif hanya pada jam layanan deposit.
            </p>
          )}
          {err && <p className="text-center text-xs text-destructive">{err}</p>}
          {msg && <p className="text-center text-xs text-primary">{msg}</p>}
        </form>
      </Card>

      <SectionTitle aside={<span className="text-xs text-muted-foreground">{rows.length} permintaan</span>}>
        Permintaan Deposit Anda
      </SectionTitle>
      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-primary">{rupiah(r.amount)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.method} • {tanggal(r.created_at)}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            {r.admin_note && <p className="mt-2 text-[11px] text-muted-foreground">Catatan admin: {r.admin_note}</p>}
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Belum ada permintaan deposit.</p>}
      </div>

      <Notice>Simpan bukti bayar hingga saldo bertambah. Admin resmi tidak pernah meminta password atau OTP.</Notice>
      <Link to="/history" className="btn-secondary mt-4 w-full">
        Lihat Riwayat
      </Link>
    </AppShell>
  )
}
