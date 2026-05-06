import Link from "next/link"
import { Suspense } from "react"
import { ArrowUpRight, Inbox } from "lucide-react"
import { cleanedPayloads, desc, eq, getDb } from "@buildinaus/database"
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"
import { ListRowsSkeleton } from "@/components/layout/skeletons"
import { requireAdmin } from "@/lib/auth/admin"
import { QueueRow } from "./queue-row"
import { summarisePayload } from "./payload-summary"

export const metadata = {
  title: "Review queue — BuildinAus admin",
}

interface QueuePageProps {
  searchParams: Promise<{ status?: string }>
}

export default function AdminQueuePage({ searchParams }: QueuePageProps) {
  return (
    <PageShell>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Inbox className="h-3 w-3" />
            Admin
          </span>
        }
        title="Cleaned payloads — review queue"
        description="Drafts the agent has produced. Promote to publish a row, or reject to drop it."
      />

      <Suspense fallback={<ListRowsSkeleton count={6} label="loading" />}>
        <QueueBody searchParams={searchParams} />
      </Suspense>
    </PageShell>
  )
}

async function QueueBody({ searchParams }: QueuePageProps) {
  await requireAdmin()
  const { status = "drafted" } = await searchParams
  const allowed = ["drafted", "approved", "rejected", "superseded"] as const
  const safe = (allowed as readonly string[]).includes(status)
    ? (status as (typeof allowed)[number])
    : "drafted"

  const db = getDb()
  const rows = await db
    .select()
    .from(cleanedPayloads)
    .where(eq(cleanedPayloads.status, safe))
    .orderBy(desc(cleanedPayloads.createdAt))
    .limit(100)

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-2 text-xs">
        {(["drafted", "approved", "rejected"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/queue?status=${s}`}
            className={`rounded-md border px-3 py-1.5 font-mono uppercase tracking-wider transition-colors ${
              s === safe
                ? "border-foreground/40 bg-foreground text-background"
                : "border-border/60 bg-card/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Panel className="mt-8">
          <PanelHeader label={`${safe} (0)`} />
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nothing in the {safe} bucket. The intake agent writes here every
            time it produces a structured profile.
          </div>
        </Panel>
      ) : (
        <Panel className="mt-8">
          <PanelHeader
            label={`${safe} (${rows.length})`}
            accessory={
              <Link
                href="/intake"
                className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                Open intake →
              </Link>
            }
          />
          <ul className="divide-y divide-border/60">
            {rows.map((row) => {
              const summary = summarisePayload(
                row.kind,
                row.payload as Record<string, unknown>,
                { sourceUrl: row.sourceUrl, id: row.id },
              )
              return (
                <li key={row.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{summary.title}</span>
                      <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {row.kind}
                      </span>
                      {typeof row.confidence === "number" && (
                        <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                          conf {row.confidence}
                        </span>
                      )}
                    </div>
                    {summary.subtitle && (
                      <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                        {summary.subtitle}
                      </p>
                    )}
                    {summary.badges.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {summary.badges.map((b) => (
                          <span
                            key={b}
                            className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">payload #{row.id}</span>
                      <Link
                        href={`/admin/runs/${row.runId}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        run trace
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      {row.sourceUrl && (
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          source
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                        payload
                      </summary>
                      <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-border/60 bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
                        {JSON.stringify(row.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                  {safe === "drafted" && <QueueRow payloadId={row.id} />}
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </>
  )
}
