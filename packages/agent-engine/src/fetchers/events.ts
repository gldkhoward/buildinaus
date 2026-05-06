import { generateText, Output } from "ai"
import { z } from "zod"
import { scout } from "./scout"
import { pickModel } from "../gateway"
import { EventSchema, type Event } from "../schemas"

interface ExtractEventOpts {
  source: Event["source"]
  defaultTags?: string[]
}

/**
 * Hits a single event-page URL with the Scout, then asks the model to
 * normalise the messy markdown into our unified Event schema. The result is
 * provider-agnostic — both Luma and Eventbrite tools route through here.
 */
async function extractEventFromUrl(
  url: string,
  { source, defaultTags = [] }: ExtractEventOpts,
): Promise<Event> {
  const page = await scout(url)
  const { output } = await generateText({
    model: pickModel("reasoning"),
    output: Output.object({ schema: EventSchema }),
    system:
      "You are an event-data extractor. Given raw markdown of an event page, " +
      "return the normalised event. Use ISO 8601 for the date. If the time zone " +
      "is ambiguous, assume Australia/Sydney (AEST/AEDT). " +
      "Drop navigation, footers, ads. Only return facts present in the markdown.",
    prompt:
      `Source: ${source}\nURL: ${url}\nDefault tags: ${defaultTags.join(", ") || "(none)"}\n\n` +
      `Markdown:\n${page.markdown_content.slice(0, 12_000)}`,
  })
  return {
    ...output,
    source,
    url,
    tags: Array.from(new Set([...(output.tags ?? []), ...defaultTags])),
  }
}

export async function fetchLumaEvent(url: string): Promise<Event> {
  if (!/lu\.ma|luma\.com/i.test(url)) {
    throw new Error(`fetchLumaEvent: not a Luma URL: ${url}`)
  }
  return extractEventFromUrl(url, { source: "lu.ma" })
}

export async function fetchEventbriteEvent(url: string): Promise<Event> {
  if (!/eventbrite\./i.test(url)) {
    throw new Error(`fetchEventbriteEvent: not an Eventbrite URL: ${url}`)
  }
  return extractEventFromUrl(url, {
    source: "eventbrite",
    defaultTags: ["eventbrite"],
  })
}
