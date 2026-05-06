"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { claimFounder } from "./actions"

interface ClaimFormProps {
  slug: string
}

const ERR_LABEL: Record<string, string> = {
  not_found: "We couldn't find that founder profile.",
  already_claimed: "You already own this profile.",
  owned_by_other: "Another account already claimed this profile.",
}

export function ClaimForm({ slug }: ClaimFormProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)

  function handleClaim() {
    setError(null)
    startTransition(async () => {
      const res = await claimFounder(slug)
      if (res.ok) {
        setDone(true)
        // Small delay so the success state is visible before nav.
        setTimeout(() => router.push(`/founders/${slug}`), 600)
      } else {
        setError(ERR_LABEL[res.error] ?? "Could not claim profile.")
      }
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-foreground">
        <CheckCircle2 className="h-4 w-4 text-foreground/80" />
        Linked. Redirecting…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClaim}
        disabled={pending}
        className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Linking…
          </>
        ) : (
          "Link this profile to my account"
        )}
      </button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
