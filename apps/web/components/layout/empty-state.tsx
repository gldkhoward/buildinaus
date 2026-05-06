import * as React from "react"
import { ArrowRight } from "lucide-react"
import { CommandBarTrigger } from "@/components/intake/command-bar-trigger"

interface EmptyListStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  /** Optional command-bar prefill for the primary action. */
  prefill?: string
  /** Label for the primary action button. */
  actionLabel?: string
}

/**
 * Friendly placeholder for list pages that resolve to zero rows. Encourages
 * the user to seed the index via the intake command bar — the same surface
 * the rest of the app uses to add new entries.
 */
export function EmptyListState({
  icon,
  title,
  description,
  prefill,
  actionLabel = "Open the intake bar",
}: EmptyListStateProps) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="max-w-md space-y-2">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <CommandBarTrigger
        prefill={prefill ?? "Add an entry — paste a link or describe it"}
        className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </CommandBarTrigger>
    </div>
  )
}
