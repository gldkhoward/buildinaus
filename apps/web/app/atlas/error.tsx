"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ErrorCard } from "@/components/system/error-card"

export default function AtlasError({
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
        title="Atlas couldn't load"
        description="We hit an error pulling this atlas. Try again, or browse the rest of BuildinAus."
        backHref="/atlas"
        backLabel="All atlases"
      />
    </PageShell>
  )
}
