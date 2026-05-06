"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function TailoredError({
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
        title="Tailored page couldn't render"
        description="One of the personalised blocks failed. Try again — most generations finish under a second."
        backHref="/founders"
        backLabel="All founders"
      />
    </PageShell>
  )
}
