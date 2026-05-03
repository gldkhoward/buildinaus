export { scrapeLinkedInProfile } from "./linkedin"
export { scrapeEvents } from "./events"

export interface ScrapedPage {
  url: string
  fetchedAt: Date
  status: number
  html: string
}
