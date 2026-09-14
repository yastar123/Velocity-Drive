import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, PageIntro, SectionTitle, Stat } from "@/components/menara-ui";
import { meta } from "@/lib/menara-data";
export const Route = createFileRoute("/about")({
  head: () =>
    meta(
      "Prime Stone Investment",
      "Profil, pendekatan investasi, dan pendiri Prime Stone Investment.",
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
    <AppShell title="{PSI} PRIME STONE INVESTMENT" subtitle="ACTIVE OWNERSHIP • LONG-TERM VALUE">
      <PageIntro
        eyebrow="ABOUT • COMPANY PROFILE"
        title="Menciptakan nilai jangka panjang melalui kepemilikan dan kolaborasi konstruktif"
      >
        Berfokus pada perusahaan publik dengan potensi signifikan menciptakan nilai berkelanjutan.
      </PageIntro>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Pendiri" value="3" />
        <Stat label="Bersama" value="25+ Tahun" />
        <Stat label="Pengalaman" value="Eropa" />
      </div>
      <SectionTitle>Tentang PrimeStone</SectionTitle>
      <Card>
        <h2 className="font-display text-xl font-bold text-primary">Prime Stone Investments</h2>
        <p className="mt-1 text-xs">Active ownership • Sustainable long-term value</p>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Mengambil kepemilikan saham minoritas substansial di perusahaan bursa dan bekerja
          konstruktif bersama manajemen serta pemangku kepentingan. Didirikan tiga mantan mitra The
          Carlyle Group yang sebelumnya menjadi konsultan di The Boston Consulting Group.
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
        <strong className="font-display text-3xl text-primary">25+ Years</strong>
        <p className="mt-2 text-xs text-muted-foreground">
          Pengalaman investasi dan operasional bersama di Eropa.
        </p>
      </Card>
      <Link to="/home" className="btn-primary mt-4 w-full">
        Dashboard
      </Link>
      <p className="mt-5 text-center text-[9px] text-muted-foreground">
        © 2026 PSI Prime Stone Investment
      </p>
    </AppShell>
  );
}
