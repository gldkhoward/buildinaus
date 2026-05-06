/**
 * cleaned_payloads renders five different shapes through the same admin
 * queue. This collapses each kind into a `{ title, subtitle, badges }`
 * tuple so the UI doesn't need to know the agent's payload schema.
 */

export interface PayloadSummary {
  title: string
  subtitle?: string
  badges: string[]
}

type PayloadKind =
  | "company"
  | "founder"
  | "event"
  | "atlas_section"
  | "atlas_entry"

export function summarisePayload(
  kind: PayloadKind,
  payload: Record<string, unknown>,
  fallback: { sourceUrl: string | null; id: number },
): PayloadSummary {
  switch (kind) {
    case "company":
      return {
        title: str(payload.name) ?? defaultTitle(fallback),
        subtitle:
          str(payload.primary_problem) ??
          str(payload.description)?.slice(0, 140),
        badges: filterEmpty([
          str(payload.hq_location),
          ...arrStr(payload.industry).slice(0, 3),
        ]),
      }

    case "founder":
      return {
        title: str(payload.name) ?? defaultTitle(fallback),
        subtitle:
          str(payload.headline) ??
          str(payload.bio)?.slice(0, 140) ??
          str(payload.current_company),
        badges: filterEmpty([str(payload.city), str(payload.current_company)]),
      }

    case "event":
      return {
        title: str(payload.title) ?? defaultTitle(fallback),
        subtitle: filterEmpty([
          str(payload.date),
          str(payload.location),
        ]).join(" · "),
        badges: filterEmpty([
          str(payload.source),
          ...arrStr(payload.tags).slice(0, 3),
        ]),
      }

    case "atlas_section": {
      const cityCap = capitalise(str(payload.city_slug))
      return {
        title: str(payload.title) ?? defaultTitle(fallback),
        subtitle: str(payload.summary)?.slice(0, 160),
        badges: filterEmpty([
          cityCap,
          str(payload.kind),
          str(payload.slug) ? `#${str(payload.slug)}` : null,
        ]),
      }
    }

    case "atlas_entry": {
      const cityCap = capitalise(str(payload.city_slug))
      const sectionSlug = str(payload.section_slug)
      return {
        title: str(payload.name) ?? defaultTitle(fallback),
        subtitle: str(payload.tagline) ?? str(payload.href),
        badges: filterEmpty([
          cityCap,
          sectionSlug ? `→ ${sectionSlug}` : null,
          str(payload.linked_kind),
        ]),
      }
    }

    default: {
      const _exhaustive: never = kind
      void _exhaustive
      return { title: defaultTitle(fallback), badges: [] }
    }
  }
}

function defaultTitle(fallback: { sourceUrl: string | null; id: number }): string {
  return fallback.sourceUrl ?? `payload ${fallback.id}`
}

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const t = v.trim()
  return t.length === 0 ? undefined : t
}

function arrStr(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string" && x.length > 0)
}

function filterEmpty(items: (string | null | undefined)[]): string[] {
  return items.filter((x): x is string => typeof x === "string" && x.length > 0)
}

function capitalise(v: string | undefined): string | undefined {
  if (!v) return undefined
  return v.charAt(0).toUpperCase() + v.slice(1)
}
