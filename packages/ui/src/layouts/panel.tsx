import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Panel — the BuildinAus "bento" surface.
 *
 * Distinct from `@buildinaus/ui/atoms/card` (the shadcn Card) on purpose:
 * Panel is the frosted, lightly-elevated container we use across landing,
 * detail pages, and dashboard blocks. Use shadcn `Card` for plain content
 * cards (forms, dialogs); use `Panel` for editorial surfaces with the brand
 * blur + bg-card/60 treatment.
 */
export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card/60 backdrop-blur transition-colors",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export interface PanelHeaderProps {
  icon?: React.ReactNode
  label: React.ReactNode
  accessory?: React.ReactNode
  className?: string
}

export function PanelHeader({ icon, label, accessory, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/60 px-6 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {icon && <span className="text-foreground/70">{icon}</span>}
        {label}
      </div>
      {accessory}
    </div>
  )
}
