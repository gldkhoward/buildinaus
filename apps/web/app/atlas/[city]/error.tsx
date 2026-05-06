"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function AtlasCityError({
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
        title="This atlas couldn't load"
        description="The city page hit an error. Try again, or pick another city."
        backHref="/atlas"
        backLabel="All atlases"
      />
    </PageShell>
  )
}
