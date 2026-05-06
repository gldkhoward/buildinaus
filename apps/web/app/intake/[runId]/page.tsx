import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import {
  asc,
  cleanedPayloads,
  eq,
  getDb,
  intakeMessages,
  intakeRuns,
  intakeSteps,
} from "@buildinaus/database"

interface PageProps {
  params: Promise<{ runId: string }>
}

export const metadata = {
  title: "Intake replay — BuildinAus",
  description: "Replay a previous intake run — what the agent saw and decided.",
}

export default function IntakeReplayPage({ params }: PageProps) {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-baseline justify-between gap-4 px-6 py-4">
          <div className="space-y-0.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Intake replay
            </p>
            <h1 className="text-base font-semibold tracking-tight">
              What the agent saw
            </h1>
          </div>
          <Link
            href="/intake"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            New intake
          </Link>
        </div>
      </header>

      <Suspense
        fallback={
          <p className="px-6 py-6 text-sm text-muted-foreground">
            Loading replay…
          </p>
        }
      >
        <Replay params={params} />
      </Suspense>
    </main>
  )
}

async function Replay({ params }: PageProps) {
  const { runId } = await params

  const db = getDb()
  const [run] = await db
    .select()
    .from(intakeRuns)
    .where(eq(intakeRuns.id, runId))
    .limit(1)
  if (!run) notFound()

  const [messages, steps, payloads] = await Promise.all([
    db
      .select()
      .from(intakeMessages)
      .where(eq(intakeMessages.runId, runId))
      .orderBy(asc(intakeMessages.id)),
    db
      .select()
      .from(intakeSteps)
      .where(eq(intakeSteps.runId, runId))
      .orderBy(asc(intakeSteps.startedAt)),
    db
      .select()
      .from(cleanedPayloads)
      .where(eq(cleanedPayloads.runId, runId))
      .orderBy(asc(cleanedPayloads.createdAt)),
  ])

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
      <Section
        label="Run"
        body={
          <div className="space-y-1.5 text-sm text-foreground/90">
            <div className="font-medium">{run.initialInput || "(no input)"}</div>
            <div className="flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
              <span>{run.status}</span>
              {run.outcome && <span>{run.outcome}</span>}
              {run.intent && <span>{run.intent}</span>}
              {run.modelId && <span>{run.modelId}</span>}
            </div>
            {run.summaryMarkdown && (
              <p className="mt-2 text-pretty text-sm text-foreground/80">
                {run.summaryMarkdown}
              </p>
            )}
            {run.redirectUrl && (
              <Link
                href={run.redirectUrl}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-foreground/80"
              >
                Open the resulting profile
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        }
      />

      <Section
        label={`Messages (${messages.length})`}
        body={
          messages.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className="rounded-md border border-border/60 bg-muted/20 p-3"
                >
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.role}
                  </div>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-foreground/90">
                    {JSON.stringify(m.parts, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )
        }
      />

      <Section
        label={`Steps (${steps.length})`}
        body={
          steps.length === 0 ? (
            <Empty />
          ) : (
            <ol className="space-y-2">
              {steps.map((s) => (
                <li
                  key={s.id}
                  className="rounded-md border border-border/60 bg-muted/20 p-3"
                >
                  <div className="text-sm font-medium">{s.stepName}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <span>{s.status}</span>
                    <span>·</span>
                    <span>attempt {s.attempt}</span>
                  </div>
                  {s.errorText && (
                    <p className="mt-1 text-[11px] text-destructive">
                      {s.errorText}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )
        }
      />

      <Section
        label={`Payloads (${payloads.length})`}
        body={
          payloads.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-3">
              {payloads.map((p) => (
                <li
                  key={p.id}
                  className="rounded-md border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono">payload #{p.id}</span>
                    <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.kind}
                    </span>
                    <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.status}
                    </span>
                  </div>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-md border border-border/60 bg-muted/40 p-2 text-[11px] text-foreground/90">
                    {JSON.stringify(p.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )
        }
      />
    </section>
  )
}

function Section({ label, body }: { label: string; body: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      {body}
    </section>
  )
}

function Empty() {
  return (
    <p className="text-xs text-muted-foreground">Nothing recorded.</p>
  )
}
