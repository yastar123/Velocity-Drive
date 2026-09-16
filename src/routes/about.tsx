import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, PageIntro, SectionTitle, Stat } from "@/components/menara-ui";
import { meta } from "@/lib/menara-data";
export const Route = createFileRoute("/about")({
  head: () =>
    meta(
      "Velocity Driver",
      "Profil perusahaan, visi misi, dan pendekatan investasi armada supercar Velocity Driver.",
    ),
  component: Page,
});
const founders = [
  ["BC", "Benoît Colas"],
  ["JM", "Jean-Pierre Millet"],
  ["FF", "Franck Falézan"],
];
function Page() {
  return (
    <AppShell title="VELOCITY DRIVER" subtitle="SUPERCAR INVESTMENT PLATFORM">
      <PageIntro
        eyebrow="TENTANG KAMI • PROFIL PERUSAHAAN"
        title="Menciptakan dividen berkelanjutan melalui manajemen armada supercar profesional"
      >
        Berfokus pada portofolio supercar performa tinggi dengan imbal hasil harian yang transparan
        dan stabil.
      </PageIntro>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Armada" value="9+ Unit" />
        <Stat label="Komisi" value="Hingga 30%" />
        <Stat label="Penarikan" value="24 Jam" />
      </div>
      <SectionTitle>Tentang Velocity Driver</SectionTitle>
      <Card>
        <h2 className="font-display text-xl font-bold text-primary">Velocity Driver Nusantara</h2>
        <p className="mt-1 text-xs">Platform Investasi Armada Supercar Eksklusif</p>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Platform kepemilikan dan sewa armada performa tinggi dengan sistem bagi hasil dividen per
          jam. Didukung teknologi otomatisasi terdepan, transparansi penarikan dana 24 jam, dan
          skema referral 3 tingkat.
        </p>
      </Card>
      <SectionTitle>Pendekatan Investasi</SectionTitle>
      <div className="space-y-2">
        {[
          ["Identifikasi", "Menemukan potensi nilai pada perusahaan publik."],
          ["Kepemilikan", "Mengambil posisi minoritas substansial."],
          ["Kolaborasi", "Menciptakan nilai berkelanjutan bersama pemangku kepentingan."],
        ].map((x, i) => (
          <Card key={x[0]}>
            <span className="text-primary">0{i + 1}</span>
            <h3 className="mt-1 font-display font-bold">{x[0]}</h3>
            <p className="text-xs text-muted-foreground">{x[1]}</p>
          </Card>
        ))}
      </div>
      <SectionTitle>Leadership</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {founders.map((f) => (
          <Card key={f[0]} className="text-center">
            <div className="mx-auto brand-mark">{f[0]}</div>
            <p className="mt-2 text-[11px] font-bold">{f[1]}</p>
            <p className="text-[9px] text-muted-foreground">Co-Founder</p>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Klik foto pendiri untuk melihat pengalaman dan profil lengkap.
      </p>
      <SectionTitle>Warisan Pengalaman</SectionTitle>
      <Card>
        <strong className="font-display text-3xl text-primary">Supercar Fleet</strong>
        <p className="mt-2 text-xs text-muted-foreground">
          Pengelolaan armada kendaraan performa tinggi dengan standar keamanan dan utilitas sewa
          optimal.
        </p>
      </Card>
      <Link to="/home" className="btn-primary mt-4 w-full">
        Dashboard
      </Link>
      <p className="mt-5 text-center text-[9px] text-muted-foreground">
        © 2026 Velocity Driver Nusantara. All rights reserved.
      </p>
    </AppShell>
  );
}
