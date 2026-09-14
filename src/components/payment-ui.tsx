import { useEffect, useState } from 'react'
import { Clock, ImageOff } from 'lucide-react'
import { hhmm, signedImageUrl, statusLabel, statusTone, type RequestStatus } from '@/lib/payments'

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`status-dot ${statusTone[status]}`}>{statusLabel[status]}</span>
}

export function PaymentImage({
  path,
  alt,
  className = '',
}: {
  path: string | null
  alt: string
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setUrl(null)
    setFailed(false)
    if (!path) return
    void signedImageUrl(path).then((u) => {
      if (!active) return
      if (u) setUrl(u)
      else setFailed(true)
    })
    return () => {
      active = false
    }
  }, [path])

  if (!path || failed) {
    return (
      <div className={`grid min-h-24 place-items-center rounded-md border border-border bg-muted text-muted-foreground ${className}`}>
        <ImageOff size={20} />
      </div>
    )
  }
  if (!url) {
    return <div className={`min-h-24 animate-pulse rounded-md border border-border bg-muted ${className}`} />
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={`w-full rounded-md border border-border bg-muted object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

export function ScheduleBanner({
  label,
  start,
  end,
  open,
  enabled,
}: {
  label: string
  start: string
  end: string
  open: boolean
  enabled: boolean
}) {
  const text = !enabled
    ? `${label} sedang dinonaktifkan oleh admin.`
    : open
      ? `${label} BUKA. Jam layanan ${hhmm(start)}–${hhmm(end)} WIB.`
      : `${label} TUTUP. Silakan kembali pada jam ${hhmm(start)}–${hhmm(end)} WIB.`
  return (
    <div className="notice">
      <Clock className="shrink-0" size={16} />
      <span>{text}</span>
    </div>
  )
}
