import { useEffect, useState } from "react";
import { Clock, ImageOff, Maximize2, X } from "lucide-react";
import { hhmm, signedImageUrl, statusLabel, statusTone, type RequestStatus } from "@/lib/payments";

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`status-dot ${statusTone[status]}`}>{statusLabel[status]}</span>;
}

export function PaymentImage({
  path,
  alt,
  className = "",
}: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (!path) return;

    if (path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://")) {
      setUrl(path);
      return;
    }

    void signedImageUrl(path).then((u) => {
      if (!active) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (!path || failed) {
    return (
      <div
        className={`grid min-h-24 place-items-center rounded-md border border-border bg-muted text-muted-foreground ${className}`}
      >
        <ImageOff size={20} />
      </div>
    );
  }
  if (!url) {
    return (
      <div
        className={`min-h-24 animate-pulse rounded-md border border-border bg-muted ${className}`}
      />
    );
  }
  return (
    <>
      <div className="group relative cursor-pointer overflow-hidden rounded-md border border-border bg-muted/30">
        <img
          src={url}
          alt={alt}
          loading="lazy"
          onClick={() => setIsZoomed(true)}
          className={`w-full object-contain transition-transform duration-200 group-hover:scale-[1.02] ${className}`}
          onError={() => setFailed(true)}
        />
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          aria-label="Perbesar gambar"
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px] font-medium text-white opacity-80 backdrop-blur-xs transition-opacity group-hover:opacity-100 hover:bg-black/90"
        >
          <Maximize2 size={12} />
          <span>Perbesar</span>
        </button>
      </div>

      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs transition-all animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-background shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-card">
              <p className="truncate text-xs font-semibold text-foreground">{alt}</p>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Tutup pratinjau"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 max-h-[80vh] overflow-auto flex items-center justify-center bg-black/20">
              <img src={url} alt={alt} className="max-h-[75vh] w-auto object-contain rounded-md" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ScheduleBanner({
  label,
  start,
  end,
  open,
  enabled,
}: {
  label: string;
  start: string;
  end: string;
  open: boolean;
  enabled: boolean;
}) {
  const text = !enabled
    ? `${label} sedang dinonaktifkan oleh admin.`
    : open
      ? `${label} BUKA. Jam layanan ${hhmm(start)}–${hhmm(end)} WIB.`
      : `${label} TUTUP. Silakan kembali pada jam ${hhmm(start)}–${hhmm(end)} WIB.`;
  return (
    <div className="notice">
      <Clock className="shrink-0" size={16} />
      <span>{text}</span>
    </div>
  );
}
