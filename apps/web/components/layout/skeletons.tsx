import { cn } from "@buildinaus/ui/lib/utils"
import { Panel, PanelHeader } from "@buildinaus/ui/layouts/panel"

/**
 * Shared loading skeletons. Used by both `<Suspense fallback>` and the
 * route-level `loading.tsx` files so what appears during navigation
 * matches what appears during a cache miss.
 */

function Pulse({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted/40", className)}
    />
  )
}

export function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean } = {}) {
  return (
    <header className="flex flex-col items-start justify-between gap-6 border-b border-border/60 pb-10 md:flex-row md:items-end">
      <div className="max-w-2xl space-y-3">
        <Pulse className="h-5 w-24" />
        <Pulse className="h-9 w-72 md:h-10 md:w-96" />
        <Pulse className="h-4 w-64" />
      </div>
      {withAction && <Pulse className="h-9 w-32" />}
    </header>
  )
}

export function CardGridSkeleton({
  count = 6,
  cols = 3,
}: {
  count?: number
  cols?: 2 | 3
}) {
  const colClass =
    cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
  return (
    <div className={cn("mt-10 grid gap-3", colClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <Panel key={i} className="p-6">
          <div className="flex items-center gap-3">
            <Pulse className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-4 w-32" />
              <Pulse className="h-3 w-20" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-4/5" />
            <Pulse className="h-3 w-3/5" />
          </div>
          <div className="mt-6 flex justify-between border-t border-border/60 pt-4">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3 w-12" />
          </div>
        </Panel>
      ))}
    </div>
  )
}

export function ListRowsSkeleton({
  count = 5,
  label,
  withMeta = true,
}: {
  count?: number
  label?: string
  withMeta?: boolean
}) {
  return (
    <Panel className="mt-8">
      {label && <PanelHeader label={<Pulse className="h-3 w-24" />} />}
      <ul className="divide-y divide-border/60">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Pulse className="h-4 w-48" />
              {withMeta && (
                <div className="flex gap-3">
                  <Pulse className="h-3 w-24" />
                  <Pulse className="h-3 w-16" />
                </div>
              )}
            </div>
            <Pulse className="hidden h-3 w-28 sm:block" />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function DetailHeaderSkeleton() {
  return (
    <>
      <Pulse className="h-3 w-24" />
      <header className="mt-6 flex flex-col items-start justify-between gap-6 border-b border-border/60 pb-10 md:flex-row md:items-end">
        <div className="flex items-center gap-4">
          <Pulse className="h-14 w-14 rounded-xl" />
          <div className="space-y-3">
            <Pulse className="h-9 w-64 md:h-10 md:w-72" />
            <Pulse className="h-4 w-80" />
            <div className="flex gap-3">
              <Pulse className="h-3 w-16" />
              <Pulse className="h-3 w-24" />
              <Pulse className="h-3 w-20" />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export function ProfilePanelSkeleton() {
  return (
    <Panel>
      <PanelHeader label="Public profile" />
      <div className="flex items-start gap-4 p-6">
        <Pulse className="h-14 w-14 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Pulse className="h-4 w-40" />
          <Pulse className="h-3 w-28" />
          <Pulse className="h-3 w-3/4" />
          <Pulse className="h-3 w-2/5" />
        </div>
      </div>
    </Panel>
  )
}

export function AccountPanelSkeleton() {
  return (
    <Panel>
      <PanelHeader label="Account" />
      <div className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Pulse className="h-3 w-12" />
          <Pulse className="h-4 w-44" />
        </div>
        <div className="space-y-1.5">
          <Pulse className="h-3 w-14" />
          <Pulse className="h-4 w-28" />
        </div>
      </div>
    </Panel>
  )
}

export function InlineTextSkeleton({ className }: { className?: string }) {
  return (
    <Pulse
      className={cn("inline-block align-baseline h-[0.9em] w-24", className)}
    />
  )
}

export function DetailBodySkeleton() {
  return (
    <div className="mt-10 grid gap-3 lg:grid-cols-6">
      <Panel className="p-6 lg:col-span-4">
        <div className="space-y-3">
          <Pulse className="h-3 w-full" />
          <Pulse className="h-3 w-11/12" />
          <Pulse className="h-3 w-4/5" />
          <Pulse className="h-3 w-3/5" />
        </div>
      </Panel>
      <Panel className="p-6 lg:col-span-2">
        <Pulse className="h-3 w-20" />
        <Pulse className="mt-3 h-9 w-32" />
      </Panel>
    </div>
  )
}
