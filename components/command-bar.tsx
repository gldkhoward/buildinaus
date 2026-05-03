"use client"

import * as React from "react"
import { ArrowRight, Link2, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "yourstartup.com.au",
  "github.com/your-org/your-repo",
  "linkedin.com/company/your-startup",
]

export function CommandBar() {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [value, setValue] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">("idle")
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0)

  // Cycle the example suggestions when the input is empty
  React.useEffect(() => {
    if (value) return
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SUGGESTIONS.length)
    }, 2800)
    return () => clearInterval(id)
  }, [value])

  // ⌘K / Ctrl+K to focus
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setStatus("loading")
    setTimeout(() => {
      setStatus("success")
      setValue("")
      setTimeout(() => setStatus("idle"), 2200)
    }, 900)
  }

  return (
    <form onSubmit={onSubmit} className="group relative w-full">
      {/* Glow ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-b from-foreground/15 via-foreground/5 to-transparent opacity-60 blur-[2px] transition-opacity duration-500 group-focus-within:opacity-100"
      />

      <div
        className={cn(
          "relative flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 p-1.5 pl-3 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md transition-colors",
          "focus-within:border-foreground/30",
        )}
      >
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />

        <input
          ref={inputRef}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Drop a link to contribute to the ecosystem — ${SUGGESTIONS[placeholderIndex]}`}
          aria-label="Drop a link to contribute to the Australian startup ecosystem"
          className="h-10 w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
        />

        <kbd className="hidden h-6 select-none items-center gap-1 rounded-md border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-[11px] leading-none">⌘</span>K
        </kbd>

        <button
          type="submit"
          disabled={status === "loading" || !value.trim()}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-xs font-medium text-background transition-all",
            "hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Submitting
            </>
          ) : status === "success" ? (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Received
            </>
          ) : (
            <>
              Contribute
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className="font-mono uppercase tracking-wider text-muted-foreground/70">Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setValue(s)
              inputRef.current?.focus()
            }}
            className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  )
}
