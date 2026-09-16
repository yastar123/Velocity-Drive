import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AppShell,
  Card,
  CopyButton,
  Notice,
  PageIntro,
  SectionTitle,
  Stat,
} from "@/components/menara-ui";
import { meta } from "@/lib/menara-data";
export const Route = createFileRoute("/my-team")({
  head: () => meta("Tim & Komisi", "Kelola jaringan referral tiga level."),
  component: Page,
});
const levels: [string, string, string][] = [
  ["1", "Anggota Langsung", "30%"],
  ["2", "Jaringan Turunan", "3%"],
  ["3", "Jaringan Lanjutan", "1%"],
];
function Page() {
  const link = "https://velocitydriver.work/member/invitation?code=963tts5608";
  return (
    <AppShell>
      <PageIntro eyebrow="JARINGAN" title="Tim & Komisi">
        Perluas jaringan melalui tim dan dapatkan komisi harian dari 3 level referral.
      </PageIntro>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Anggota" value="0" />
        <Stat label="Komisi" value="Rp0" />
        <Stat label="Level Aktif" value="3" accent />
      </div>
      <SectionTitle>Kode & Link Referral</SectionTitle>
      <Card>
        <div className="flex items-center justify-between">
          <code className="text-primary">963tts5608</code>
          <CopyButton text="963tts5608" />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 rounded bg-muted p-2">
          <p className="truncate text-[10px] text-muted-foreground">{link}</p>
          <CopyButton text={link} />
        </div>
      </Card>
      <SectionTitle>Struktur Komisi</SectionTitle>
      <div className="space-y-2">
        {levels.map((l) => (
          <Card key={l[0]}>
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
              <span className="brand-mark !size-9">{l[0]}</span>
              <div>
                <h3 className="text-sm font-bold">
                  Level {l[0]} • {l[1]}
                </h3>
                <p className="text-xs text-muted-foreground">0 anggota • Total Rp0</p>
              </div>
              <strong className="text-primary">{l[2]}</strong>
            </div>
            <Link
              to="/team-details/$level"
              params={{ level: l[0] }}
              className="btn-secondary mt-3 w-full"
            >
              Lihat Detail Level
            </Link>
          </Card>
        ))}
      </div>
      <SectionTitle>Tips Mengembangkan Tim</SectionTitle>
      <Notice>
        Bagikan link resmi, bantu anggota memahami produk, dan hindari janji keuntungan pasti.
      </Notice>
      <SectionTitle>Keamanan & Kepercayaan</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Privasi" value="Data Aman" />
        <Stat label="Referral" value="Terverifikasi" />
        <Stat label="Bantuan" value="Aktif" />
      </div>
    </AppShell>
  );
}
