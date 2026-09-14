import { supabase } from '@/integrations/supabase/client'

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export type PaymentSettings = {
  qris_path: string | null
  qris_owner_name: string | null
  bank_instruction: string | null
  deposit_enabled: boolean
  withdraw_enabled: boolean
  deposit_start: string
  deposit_end: string
  withdraw_start: string
  withdraw_end: string
  min_deposit: number
  min_withdraw: number
}

export type DepositRequest = {
  id: string
  user_id: string
  amount: number
  method: string
  sender_name: string | null
  proof_path: string | null
  status: RequestStatus
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
}

export type WithdrawRequest = {
  id: string
  user_id: string
  amount: number
  method: string
  account_name: string
  account_number: string
  proof_path: string | null
  status: RequestStatus
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
}

export const statusLabel: Record<RequestStatus, string> = {
  pending: 'MENUNGGU',
  approved: 'DISETUJUI',
  rejected: 'DITOLAK',
}

export const statusTone: Record<RequestStatus, string> = {
  pending: 'text-primary',
  approved: 'text-primary',
  rejected: 'text-destructive',
}

/** Jam Indonesia Barat (WIB) dipakai sebagai acuan jam kerja. */
export function jakartaClock(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

export function toMinutes(time: string): number {
  const [h = '0', m = '0'] = time.split(':')
  return Number(h) * 60 + Number(m)
}

export function hhmm(time: string | null | undefined): string {
  return (time ?? '00:00').slice(0, 5)
}

export function isWindowOpen(start: string, end: string): boolean {
  const now = toMinutes(jakartaClock())
  const from = toMinutes(start)
  const to = toMinutes(end)
  return from <= to ? now >= from && now <= to : now >= from || now <= to
}

export function tanggal(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const BUCKET = 'payments'

export async function uploadPaymentImage(
  folder: 'deposit' | 'withdraw' | 'qris',
  userId: string,
  file: File,
): Promise<string> {
  const raw = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const ext = raw.replace(/[^a-z0-9]/g, '') || 'jpg'
  const name = `${crypto.randomUUID()}.${ext}`
  const path = folder === 'qris' ? `qris/${name}` : `${folder}/${userId}/${name}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, file.type ? { contentType: file.type } : {})
  if (error) throw new Error(error.message)
  return path
}

export async function signedImageUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

export async function fetchPaymentSettings(): Promise<PaymentSettings | null> {
  const { data } = await supabase
    .from('payment_settings')
    .select(
      'qris_path,qris_owner_name,bank_instruction,deposit_enabled,withdraw_enabled,deposit_start,deposit_end,withdraw_start,withdraw_end,min_deposit,min_withdraw',
    )
    .maybeSingle()
  if (!data) return null
  return {
    ...data,
    min_deposit: Number(data.min_deposit ?? 0),
    min_withdraw: Number(data.min_withdraw ?? 0),
  }
}
