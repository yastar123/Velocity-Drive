import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Notice, PageIntro, SectionTitle, Stat } from "@/components/menara-ui";
import { meta, rupiah } from "@/lib/menara-data";
export const Route = createFileRoute("/task")({
  head: () => meta("Tugas & Gaji Agen", "Pantau target anggota aktif dan gaji mingguan."),
  component: Page,
});
const targets: [number, number][] = [
  [10, 50000],
  [25, 105000],
  [45, 230000],
  [75, 450000],
  [100, 800000],
  [300, 6800000],
  [500, 12000000],
];
function Page() {
  return (
    <AppShell>
      <PageIntro eyebrow="PROGRAM LEADER TEAM" title="Tim berkembang. Target makin dekat.">
        Pantau anggota aktif Level 1 dan target gaji mingguan.
      </PageIntro>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Gaji Mingguan" value="Rp0" />
        <Stat label="Pembayaran" value="Setiap Minggu" />
        <Stat label="Anggota Aktif" value="0" />
        <Stat label="Total Level 1" value="0" />
      </div>
      <SectionTitle>Progres Target Level 1</SectionTitle>
      <Card>
        <div className="flex justify-between text-xs">
          <span>Anggota aktif</span>
          <b className="text-primary">0 / 10</b>
        </div>
        <div className="progress my-3">
          <i style={{ width: "0%" }} />
        </div>
        <p className="text-xs text-muted-foreground">
          Butuh 10 anggota lagi. Gaji target berikutnya <b className="text-primary">Rp50.000</b>.
        </p>
      </Card>
      <SectionTitle>Target & Gaji Mingguan</SectionTitle>
      <Card>
        {targets.map((x) => (
          <div className="data-row" key={x[0]}>
            <span>{x[0]} Anggota Aktif</span>
            <strong>{rupiah(x[1])}</strong>
          </div>
        ))}
      </Card>
      <SectionTitle>Ketentuan Program</SectionTitle>
      <Notice>
        Hanya anggota Level 1 yang aktif membeli produk dihitung satu kali. Gaji mengikuti target
        tertinggi, dibayar setiap hari Minggu, dan tampilan ini bukan bukti pembayaran.
      </Notice>
    </AppShell>
  );
}
