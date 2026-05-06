"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function EventError({
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
        title="This event couldn't load"
        description="We hit an error fetching the event. Try again or browse the calendar."
        backHref="/events"
        backLabel="All events"
      />
    </PageShell>
  )
}
