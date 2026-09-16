import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X, TrendingUp, ShieldCheck, Gift, Send } from "lucide-react";

interface WelcomeModalProps {
  userName?: string;
  telegramUrl?: string;
}

export function WelcomeModal({
  userName = "Investor",
  telegramUrl = "https://t.me/",
}: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Selalu muncul setiap kali halaman home diakses atau direfresh
    setIsRendered(true);
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setIsRendered(false);
    }, 300);
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-end justify-center transition-all duration-300 ${
        isOpen ? "bg-black/80 backdrop-blur-xs" : "bg-transparent pointer-events-none"
      }`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full max-w-[430px] max-h-[85vh] flex flex-col transition-all duration-300 ease-out transform ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex w-full flex-col overflow-hidden rounded-t-[24px] border-t border-x border-primary/40 bg-card shadow-2xl sm:rounded-[24px] sm:border">
          {/* Header Banner - Supercar Luxury Dark Gold Theme */}
          <div className="relative border-b border-primary/20 bg-gradient-to-br from-[#261d10] via-[#1a1612] to-[#101117] p-4.5 text-foreground sm:p-5">
            {/* Top Bar: Logo & Close Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Velocity Driver"
                  className="h-8 w-auto shrink-0 object-contain"
                />
                <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                  Velocity Driver
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup popup"
                className="flex size-8 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Greetings */}
            <div className="mt-3.5">
              <h2 className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Selamat Datang di <span className="text-primary">Velocity Driver</span> 👋
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Platform investasi dan manajemen armada supercar digital
              </p>
            </div>
          </div>

          {/* Body Konten - Dark Carbon Theme dengan Scroll Responsif */}
          <div className="max-h-[calc(85vh-140px)] space-y-3.5 overflow-y-auto bg-background p-4.5 sm:p-5">
            {/* User Greeting */}
            <div>
              <h3 className="font-display text-sm font-bold text-foreground sm:text-base">
                Halo, <span className="text-primary">{userName}</span>!
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Nikmati berbagai fitur <strong className="text-primary">Velocity Driver</strong> dan
                kelola akunmu dengan mudah.
              </p>
            </div>

            {/* Two Column Feature Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-xs sm:p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary shadow-xs sm:size-9">
                  <ShieldCheck size={17} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                    Aman & Terpercaya
                  </span>
                  <strong className="block truncate font-display text-xs font-bold text-foreground">
                    Kelola Investasi
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-xs sm:p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/15 text-amber-400 shadow-xs sm:size-9">
                  <TrendingUp size={17} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                    Investasi
                  </span>
                  <strong className="block truncate font-display text-xs font-bold text-foreground">
                    Minimum 150k
                  </strong>
                </div>
              </div>
            </div>

            {/* Dashed Border Benefit Card */}
            <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-primary/60 bg-primary/10 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs sm:size-9">
                <Gift size={17} />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  Keuntungan
                </span>
                <strong className="block font-display text-xs font-bold text-primary sm:text-sm">
                  Bonus & Komisi Hingga 35%
                </strong>
              </div>
            </div>

            {/* Main Action Button */}
            <Link
              to="/vip"
              onClick={handleClose}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-primary to-amber-600 py-3 text-center font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-md shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.99]"
            >
              Lihat Produk
            </Link>

            {/* Bottom Row Buttons */}
            <div className="flex items-center gap-2.5">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0088cc] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#0077b5] active:scale-[0.99]"
              >
                <Send size={13} className="shrink-0" />
                <span>Telegram</span>
              </a>
              <button
                type="button"
                onClick={handleClose}
                className="flex flex-1 items-center justify-center rounded-xl border border-border bg-muted/70 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.99]"
              >
                Nanti
              </button>
            </div>

            {/* Powered By Footer */}
            <p className="pt-0.5 text-center text-[10px] text-muted-foreground/80">
              Powered by <span className="font-bold text-primary">VELOCITY DRIVER</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
