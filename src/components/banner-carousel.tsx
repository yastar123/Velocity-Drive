import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { fetchBanners, type Banner } from "@/lib/content";

interface BannerCarouselProps {
  banners?: Banner[];
  autoPlayInterval?: number;
}

export function BannerCarousel({
  banners: propBanners,
  autoPlayInterval = 4500,
}: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>(propBanners ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (propBanners && propBanners.length > 0) {
      setBanners(propBanners);
      return;
    }

    let isMounted = true;
    void (async () => {
      const data = await fetchBanners();
      if (isMounted && data.length > 0) {
        setBanners(data);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [propBanners]);

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto play rotation
  useEffect(() => {
    if (banners.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isPaused, autoPlayInterval, nextSlide]);

  if (banners.length === 0) {
    return null;
  }

  // Handle swipe gestures
  const minSwipeDistance = 40;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const currentBanner = banners[currentIndex] || banners[0];

  const renderBannerContent = (banner: Banner) => (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      <img
        src={banner.image_url}
        alt={banner.title || "Banner Promo"}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80";
        }}
      />
      {/* Dynamic gradient overlay for readability & luxury look */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent pointer-events-none" />

      {banner.title && (
        <div className="absolute bottom-3 left-3.5 right-3.5 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-0.5 backdrop-blur-md border border-primary/30 text-[10px] font-bold text-primary mb-1 shadow-sm">
            <Sparkles className="size-3 text-primary animate-pulse" />
            <span>Velocity Promo</span>
          </div>
          <p className="font-display text-sm sm:text-base font-extrabold text-foreground drop-shadow-md line-clamp-1">
            {banner.title}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="group relative w-full overflow-hidden rounded-xl border border-primary/20 bg-card shadow-md"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Main Banner Slide Display */}
      <div className="relative aspect-[21/9] sm:aspect-[2.4/1] w-full overflow-hidden">
        {currentBanner.link_url ? (
          <a href={currentBanner.link_url} className="block h-full w-full">
            {renderBannerContent(currentBanner)}
          </a>
        ) : (
          renderBannerContent(currentBanner)
        )}
      </div>

      {/* Navigation Arrows (Visible on hover on desktop, or always subtly available) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Banner Sebelumnya"
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-md border border-border/60 transition-all opacity-70 group-hover:opacity-100 hover:bg-background hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="size-4" />
          </button>

          <button
            type="button"
            aria-label="Banner Selanjutnya"
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-md border border-border/60 transition-all opacity-70 group-hover:opacity-100 hover:bg-background hover:scale-110 active:scale-95"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {/* Slide Indicator Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 z-10 bg-background/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/30">
          {banners.map((b, idx) => (
            <button
              key={b.id || idx}
              type="button"
              aria-label={`Lihat banner ${idx + 1}`}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
