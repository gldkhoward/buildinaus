"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function FoundersError({
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
        title="Founders couldn't load"
        description="We couldn't pull the founder index. Try again in a moment."
        backHref="/"
      />
    </PageShell>
  )
}
