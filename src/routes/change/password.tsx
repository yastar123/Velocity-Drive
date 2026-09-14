import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { AppShell, Card, Notice, PageIntro, Stat } from "@/components/menara-ui";
import { meta } from "@/lib/menara-data";

export const Route = createFileRoute("/change/password")({
  head: () => meta("Ubah Kata Sandi", "Perbarui kata sandi akun dengan aman."),
  component: Page,
});
function Page() {
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({ old: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const valid =
    f.next.length >= 6 && /[A-Za-z]/.test(f.next) && /\d/.test(f.next) && f.next === f.confirm;
  function submit(e: FormEvent) {
    e.preventDefault();
    if (valid) setSaved(true);
  }
  return (
    <AppShell back="/home" title="KATA SANDI AKUN">
      <PageIntro eyebrow="PUSAT KEAMANAN" title="Perbarui kata sandi Anda">
        Gunakan kata sandi baru yang kuat dan berbeda dari akun lain.
      </PageIntro>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Status" value="Aktif" />
        <Stat label="Proteksi" value="Standar" />
        <Stat label="Akses" value="Pribadi" />
      </div>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          {(
            [
              ["old", "Kata Sandi Lama"],
              ["next", "Kata Sandi Baru"],
              ["confirm", "Konfirmasi Kata Sandi"],
            ] as ["old" | "next" | "confirm", string][]
          ).map((x) => (
            <label key={x[0]}>
              <span className="label">{x[1]}</span>
              <div className="relative">
                <input
                  required
                  minLength={x[0] === "next" ? 6 : 1}
                  type={show ? "text" : "password"}
                  className="field pr-12"
                  value={f[x[0] as keyof typeof f]}
                  onChange={(e) => setF({ ...f, [x[0]]: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="Tampilkan kata sandi"
                  className="absolute right-1 top-1 icon-btn !border-0"
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          ))}
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {[
              [f.next.length >= 6, "Minimal 6 karakter"],
              [/[A-Za-z]/.test(f.next), "Ada huruf"],
              [/\d/.test(f.next), "Ada angka"],
              [f.next !== "" && f.next === f.confirm, "Konfirmasi cocok"],
            ].map((x) => (
              <span className={x[0] ? "text-primary" : "text-muted-foreground"} key={String(x[1])}>
                • {String(x[1])}
              </span>
            ))}
          </div>
          <button disabled={!valid} className="btn-primary w-full disabled:opacity-40">
            Simpan Kata Sandi Baru
          </button>
          {saved && (
            <p className="text-center text-xs text-primary">
              Kata sandi baru tersimpan secara lokal.
            </p>
          )}
        </form>
      </Card>
      <Notice>
        Jangan gunakan password yang sama, jangan bagikan kepada siapa pun, dan segera ganti jika
        diduga diketahui orang lain.
      </Notice>
    </AppShell>
  );
}
