"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, RotateCw } from "lucide-react"

interface ErrorCardProps {
  /** What went wrong, in user-friendly terms. */
  title?: string
  description?: string
  /** Next.js error.tsx receives this — used to surface the digest. */
  error?: Error & { digest?: string }
  /** Next.js error.tsx provides this. */
  reset?: () => void
  /** Optional href for a secondary "back" link. Defaults to "/". */
  backHref?: string
  backLabel?: string
}

/**
 * Reusable branded error card. Used by every error.tsx (root + per-route).
 * Keeps wording consistent and isolates the styling so route-level files
 * stay one-liners.
 */
export function ErrorCard({
  title = "Something went wrong",
  description = "We hit an error rendering this page. The rest of BuildinAus is still up — try again, or head back.",
  error,
  reset,
  backHref = "/",
  backLabel = "Back to home",
}: ErrorCardProps) {
  React.useEffect(() => {
    if (error) {
      // Send to console so Vercel runtime logs catch it. Production also
      // forwards through @vercel/analytics if it's wired.
      console.error("[error-boundary]", error)
    }
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 rounded-xl border border-border/80 bg-card/60 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <h1 className="text-base font-medium tracking-tight">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {error?.digest && (
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
            ref · {error.digest}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {reset && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
        <Link
          href={backHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/80 bg-card/60 px-4 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
