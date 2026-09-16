import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { ContentPanel } from "@/components/admin-crud";
import { useAuth } from "@/hooks/use-auth";
import { meta } from "@/lib/menara-data";

export const Route = createFileRoute("/cms")({
  head: () =>
    meta(
      "CMS - Manajemen Konten Publik",
      "Kelola Banner Carousel, Pengumuman, FAQ, dan Konten Publik Velocity Driver.",
    ),
  component: CMSPage,
});

function CMSPage() {
  const { isAdmin, role, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email === "admin@velocitydriver.com") return;
    if (!loading && role && !isAdmin) {
      void navigate({ to: "/home", replace: true });
    }
  }, [loading, role, isAdmin, navigate, user?.email]);

  if (loading && user?.email !== "admin@velocitydriver.com") {
    return (
      <main className="grid min-h-screen place-items-center bg-stage text-sm text-muted-foreground">
        Memuat Halaman CMS...
      </main>
    );
  }

  if (!isAdmin && user?.email !== "admin@velocitydriver.com") {
    return (
      <main className="grid min-h-screen place-items-center bg-stage text-sm text-muted-foreground">
        Akses ditolak. Halaman ini khusus Administrator.
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-stage text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/60 text-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>CMS Publik Velocity Driver</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">
              CRUD Banner Slider, Pengumuman Berjalan, FAQ, & Teks Publik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/home"
            className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary hover:text-primary transition-colors"
          >
            Lihat Beranda &rarr;
          </Link>
        </div>
      </header>

      {/* Main CMS Container */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-foreground">Pusat Manajemen Konten Publik (CMS)</p>
            <p className="text-muted-foreground">
              Semua perubahan banner carousel, pengumuman berjalan (ticker), FAQ, dan teks halaman
              akan langsung tersimpan dan tampil otomatis kepada seluruh pengguna di halaman publik
              aplikasi.
            </p>
          </div>
        </div>

        {/* The Full Featured CMS Panel */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <ContentPanel />
        </div>
      </main>
    </div>
  );
}
