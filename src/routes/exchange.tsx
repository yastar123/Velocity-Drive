import { FormEvent, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, Notice, PageIntro, SectionTitle, Stat } from "@/components/menara-ui";
import { meta } from "@/lib/menara-data";

export const Route = createFileRoute("/exchange")({
  head: () => meta("Pusat Bonus Member", "Verifikasi dan klaim kode bonus."),
  component: Page,
});
function Page() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  async function paste() {
    const t = await navigator.clipboard.readText();
    setCode(t.toUpperCase());
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(code ? "Kode tersimpan dan siap diverifikasi." : "Masukkan kode bonus.");
  }
  return (
    <AppShell>
      <PageIntro eyebrow="BONUS UNTUK ANDA" title="Satu kode, langkah mudah">
        Masukkan kode, periksa validitas, lalu konfirmasi klaim.
      </PageIntro>
      <Card>
        <form onSubmit={submit}>
          <span className="label">Kode Bonus</span>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              className="field uppercase"
              placeholder="BONUS MEMBER"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button type="button" onClick={() => void paste()} className="btn-secondary">
              Tempel
            </button>
          </div>
          <button className="btn-primary mt-3 w-full">Verifikasi Kode Bonus</button>
          {msg && <p className="mt-3 text-center text-xs text-primary">{msg}</p>}
        </form>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Status" value="Aktif" />
          <Stat label="Verifikasi" value="Realtime" />
          <Stat label="Reward" value="Ke Akun" />
        </div>
      </Card>
      <SectionTitle>Cara Klaim</SectionTitle>
      {[
        "Masukkan kode — ketik atau tempel kode bonus",
        "Verifikasi kode — tekan tombol verifikasi",
        "Konfirmasi klaim — pilih Ambil Reward",
      ].map((x, i) => (
        <Card key={x} className="mb-2">
          <span className="mr-2 text-primary">0{i + 1}</span>
          <span className="text-xs">{x}</span>
        </Card>
      ))}
      <Notice>
        Jangan mengirim password, OTP, PIN, atau kode keamanan untuk alasan klaim bonus.
      </Notice>
      <Link to="/faq" className="btn-secondary mt-4 w-full">
        Kode bermasalah? Buka Bantuan
      </Link>
    </AppShell>
  );
}
