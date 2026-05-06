import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react"
import {
  asc,
  cleanedPayloads,
  desc,
  eq,
  getDb,
  intakeMessages,
  intakeRuns,
  intakeSteps,
  scrapeProvenance,
} from "@buildinaus/database"
import { PageShell, Panel, PanelHeader } from "@/components/layout/page-shell"
import { DetailBodySkeleton } from "@/components/layout/skeletons"
import { requireAdmin } from "@/lib/auth/admin"

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Intake run — BuildinAus admin",
}

export default function AdminRunPage({ params }: PageProps) {
  return (
    <PageShell>
      <Link
        href="/admin/queue"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Review queue
      </Link>

      <Suspense fallback={<DetailBodySkeleton />}>
        <RunBody params={params} />
      </Suspense>
    </PageShell>
  )
}

async function RunBody({ params }: PageProps) {
  await requireAdmin()
  const { id } = await params

  const db = getDb()
  const [run] = await db
    .select()
    .from(intakeRuns)
    .where(eq(intakeRuns.id, id))
    .limit(1)
  if (!run) notFound()

  const [messages, steps, payloads, scrapes] = await Promise.all([
    db
      .select()
      .from(intakeMessages)
      .where(eq(intakeMessages.runId, id))
      .orderBy(asc(intakeMessages.id)),
    db
      .select()
      .from(intakeSteps)
      .where(eq(intakeSteps.runId, id))
      .orderBy(asc(intakeSteps.startedAt)),
    db
      .select()
      .from(cleanedPayloads)
      .where(eq(cleanedPayloads.runId, id))
      .orderBy(desc(cleanedPayloads.createdAt)),
    db
      .select()
      .from(scrapeProvenance)
      .where(eq(scrapeProvenance.runId, id))
      .orderBy(asc(scrapeProvenance.fetchedAt)),
  ])

  return (
    <>
      <header className="mt-6 flex flex-col gap-2 border-b border-border/60 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {run.status}
          </span>
          {run.outcome && (
            <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {run.outcome}
            </span>
          )}
          {run.intent && (
            <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {run.intent}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-medium tracking-tight md:text-3xl">
          {run.initialInput}
        </h1>
        <div className="flex flex-wrap gap-3 font-mono text-[11px] text-muted-foreground">
          <span>id {run.id}</span>
          {run.workflowRunId && <span>workflow {run.workflowRunId}</span>}
          {run.modelId && <span>model {run.modelId}</span>}
          {typeof run.totalTokens === "number" && (
            <span>tokens {run.totalTokens}</span>
          )}
          {run.region && <span>region {run.region}</span>}
        </div>
      </header>

      <div className="mt-8 grid gap-3 lg:grid-cols-6">
        <Panel className="lg:col-span-4">
          <PanelHeader label={`Messages (${messages.length})`} />
          {messages.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-border/60">
              {messages.map((m) => (
                <li key={m.id} className="space-y-2 px-6 py-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.role} · {formatTime(m.createdAt)}
                  </div>
                  <pre className="max-h-72 overflow-auto rounded-md border border-border/60 bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
                    {JSON.stringify(m.parts, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader label={`Steps (${steps.length})`} />
          {steps.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-border/60">
              {steps.map((s) => (
                <li key={s.id} className="px-6 py-3">
                  <div className="text-sm font-medium">{s.stepName}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
                    <span>{s.status}</span>
                    <span>·</span>
                    <span>attempt {s.attempt}</span>
                    {typeof s.inputTokens === "number" && (
                      <>
                        <span>·</span>
                        <span>
                          {s.inputTokens}↑ / {s.outputTokens ?? 0}↓
                        </span>
                      </>
                    )}
                  </div>
                  {s.errorText && (
                    <p className="mt-1 text-[11px] text-destructive">
                      {s.errorText}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-3">
          <PanelHeader label={`Scrapes (${scrapes.length})`} />
          {scrapes.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-border/60">
              {scrapes.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 px-6 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm hover:text-foreground/70"
                    >
                      <span className="truncate">{s.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <div className="mt-0.5 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
                      <span>{s.provider}</span>
                      <span>{s.cacheHit ? "cache hit" : "fresh"}</span>
                      {typeof s.status === "number" && <span>{s.status}</span>}
                      <span>{s.contentHash.slice(0, 12)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-3">
          <PanelHeader label={`Payloads (${payloads.length})`} />
          {payloads.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-border/60">
              {payloads.map((p) => (
                <li key={p.id} className="px-6 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      payload #{p.id}
                    </span>
                    <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.kind}
                    </span>
                    <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.status}
                    </span>
                  </div>
                  <Link
                    href={`/admin/queue?status=${p.status}`}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    View in queue
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

function Empty() {
  return (
    <div className="px-6 py-8 text-center text-xs text-muted-foreground">
      Nothing recorded.
    </div>
  )
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
