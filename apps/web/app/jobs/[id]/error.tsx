"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function JobError({
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
        title="This role couldn't load"
        description="We hit an error fetching the listing. Try again or browse all open roles."
        backHref="/jobs"
        backLabel="All jobs"
      />
    </PageShell>
  )
}
