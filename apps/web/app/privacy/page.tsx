import { PageShell, PageHeader, Panel } from "@/components/layout/page-shell"

export const metadata = {
  title: "Privacy — BuildinAus",
  description:
    "How BuildinAus collects, stores, and uses information about people and companies on the index.",
}

const SECTIONS = [
  {
    title: "What we collect",
    body: "Account data (email, name) when you sign up. Submissions you make through the intake bar. Public information about companies, founders, jobs, and events that we index from public sources.",
  },
  {
    title: "What we don't collect",
    body: "We don't sell user data. We don't run cross-site tracking. Vercel Analytics is enabled in production for aggregate page-view counts only — no per-user profiles.",
  },
  {
    title: "Where it lives",
    body: "Account and editorial data lives in Neon Postgres in ap-southeast-2. Generated content (intake transcripts, scrape archives) lives in Vercel Blob in the same region.",
  },
  {
    title: "Editorial removal",
    body: "If a profile on the index needs to come down, email hello@buildinaus.dev with the URL. We aim to action verified removal requests within five business days.",
  },
  {
    title: "Updates",
    body: "Material changes will be flagged on the changelog with at least 14 days' notice for signed-in users.",
  },
]

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Legal"
        title="Privacy"
        description="Plain-English summary of what we collect and how we use it. Last updated 2026-05-01."
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
