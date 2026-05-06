"use client"

import { ErrorCard } from "@/components/system/error-card"

export default function ScraperError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <ErrorCard
        error={error}
        reset={reset}
        title="The scraper agent failed"
        description="The presenter or one of the upstream tool calls threw. Try a different URL or come back in a moment."
        backHref="/"
      />
    </main>
  )
}
