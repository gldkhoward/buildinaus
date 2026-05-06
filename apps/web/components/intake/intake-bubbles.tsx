"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@buildinaus/ui/atoms/dropdown-menu"
import { cn } from "@buildinaus/ui/lib/utils"
import {
  clearCompletedBubbles,
  removeIntakeBubble,
  useIntakeBubbles,
  type IntakeBubble,
} from "@/lib/intake-registry"

const MAX_INLINE = 3

export function IntakeBubbles() {
  const bubbles = useIntakeBubbles()
  const running = bubbles.filter((b) => b.status === "running")
  const inline = running.slice(0, MAX_INLINE)
  const overflow = Math.max(0, bubbles.length - inline.length)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Intakes (${running.length} running)`}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border border-border/80 bg-card/50 pl-1.5 pr-2 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground",
            running.length === 0 && bubbles.length === 0 && "px-2",
          )}
        >
          {inline.length === 0 ? (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span className="font-mono uppercase tracking-wider text-[10px]">
                Intakes
              </span>
            </>
          ) : (
            <span className="flex items-center -space-x-1.5">
              {inline.map((b, i) => (
                <BubbleDot key={b.id} bubble={b} index={i} />
              ))}
            </span>
          )}
          {overflow > 0 && (
            <span className="rounded-full border border-border/60 bg-muted/40 px-1.5 font-mono text-[10px] tabular-nums">
              +{overflow}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Intakes · {running.length} running
          </div>
          {bubbles.some((b) => b.status !== "running") && (
            <button
              type="button"
              onClick={clearCompletedBubbles}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" />
              Clear completed
            </button>
          )}
        </div>

        {bubbles.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {bubbles.map((b) => (
              <BubbleRow key={b.id} bubble={b} />
            ))}
          </ul>
        )}

        <div className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
          Each intake runs in its own tab. Fire as many as you like — they
          don't block each other.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Inline dot (header pill) ─────────────────────────────────────────── */

function BubbleDot({ bubble, index }: { bubble: IntakeBubble; index: number }) {
  return (
    <span
      title={bubble.input}
      style={{ zIndex: 10 - index }}
      className={cn(
        "relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card",
        bubble.status === "running" && "ring-1 ring-chart-1/60",
        bubble.status === "errored" && "ring-1 ring-destructive/60",
      )}
    >
      <StatusIcon status={bubble.status} />
    </span>
  )
}

/* ── Dropdown row ─────────────────────────────────────────────────────── */

function BubbleRow({ bubble }: { bubble: IntakeBubble }) {
  const ago = useTimeAgo(bubble.startedAt)
  const onOpen = () => {
    // Re-open the intake page for this run. New tab so the user can keep
    // working in the current tab.
    window.open(
      `/intake?q=${encodeURIComponent(bubble.input)}&run=${bubble.id}`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  return (
    <li className="group relative flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-start gap-3 text-left"
      >
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/70",
            bubble.status === "running" && "ring-1 ring-chart-1/50",
            bubble.status === "errored" && "ring-1 ring-destructive/50",
          )}
        >
          <StatusIcon status={bubble.status} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">
            {bubble.resourceLabel ?? bubble.input}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono uppercase tracking-wider">
              {STATUS_LABEL[bubble.status]}
            </span>
            <span aria-hidden>·</span>
            <span>{ago}</span>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          removeIntakeBubble(bubble.id)
        }}
        aria-label="Remove from list"
        className="invisible mt-0.5 self-start rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground group-hover:visible"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  )
}

const STATUS_LABEL: Record<IntakeBubble["status"], string> = {
  running: "Running",
  completed: "Done",
  errored: "Failed",
}

function StatusIcon({ status }: { status: IntakeBubble["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-3 w-3 animate-spin text-chart-1" />
    case "completed":
      return <CheckCircle2 className="h-3 w-3 text-foreground/70" />
    case "errored":
      return <AlertCircle className="h-3 w-3 text-destructive" />
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border bg-muted/40">
        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
      <p className="text-xs text-muted-foreground">
        No intakes yet. Drop a link or a question in the command bar.
      </p>
    </div>
  )
}

/* ── Time helpers ─────────────────────────────────────────────────────── */

function useTimeAgo(timestamp: number): string {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(id)
  }, [])
  return formatRelative(timestamp, now)
}

function formatRelative(then: number, now: number): string {
  const seconds = Math.max(1, Math.floor((now - then) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
