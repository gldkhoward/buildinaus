"use client"

import { ErrorCard } from "@/components/system/error-card"
import "./globals.css"

/**
 * global-error.tsx replaces the entire <html> document when the root
 * layout itself throws. Keep dependencies on shared providers minimal —
 * this needs to render even when ThemeProvider, headers, or fonts have
 * blown up.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-svh items-center justify-center px-4 py-12">
          <ErrorCard
            error={error}
            reset={reset}
            title="BuildinAus crashed"
            description="The shell itself failed to load. Try again, or come back in a minute."
          />
        </main>
      </body>
    </html>
  )
}
