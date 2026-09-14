import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Empty, PageIntro, Stat } from "@/components/menara-ui";
import { meta } from "@/lib/menara-data";
export const Route = createFileRoute("/team-details/$level")({
  head: () => meta("Detail Team", "Daftar anggota jaringan per level."),
  component: Page,
});
function Page() {
  const { level } = Route.useParams();
  return (
    <AppShell back="/my-team" title={`TEAM LEVEL ${level}`}>
      <PageIntro eyebrow="VELOCITY DRIVER • JARINGAN" title="Kenali tim Anda">
        Lihat anggota, detail akun, dan ringkasan transaksi pada level ini.
      </PageIntro>
      <Stat label="Total anggota level ini" value="0 member" accent />
      <div className="mt-4">
        <Empty
          title="Belum ada member"
          text="Member baru pada level ini akan muncul otomatis setelah terdaftar."
        />
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        Privasi: email ditampilkan sebagian. Pencarian menggunakan bagian email yang terlihat pada
        kartu anggota.
      </p>
    </AppShell>
  );
}
