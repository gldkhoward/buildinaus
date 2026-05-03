import type { ScrapedPage } from "."

export interface LinkedInProfile {
  url: string
  name: string
  headline?: string
  location?: string
  experience: Array<{ company: string; title: string; from?: string; to?: string }>
}

// TODO: wire up Playwright / Firecrawl. For the demo, this returns a stub so
// the rest of the pipeline (parser → trust scoring → block selection) can be
// exercised end-to-end without a real browser session.
export async function scrapeLinkedInProfile(_url: string): Promise<ScrapedPage> {
  throw new Error("scrapeLinkedInProfile: not yet implemented")
}
