"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { updateCuratedConfig } from "../actions"

const AVAILABLE_BLOCKS: { id: string; title: string; description: string }[] = [
  {
    id: "vc-map",
    title: "VC map",
    description: "Funds active in your city, with cheque sizes and recent leads.",
  },
  {
    id: "jobs-board",
    title: "Jobs board",
    description: "Roles filtered to your stage and category.",
  },
  {
    id: "events-feed",
    title: "Events feed",
    description: "Founder events, demo days, and salons coming up.",
  },
  {
    id: "robotics-labs",
    title: "Robotics labs",
    description: "University labs, residencies, and grant programs.",
  },
  {
    id: "blackbird-grants",
    title: "Grants and non-dilutive",
    description: "Government and philanthropic capital with no equity ask.",
  },
  {
    id: "founder-leaderboard",
    title: "Founder leaderboard",
    description: "Peers in your category — who's shipping this week.",
  },
]

const LAYOUTS = ["grid", "feed", "kanban"] as const
type Layout = (typeof LAYOUTS)[number]

interface CuratedConfigFormProps {
  initial: {
    blocks: string[]
    layout: Layout
    autoCurated: boolean
  }
}

export function CuratedConfigForm({ initial }: CuratedConfigFormProps) {
  const router = useRouter()
  const [blocks, setBlocks] = React.useState<string[]>(initial.blocks)
  const [layout, setLayout] = React.useState<Layout>(initial.layout)
  const [autoCurated, setAutoCurated] = React.useState(initial.autoCurated)
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  function toggleBlock(id: string) {
    setBlocks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateCuratedConfig({ blocks, layout, autoCurated })
        setSaved(true)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Blocks</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AVAILABLE_BLOCKS.map((b) => {
            const checked = blocks.includes(b.id)
            return (
              <label
                key={b.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border bg-card/40 p-3 text-left transition-colors ${
                  checked
                    ? "border-foreground/40 bg-muted/40"
                    : "border-border/60 hover:border-foreground/20"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-foreground"
                  checked={checked}
                  onChange={() => toggleBlock(b.id)}
                />
                <div>
                  <div className="text-sm font-medium">{b.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.description}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Layout</legend>
        <div className="flex flex-wrap gap-2">
          {LAYOUTS.map((l) => {
            const active = layout === l
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  active
                    ? "border-foreground/40 bg-foreground text-background"
                    : "border-border/60 bg-card/40 text-foreground hover:border-foreground/20"
                }`}
              >
                {l}
              </button>
            )
          })}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-md border border-border/60 bg-card/40 p-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-foreground"
          checked={autoCurated}
          onChange={(e) => setAutoCurated(e.target.checked)}
        />
        <div>
          <div className="text-sm font-medium">Let the agent auto-curate</div>
          <div className="text-xs text-muted-foreground">
            We&apos;ll add new relevant blocks as the index grows. Turn this off
            to lock the selection.
          </div>
        </div>
      </label>

      <div className="flex items-center gap-3 border-t border-border/60 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save curated atlas"
          )}
        </button>
        {saved && (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Saved.
          </span>
        )}
        {error && (
          <span className="text-xs text-red-500" role="alert">
            {error}
          </span>
        )}
      </div>
    </form>
  )
}
