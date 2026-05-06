"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <PageShell className="flex min-h-[60vh] items-center justify-center">
      <ErrorCard
        error={error}
        reset={reset}
        title="Jobs couldn't load"
        description="We couldn't pull the job index. Try again in a moment."
        backHref="/"
      />
    </PageShell>
  )
}
