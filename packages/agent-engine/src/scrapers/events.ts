import type { ScrapedPage } from "."

export interface EventListing {
  title: string
  url: string
  city: string
  startsAt: Date
  source: "lu.ma" | "eventbrite" | "meetup" | "other"
}

// TODO: hit lu.ma / Eventbrite / Meetup feeds. Backed by Vercel Workflows for
// scheduled refreshes; outputs are normalised into EventListing[].
export async function scrapeEvents(_city: string): Promise<ScrapedPage[]> {
  throw new Error("scrapeEvents: not yet implemented")
}
