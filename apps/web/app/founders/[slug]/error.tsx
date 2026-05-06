"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function FounderError({
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
        title="This founder profile couldn't load"
        description="The profile or its company joins failed to fetch. Try again or browse the index."
        backHref="/founders"
        backLabel="All founders"
      />
    </PageShell>
  )
}
