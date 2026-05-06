"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  CornerDownLeft,
  Link2,
  Loader2,
  Search,
  Sparkles,
  User,
} from "lucide-react"
import { cn } from "@buildinaus/ui/lib/utils"
import {
  KIND_LABEL,
  looksLikeUrl,
  normaliseUrl,
  type SearchKind,
  type SearchResult,
} from "@/lib/search"
import { addIntakeBubble } from "@/lib/intake-registry"
import { onFocusCommandBar } from "@/lib/intake-focus"

const SUGGESTIONS = [
  "Search Sydney founders",
  "Paste a link to add a startup",
  "Find robotics jobs in Brisbane",
  "Try \"climate\" or \"devtools\"",
]

interface CommandBarProps {
  variant?: "primary" | "compact"
  className?: string
  autoFocus?: boolean
  onSubmitted?: () => void
}

export function CommandBar({
  variant = "primary",
  className,
  autoFocus,
  onSubmitted,
}: CommandBarProps) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const [value, setValue] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0)

  const [results, setResults] = React.useState<SearchResult[]>([])

  // Debounced fetch against /api/search. Each keystroke aborts the in-flight
  // request so we never render stale results when typing fast.
  React.useEffect(() => {
    const trimmed = value.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=6`,
          { signal: controller.signal },
        )
        if (!res.ok) return
        const data = (await res.json()) as { results: SearchResult[] }
        setResults(data.results ?? [])
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return
        // Network blip — leave previous results in place.
      }
    }, 120)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [value])

  const isUrl = looksLikeUrl(value)
  // The intake agent handles BOTH URLs and prose, so any non-empty input
  // should expose the "Run agent" action — not just URLs.
  const trimmed = value.trim()
  const hasAgentAction = trimmed.length > 0
  const totalRows = (hasAgentAction ? 1 : 0) + results.length

  React.useEffect(() => {
    if (value) return
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SUGGESTIONS.length)
    }, 2800)
    return () => clearInterval(id)
  }, [value])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [value])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === "Escape") {
        inputRef.current?.blur()
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  React.useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
  }, [autoFocus])

  React.useEffect(() => {
    return onFocusCommandBar(({ prefill }) => {
      if (prefill) setValue(prefill)
      setOpen(true)
      requestAnimationFrame(() => inputRef.current?.focus())
    })
  }, [])

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", onClick)
    return () => window.removeEventListener("mousedown", onClick)
  }, [])

  function handleSubmitToAgent(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    // URLs get normalised so the agent doesn't trip on missing schemes.
    const payload = looksLikeUrl(trimmed) ? normaliseUrl(trimmed) : trimmed
    setStatus("loading")
    setOpen(false)
    setValue("")
    onSubmitted?.()

    // Generate a stable run id, register a bubble, and open the intake page
    // in a new tab. The new-tab pattern is what enables parallel intakes —
    // the user stays on the current page and can fire another immediately.
    const runId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    addIntakeBubble({ id: runId, input: payload })

    const url = `/intake?q=${encodeURIComponent(payload)}&run=${runId}`
    if (typeof window !== "undefined") {
      const opened = window.open(url, "_blank", "noopener,noreferrer")
      if (!opened) {
        // Popup blocked — fall back to in-place navigation.
        router.push(url)
      } else {
        // Reset the loading state since we're staying on this page.
        setStatus("idle")
      }
    } else {
      router.push(url)
    }
  }

  function handleSelect(idx: number) {
    if (hasAgentAction && idx === 0) {
      handleSubmitToAgent(value)
      return
    }
    const offset = hasAgentAction ? 1 : 0
    const r = results[idx - offset]
    if (r) {
      router.push(r.href)
      setOpen(false)
      setValue("")
      onSubmitted?.()
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, totalRows - 1)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (totalRows > 0) {
        handleSelect(activeIndex)
      } else if (value.trim()) {
        handleSubmitToAgent(value)
      }
    }
  }

  const compact = variant === "compact"

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 p-1.5 pl-3 backdrop-blur-md transition-colors",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-20px_rgba(0,0,0,0.5)]",
          "focus-within:border-foreground/30",
          compact && "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_12px_30px_-18px_rgba(0,0,0,0.45)]",
        )}
      >
        {isUrl ? (
          <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}

        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            value.length === 0
              ? `Search or paste a link — ${SUGGESTIONS[placeholderIndex]}`
              : undefined
          }
          aria-label="Search or paste a link"
          className={cn(
            "h-10 w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none",
            compact && "h-9",
          )}
        />

        <kbd className="hidden h-6 select-none items-center gap-1 rounded-md border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-[11px] leading-none">⌘</span>K
        </kbd>

        <button
          type="button"
          onClick={() => {
            if (totalRows > 0) handleSelect(activeIndex)
            else if (value.trim()) handleSubmitToAgent(value)
          }}
          disabled={status === "loading" || !value.trim()}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-xs font-medium text-background transition-all",
            "hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50",
            compact && "h-9",
          )}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Routing
            </>
          ) : isUrl ? (
            <>
              Run agent
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Run agent
              <Sparkles className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {open && value.trim() && (
        <ResultsDropdown
          showActions={hasAgentAction}
          isUrl={isUrl}
          results={results}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
          onSelect={handleSelect}
          rawValue={value}
        />
      )}

      {variant === "primary" && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
          <span className="font-mono uppercase tracking-wider text-muted-foreground/70">
            Try:
          </span>
          {["climate founders", "Sydney jobs", "harbourai.dev"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s)
                setOpen(true)
                inputRef.current?.focus()
              }}
              className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ResultsDropdown({
  showActions,
  isUrl,
  results,
  activeIndex,
  onHover,
  onSelect,
  rawValue,
}: {
  showActions: boolean
  isUrl: boolean
  results: SearchResult[]
  activeIndex: number
  onHover: (i: number) => void
  onSelect: (i: number) => void
  rawValue: string
}) {
  let row = 0

  return (
    <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border/80 bg-popover/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
      {showActions && (
        <RowGroup label="Action">
          <ResultRow
            active={activeIndex === row}
            onMouseEnter={() => onHover(row)}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(0)
            }}
            icon={
              isUrl ? (
                <Link2 className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )
            }
            label={
              isUrl ? (
                <>
                  Add <span className="font-mono">{normaliseUrl(rawValue)}</span>{" "}
                  to BuildinAus
                </>
              ) : (
                <>Send this to the intake agent</>
              )
            }
            sublabel={
              isUrl
                ? "Plans, scrapes, sanitizes, and routes you to the new entry."
                : "Plans, classifies, drafts a profile, and routes you to the new entry."
            }
            badge="Run agent"
          />
          {void row++ /* advance row counter */}
        </RowGroup>
      )}

      {results.length > 0 ? (
        <>
          {(["company", "founder", "job", "event"] as SearchKind[]).map((kind) => {
            const group = results.filter((r) => r.kind === kind)
            if (group.length === 0) return null
            return (
              <RowGroup key={kind} label={KIND_LABEL[kind] + "s"}>
                {group.map((r) => {
                  const myRow = row++
                  return (
                    <ResultRow
                      key={r.href}
                      active={activeIndex === myRow}
                      onMouseEnter={() => onHover(myRow)}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onSelect(myRow)
                      }}
                      icon={<KindIcon kind={r.kind} />}
                      label={r.label}
                      sublabel={r.sublabel}
                    />
                  )
                })}
              </RowGroup>
            )
          })}
        </>
      ) : !showActions ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No matches. Paste a URL to add it via the agent.
        </div>
      ) : null}
    </div>
  )
}

function RowGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/60 last:border-b-0">
      <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {label}
      </div>
      <ul>{children}</ul>
    </div>
  )
}

function ResultRow({
  active,
  onMouseEnter,
  onMouseDown,
  icon,
  label,
  sublabel,
  badge,
}: {
  active: boolean
  onMouseEnter: () => void
  onMouseDown: (e: React.MouseEvent) => void
  icon: React.ReactNode
  label: React.ReactNode
  sublabel: string
  badge?: string
}) {
  return (
    <li
      role="option"
      aria-selected={active}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
      className={cn(
        "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        active ? "bg-muted/60" : "hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-card/60",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{sublabel}</div>
      </div>
      {badge && (
        <span className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {badge}
        </span>
      )}
      {active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
    </li>
  )
}

function KindIcon({ kind }: { kind: SearchKind }) {
  const cls = "h-3.5 w-3.5"
  switch (kind) {
    case "company":
      return <Building2 className={cls} />
    case "founder":
      return <User className={cls} />
    case "job":
      return <Briefcase className={cls} />
    case "event":
      return <CalendarDays className={cls} />
  }
}
