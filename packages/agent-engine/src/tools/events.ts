import { tool } from "ai"
import { z } from "zod"
import { fetchEventbriteEvent, fetchLumaEvent } from "../fetchers/events"

export const lumaTool = tool({
  description:
    "Pull event metadata from a Luma (lu.ma) event URL and return it in the " +
    "unified Event schema { title, date, location, tags, ... }.",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe("Full Luma event URL, e.g. https://lu.ma/abcd1234"),
  }),
  execute: async ({ url }) => fetchLumaEvent(url),
})

export const eventbriteTool = tool({
  description:
    "Pull event metadata from an Eventbrite event URL and return it in the " +
    "unified Event schema { title, date, location, tags, ... }. Captures the " +
    "ticket price and Startup-category tags when present.",
  inputSchema: z.object({
    url: z.string().url().describe("Full Eventbrite event URL."),
  }),
  execute: async ({ url }) => fetchEventbriteEvent(url),
})
