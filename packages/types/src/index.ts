export type UserRole =
  | "founder"
  | "operator"
  | "investor"
  | "engineer"
  | "researcher"
  | "student"

export type City =
  | "sydney"
  | "melbourne"
  | "brisbane"
  | "perth"
  | "adelaide"
  | "canberra"
  | "remote"

export interface User {
  id: string
  slug: string
  name: string
  email: string
  role: UserRole
  city: City
  headline?: string
  linkedinUrl?: string
  createdAt: Date
}

export interface Startup {
  id: string
  slug: string
  name: string
  domain: string
  description: string
  city: City
  industry: string[]
  founderIds: string[]
  trustScore: number
  domainAgeDays: number
  createdAt: Date
}

export type BlockId =
  | "vc-map"
  | "jobs-board"
  | "events-feed"
  | "robotics-labs"
  | "blackbird-grants"
  | "founder-leaderboard"

export interface BlockDefinition {
  id: BlockId
  title: string
  description: string
  defaultProps?: Record<string, unknown>
}

export interface CuratedConfig {
  id: string
  userId: string
  blocks: BlockId[]
  layout: "grid" | "feed" | "kanban"
  updatedAt: Date
}
