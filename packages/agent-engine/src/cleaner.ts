import { generateText, Output } from "ai"
import { pickModel } from "./gateway"
import {
  CleanedPayloadSchema,
  EventSchema,
  FounderProfileSchema,
  StartupProfileSchema,
  type CleanedPayload,
  type Event,
  type FounderProfile,
  type StartupProfile,
} from "./schemas"

const CLEAN_SYSTEM = [
  "You are the Sanitizer stage of a scraping pipeline.",
  "Analyze the raw markdown / prose you are given and:",
  "- Remove all navigational links, footers, cookie banners, and ads.",
  "- If the page is an event, return type='event' with { title, date (ISO 8601), location, tags }.",
  "  Express the start time in AEST/AEDT (Australia/Sydney) when the time zone is ambiguous.",
  "- If it is a startup / company, return type='startup' with",
  "  { name, hq_location, primary_problem, description, industry, founders, links }.",
  "- If it is a person / founder bio, return type='founder' with",
  "  { name, headline, city, bio, current_company, links }.",
  "- Only return facts present in the input. Never invent data.",
].join("\n")

interface CleanInput {
  url: string
  markdown: string
  hint?: "event" | "startup" | "founder"
}

/**
 * Sanitize raw markdown into a typed payload. The discriminated union lets
 * the presenter decide which dashboard block to render without re-parsing.
 */
export async function clean(input: CleanInput): Promise<CleanedPayload> {
  const { output } = await generateText({
    model: pickModel("reasoning"),
    output: Output.object({ schema: CleanedPayloadSchema }),
    system: CLEAN_SYSTEM,
    prompt:
      `Source URL: ${input.url}\n` +
      (input.hint ? `Hint: this page looks like a ${input.hint}.\n` : "") +
      `\nMarkdown:\n${input.markdown.slice(0, 16_000)}`,
  })
  return output
}

/** Convenience wrappers for callers that already know the shape they want. */
export async function cleanAsEvent(input: CleanInput): Promise<Event> {
  const { output } = await generateText({
    model: pickModel("reasoning"),
    output: Output.object({ schema: EventSchema }),
    system: CLEAN_SYSTEM,
    prompt: `Source URL: ${input.url}\n\nMarkdown:\n${input.markdown.slice(0, 16_000)}`,
  })
  return output
}

export async function cleanAsStartup(input: CleanInput): Promise<StartupProfile> {
  const { output } = await generateText({
    model: pickModel("reasoning"),
    output: Output.object({ schema: StartupProfileSchema }),
    system: CLEAN_SYSTEM,
    prompt: `Source URL: ${input.url}\n\nMarkdown:\n${input.markdown.slice(0, 16_000)}`,
  })
  return output
}

export async function cleanAsFounder(input: CleanInput): Promise<FounderProfile> {
  const { output } = await generateText({
    model: pickModel("reasoning"),
    output: Output.object({ schema: FounderProfileSchema }),
    system: CLEAN_SYSTEM,
    prompt: `Source URL: ${input.url}\n\nMarkdown:\n${input.markdown.slice(0, 16_000)}`,
  })
  return output
}
