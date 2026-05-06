import { Suspense } from "react"
import Link from "next/link"
import {
  Briefcase,
  Building2,
  CalendarDays,
  CornerDownLeft,
  Search as SearchIcon,
  User,
} from "lucide-react"
import { PageShell, PageHeader, Panel, PanelHeader } from "@/components/layout/page-shell"
import { CommandBarTrigger } from "@/components/intake/command-bar-trigger"
import { EmptyListState } from "@/components/layout/empty-state"
import { ListRowsSkeleton } from "@/components/layout/skeletons"
import { KIND_LABEL, type SearchKind, type SearchResult } from "@/lib/search"
import { searchAll } from "@/lib/data/search"

export const metadata = {
  title: "Search — BuildinAus",
  description: "Search every company, founder, job, and event on BuildinAus.",
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; kind?: string }>
}

const KIND_ORDER: SearchKind[] = ["company", "founder", "job", "event"]
const KIND_ICON: Record<SearchKind, React.ReactNode> = {
  company: <Building2 className="h-3.5 w-3.5" />,
  founder: <User className="h-3.5 w-3.5" />,
  job: <Briefcase className="h-3.5 w-3.5" />,
  event: <CalendarDays className="h-3.5 w-3.5" />,
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <PageShell>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <SearchIcon className="h-3 w-3" />
            Search
          </span>
        }
        title="Search the index"
        description="Find a company, founder, job, or event. Use the command bar (⌘K) for quick lookups, or this page for full results."
      />

      <Suspense fallback={<SearchSkeleton />}>
        <SearchBody searchParams={searchParams} />
      </Suspense>
    </PageShell>
  )
}

function SearchSkeleton() {
  return (
    <>
      <SearchForm initialQuery="" initialKind={null} />
      <ListRowsSkeleton count={4} label="loading" />
    </>
  )
}

async function SearchBody({ searchParams }: SearchPageProps) {
  const { q = "", kind: kindRaw } = await searchParams
  const query = q.trim()
  const kindFilter = (KIND_ORDER as string[]).includes(kindRaw ?? "")
    ? (kindRaw as SearchKind)
    : null

  const filtered = query
    ? await searchAll(query, { kind: kindFilter, limit: 200 })
    : []

  return (
    <>
      <SearchForm initialQuery={query} initialKind={kindFilter} />

      {!query ? (
        <EmptyListState
          icon={<SearchIcon className="h-4 w-4" />}
          title="Type a query to search"
          description="The index covers companies, founders, jobs, and events. You can also drop a URL into the intake bar to add a new entry."
          actionLabel="Open the intake bar"
        />
      ) : filtered.length === 0 ? (
        <EmptyListState
          icon={<SearchIcon className="h-4 w-4" />}
          title="No matches"
          description={`We couldn't find anything in the index for "${query}". Have a link? Drop it in and the agent will see if it's worth indexing.`}
          prefill={query}
          actionLabel="Send to intake"
        />
      ) : (
        <ResultsByKind results={filtered} activeKind={kindFilter} />
      )}
    </>
  )
}

function ResultsByKind({
  results,
  activeKind,
}: {
  results: SearchResult[]
  activeKind: SearchKind | null
}) {
  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    rows: results.filter((r) => r.kind === kind),
  })).filter((g) => g.rows.length > 0)

  return (
    <div className="mt-10 space-y-6">
      {grouped.map((g) => {
        if (activeKind && g.kind !== activeKind) return null
        return (
          <Panel key={g.kind}>
            <PanelHeader
              icon={KIND_ICON[g.kind]}
              label={`${KIND_LABEL[g.kind]}s (${g.rows.length})`}
            />
            <ul className="divide-y divide-border/60">
              {g.rows.map((r) => (
                <li key={r.href} className="group">
                  <Link
                    href={r.href}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{r.label}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.sublabel}</div>
                    </div>
                    <CornerDownLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )
      })}
    </div>
  )
}

function SearchForm({
  initialQuery,
  initialKind,
}: {
  initialQuery: string
  initialKind: SearchKind | null
}) {
  return (
    <form
      method="get"
      action="/search"
      className="mt-8 flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2">
        <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          name="q"
          defaultValue={initialQuery}
          autoFocus
          placeholder="Search companies, founders, jobs, events…"
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
        />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <select
          name="kind"
          defaultValue={initialKind ?? ""}
          className="rounded-md border border-border/60 bg-background px-2 py-2 text-xs"
        >
          <option value="">All kinds</option>
          {KIND_ORDER.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}s
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Search
        </button>
        <CommandBarTrigger
          className="inline-flex h-9 items-center gap-1 rounded-md border border-border/60 bg-card/40 px-3 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
          prefill={initialQuery}
        >
          ⌘K
        </CommandBarTrigger>
      </div>
    </form>
  )
}
