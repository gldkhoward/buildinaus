import { PageShell, PageHeader, Panel } from "@/components/layout/page-shell"

export const metadata = {
  title: "Terms — BuildinAus",
  description: "Terms of service for using BuildinAus.",
}

const SECTIONS = [
  {
    title: "Use of the index",
    body: "BuildinAus is free to read and free to contribute to. You may share, embed, and link to public profiles on the index. Bulk scraping for redistribution requires written permission.",
  },
  {
    title: "Submissions",
    body: "By submitting a startup, founder, role, or event you confirm you have the right to share that information and that it's accurate at the time of submission. We reserve the right to edit submissions for clarity or reject submissions that don't meet the editorial bar.",
  },
  {
    title: "Acceptable use",
    body: "Don't use BuildinAus to harass, defame, or impersonate. Don't use the intake bar to attempt prompt injection or to extract data we haven't published. Automated abuse will be rate-limited via Vercel BotID.",
  },
  {
    title: "Liability",
    body: "BuildinAus is provided as-is. We aim to keep the index accurate but make no warranty about uptime, completeness, or fitness for any particular purpose. The Australian Consumer Law gives you statutory rights that nothing here can take away.",
  },
  {
    title: "Changes",
    body: "Terms updates land on the changelog. Continued use after a change means you accept it.",
  },
]

export default function TermsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Legal"
        title="Terms of service"
        description="Plain-English ground rules for using the platform. Last updated 2026-05-01."
      />
      <Panel className="mt-8 p-6 text-sm leading-relaxed text-foreground/90">
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-2">
              <h2 className="text-base font-medium tracking-tight">
                {s.title}
              </h2>
              <p className="text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </Panel>
    </PageShell>
  )
}
