import * as React from "react"
import { Suspense } from "react"
import { cn } from "@buildinaus/ui/lib/utils"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"

// Panel + PanelHeader live in @buildinaus/ui — re-exported here so app pages
// have a single import for layout primitives.
export { Panel, PanelHeader } from "@buildinaus/ui/layouts/panel"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      {/*
        SiteHeader and the nav inside read `usePathname()`. Under
        Cache Components, that's uncached client data and needs to live
        inside its own Suspense boundary so dynamic pages don't fail to
        prerender. The fallback keeps the header height stable so the
        page doesn't jump.
      */}
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className={cn("mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16", className)}>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

function HeaderFallback() {
  return (
    <div
      aria-hidden
      className="sticky top-0 z-40 h-14 border-b border-border/60 bg-background/70 backdrop-blur-xl"
    />
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <header className="flex flex-col items-start justify-between gap-6 border-b border-border/60 pb-10 md:flex-row md:items-end">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="text-balance text-3xl font-medium tracking-tight md:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
