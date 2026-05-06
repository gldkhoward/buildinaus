"use client"

import { ErrorCard } from "@/components/system/error-card"

export default function IntakeError({
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
        title="The intake agent stalled"
        description="A step in the workflow failed before it could finish. Reset to start a fresh run."
        backHref="/"
      />
    </main>
  )
}
