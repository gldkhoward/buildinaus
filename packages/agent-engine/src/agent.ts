import { InferAgentUIMessage, ToolLoopAgent, stepCountIs } from "ai"
import { pickModel } from "./gateway"
import { scraperTools } from "./tools"
import { clean } from "./cleaner"
import { present, type PresenterBlock } from "./presenter"
import type { CleanedPayload } from "./schemas"

const SCRAPER_INSTRUCTIONS = [
  "You are the BuildinAus scraping agent — a Planner-Executor that turns a URL or",
  "query into structured Australian-startup-ecosystem content.",
  "",
  "Tool selection:",
  "- For a generic website URL, call `scout` first.",
  "- If the user asks about a company / startup / lab, follow up with `deepDive`.",
  "- For lu.ma URLs, call `luma`.",
  "- For eventbrite.* URLs, call `eventbrite`.",
  "",
  "Style:",
  "- Prefer Markdown over HTML; never speculate beyond what the tools returned.",
  "- When you have what you need, stop calling tools and answer with a short summary.",
  "- Times in AEST/AEDT (Australia/Sydney) when the time zone is ambiguous.",
].join("\n")

export const scraperAgent = new ToolLoopAgent({
  model: pickModel("primary"),
  instructions: SCRAPER_INSTRUCTIONS,
  tools: scraperTools,
  stopWhen: stepCountIs(12),
})

export type ScraperAgentUIMessage = InferAgentUIMessage<typeof scraperAgent>

interface ScrapeAndPresentInput {
  url: string
  hint?: "event" | "startup"
}

interface ScrapeAndPresentResult {
  payload: CleanedPayload
  block: PresenterBlock
  trace: { toolName: string; args: unknown }[]
}

/**
 * One-shot helper that drives the full Fetch → Clean → Present pipeline for a
 * single URL. Useful for server actions and Workflows steps where you don't
 * want a chat-style streaming UI.
 */
export async function scrapeAndPresent(
  input: ScrapeAndPresentInput,
): Promise<ScrapeAndPresentResult> {
  const trace: ScrapeAndPresentResult["trace"] = []

  const result = await scraperAgent.generate({
    prompt:
      `Scrape this URL and gather everything useful you can find:\n${input.url}\n\n` +
      (input.hint ? `Hint: this looks like a ${input.hint}.` : ""),
    onStepFinish: async ({ toolCalls }) => {
      for (const call of toolCalls ?? []) {
        trace.push({ toolName: call.toolName, args: call.input })
      }
    },
  })

  // Take whichever markdown body the tools surfaced and run it through the
  // sanitizer to get a typed payload we can render.
  const aggregated = collectMarkdown(result)
  const payload = await clean({
    url: input.url,
    markdown: aggregated || result.text,
    hint: input.hint,
  })

  return {
    payload,
    block: present(payload),
    trace,
  }
}

function collectMarkdown(result: { steps: unknown[] } | unknown): string {
  // The agent surfaces tool results inside `result.steps[i].toolResults`; we
  // glue together any markdown_content / aggregated_markdown fields we find.
  const r = result as {
    steps?: Array<{
      content?: Array<{ type?: string; output?: { value?: unknown } }>
    }>
  }
  const chunks: string[] = []
  for (const step of r.steps ?? []) {
    for (const part of step.content ?? []) {
      if (part?.type !== "tool-result") continue
      const value = (part.output as { value?: Record<string, unknown> } | undefined)?.value
      if (!value || typeof value !== "object") continue
      const v = value as Record<string, unknown>
      if (typeof v.aggregated_markdown === "string") {
        chunks.push(v.aggregated_markdown)
      } else if (typeof v.markdown_content === "string") {
        chunks.push(v.markdown_content)
      }
    }
  }
  return chunks.join("\n\n---\n\n")
}
