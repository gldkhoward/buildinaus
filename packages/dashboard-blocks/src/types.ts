/**
 * Display-side types used by the dashboard-blocks components. These mirror
 * the agent-engine `Event` and `StartupProfile` schemas but are defined
 * locally so this package has no runtime dependency on the agent-engine.
 */

export interface EventCardData {
  title: string
  date: string
  location: string
  tags: string[]
  source: "lu.ma" | "eventbrite" | "meetup" | "other"
  url: string
  ticket_price?: string
  rsvp_count?: number
  description?: string
}

export interface StartupBentoData {
  name: string
  hq_location?: string
  primary_problem?: string
  description?: string
  industry: string[]
  founders: string[]
  links: {
    website?: string
    linkedin?: string
    twitter?: string
  }
}

export interface FounderCardData {
  name: string
  headline?: string
  city?: string
  bio?: string
  current_company?: string
  links: {
    website?: string
    linkedin?: string
    twitter?: string
  }
}
