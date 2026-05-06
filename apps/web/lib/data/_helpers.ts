import type { City, CitySlug } from "@buildinaus/types"

const CITY_DISPLAY: Record<string, City> = {
  sydney: "Sydney",
  melbourne: "Melbourne",
  brisbane: "Brisbane",
  perth: "Perth",
  adelaide: "Adelaide",
  canberra: "Canberra",
  remote: "Remote AU",
}

export function citySlugToDisplay(slug: string | null | undefined): City {
  if (!slug) return "Sydney"
  return CITY_DISPLAY[slug] ?? "Sydney"
}

export type _CitySlug = CitySlug

export function postedAtRelative(postedAt: Date): string {
  const ms = Date.now() - postedAt.getTime()
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  if (days < 1) return "today"
  if (days === 1) return "1 day ago"
  if (days < 7) return `${days} days ago`
  if (days < 14) return "1 week ago"
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

const AEST_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const AEST_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function eventStartLabel(startsAt: Date): string {
  // AEST/AEDT is UTC+10/+11. We render the local time the event starts.
  const local = new Date(startsAt.getTime() + 10 * 60 * 60 * 1000)
  const day = AEST_DAYS[local.getUTCDay()]
  const dateNum = local.getUTCDate()
  const month = AEST_MONTHS[local.getUTCMonth()]
  let hour = local.getUTCHours()
  const minute = local.getUTCMinutes()
  const period = hour >= 12 ? "pm" : "am"
  hour = hour % 12 || 12
  const minuteStr = minute === 0 ? "" : `:${minute.toString().padStart(2, "0")}`
  return `${day} ${dateNum} ${month} · ${hour}${minuteStr}${period}`
}
