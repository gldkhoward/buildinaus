/**
 * Static atlas city metadata + timezone-based detection.
 *
 * Pulled out of the legacy `lib/atlas.ts` blob so client components (the
 * city switcher) don't need to bundle the editorial dump. Both the data
 * layer (`lib/data/atlas.ts`) and the client component import from here.
 */

export type AtlasCitySlug = "sydney" | "melbourne" | "brisbane"

export interface AtlasCityChip {
  slug: AtlasCitySlug
  city: string
  state: string
  status: "live" | "scaffolded"
}

export const ATLAS_CITIES: AtlasCityChip[] = [
  { slug: "sydney", city: "Sydney", state: "NSW", status: "live" },
  { slug: "melbourne", city: "Melbourne", state: "VIC", status: "scaffolded" },
  { slug: "brisbane", city: "Brisbane", state: "QLD", status: "scaffolded" },
]

const TZ_TO_CITY: Record<string, AtlasCitySlug> = {
  "Australia/Sydney": "sydney",
  "Australia/Melbourne": "melbourne",
  "Australia/Hobart": "melbourne",
  "Australia/Adelaide": "melbourne",
  "Australia/Brisbane": "brisbane",
}

/**
 * Best-effort city detection from the browser's IANA timezone.
 * Returns `undefined` when run on the server or when the timezone doesn't
 * map — the caller decides the fallback.
 */
export function detectCityFromTimezone(): AtlasCitySlug | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return TZ_TO_CITY[tz]
  } catch {
    return undefined
  }
}
