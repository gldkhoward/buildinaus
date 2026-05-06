"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function AdminError({
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
        title="Admin page failed"
        description="The admin surface threw an error. The intake pipeline still runs — try again or check the runtime logs."
        backHref="/admin/queue"
        backLabel="Back to queue"
      />
    </PageShell>
  )
}
