"use client"

import * as React from "react"
import Link from "next/link"
import { Compass, MapPin } from "lucide-react"
import { cn } from "@buildinaus/ui/lib/utils"
import {
  ATLAS_CITIES,
  detectCityFromTimezone,
  type AtlasCitySlug,
} from "@/lib/atlas-cities"

interface AtlasCitySwitcherProps {
  active?: AtlasCitySlug
  className?: string
}

export function AtlasCitySwitcher({ active, className }: AtlasCitySwitcherProps) {
  const [detected, setDetected] = React.useState<AtlasCitySlug | undefined>()

  React.useEffect(() => {
    setDetected(detectCityFromTimezone())
  }, [])

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-card/60 p-1.5 backdrop-blur",
        className,
      )}
      role="tablist"
      aria-label="Atlas city"
    >
      <span className="px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <Compass className="mr-1 inline h-3 w-3" />
        Atlas
      </span>
      {ATLAS_CITIES.map((c) => {
        const isActive = active === c.slug
        const isDetected = detected === c.slug
        return (
          <Link
            key={c.slug}
            role="tab"
            aria-selected={isActive}
            href={`/atlas/${c.slug}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MapPin className="h-3 w-3" />
            {c.city}
            {isDetected && !isActive && (
              <span className="ml-1 rounded-sm border border-border/60 bg-muted/40 px-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
                You
              </span>
            )}
            {c.status === "scaffolded" && (
              <span className="ml-1 rounded-sm border border-border/60 bg-muted/30 px-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                WIP
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

/**
 * Client banner used on the /atlas index — once the timezone resolves, suggest
 * the user jump straight into their detected city.
 */
export function AtlasAutoDetectBanner() {
  const [detected, setDetected] = React.useState<AtlasCitySlug | undefined>()
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    setDetected(detectCityFromTimezone())
  }, [])

  if (!detected || dismissed) return null
  const city = ATLAS_CITIES.find((c) => c.slug === detected)
  if (!city) return null

  return (
    <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-border/80 bg-card/60 p-4 backdrop-blur sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-muted/40">
          <MapPin className="h-3.5 w-3.5" />
        </span>
        Looks like you're in {city.city}. Open the {city.city} Atlas?
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Dismiss
        </button>
        <Link
          href={`/atlas/${city.slug}`}
          className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
        >
          Open {city.city} Atlas
        </Link>
      </div>
    </div>
  )
}
