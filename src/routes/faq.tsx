import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AppShell, Card, PageIntro } from '@/components/menara-ui'
import { meta } from '@/lib/menara-data'
import { fetchFaqs, type Faq } from '@/lib/content'

export const Route = createFileRoute('/faq')({
  head: () => meta('FAQ & Bantuan', 'Jawaban pertanyaan umum mengenai akun dan keamanan.'),
  component: Page,
})

function Page() {
  const [items, setItems] = useState<Faq[]>([])
  useEffect(() => {
    void fetchFaqs().then(setItems)
  }, [])

  return (
    <AppShell back="/profile" title="FAQ & BANTUAN">
      <PageIntro eyebrow="PUSAT BANTUAN" title="Pertanyaan yang sering diajukan">
        Temukan jawaban cepat seputar akun, saldo, dan keamanan.
      </PageIntro>
      <div className="space-y-2">
        {items.map((f) => (
          <Card key={f.id}>
            <h2 className="font-display text-sm font-bold text-primary">{f.question}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.answer}</p>
          </Card>
        ))}
        {items.length === 0 && <Card>Belum ada pertanyaan yang dipublikasikan.</Card>}
      </div>
    </AppShell>
  )
}
