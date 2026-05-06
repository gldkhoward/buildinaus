"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, X } from "lucide-react"
import { promotePayload, rejectPayload } from "./actions"

interface QueueRowProps {
  payloadId: number
}

export function QueueRow({ payloadId }: QueueRowProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [busy, setBusy] = React.useState<"promote" | "reject" | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  function run(action: "promote" | "reject") {
    setError(null)
    setBusy(action)
    startTransition(async () => {
      try {
        const res =
          action === "promote"
            ? await promotePayload(payloadId)
            : await rejectPayload(payloadId)
        if (action === "promote" && res.ok) {
          router.push(res.redirectUrl)
          return
        }
        if (!res.ok && res.error !== "rejected") {
          setError(res.error)
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed")
      } finally {
        setBusy(null)
      }
    })
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("reject")}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border/80 bg-card/60 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
        >
          {busy === "reject" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
          Reject
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("promote")}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-foreground px-2.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {busy === "promote" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Promote
        </button>
      </div>
      {error && (
        <span className="font-mono text-[10px] text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
