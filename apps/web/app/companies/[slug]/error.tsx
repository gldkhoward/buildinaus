"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function CompanyError({
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
        title="This company couldn't load"
        description="One of the joins (founders or jobs) failed. Try again or browse the index."
        backHref="/companies"
        backLabel="All companies"
      />
    </PageShell>
  )
}
