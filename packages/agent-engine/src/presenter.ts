import type {
  CleanedPayload,
  Event,
  FounderProfile,
  StartupProfile,
} from "./schemas"

/**
 * Pure mapping layer between cleaned payloads and dashboard-blocks.
 *
 * We don't import React components here so this module stays usable from
 * server actions, route handlers, or Vercel Workflows. The web app imports
 * the matching component by name from `@buildinaus/dashboard-blocks`.
 */

export type PresenterBlock =
  | { component: "EventCard"; props: Event }
  | { component: "StartupBento"; props: StartupProfile }
  | { component: "FounderCard"; props: FounderProfile }

export function present(payload: CleanedPayload): PresenterBlock {
  switch (payload.type) {
    case "event":
      return { component: "EventCard", props: payload.data }
    case "startup":
      return { component: "StartupBento", props: payload.data }
    case "founder":
      return { component: "FounderCard", props: payload.data }
  }
}

export function presentMany(payloads: CleanedPayload[]): PresenterBlock[] {
  return payloads.map(present)
}
