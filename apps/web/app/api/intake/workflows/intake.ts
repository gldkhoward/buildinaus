import { DurableAgent } from "@workflow/ai/agent"
import { getWritable } from "workflow"
import { convertToModelMessages, type UIMessage, type UIMessageChunk } from "ai"
import {
  appendMessages,
  buildIntakeTools,
  failRun,
  SCRAPER_MODELS,
  type IntakeRunContext,
} from "@buildinaus/agent-engine"
import { getOrSet, cacheKeys, cacheTags } from "@/lib/runtime-cache"
import { putHtmlSnapshot } from "@/lib/blob"

const INTAKE_INSTRUCTIONS = [
  "You are the BuildinAus intake agent. The user just pasted SOMETHING into the",
  "command bar — it might be a URL, a paragraph about a startup, a founder bio,",
  "an event description, or a search query.",
  "",
  "WORKFLOW (in this exact order):",
  "  1. Call `plan` FIRST. Decide the intent and lay out an ordered list of",
  "     steps so the UI can render a 'thinking view' before any work runs.",
  "  2. Execute the plan, one tool call at a time, in the order you declared.",
  "     - For URLs, prefer `scout` first; escalate to `deepDive` for entity",
  "       profiles. Use `luma` / `eventbrite` for those specific hosts.",
  "     - When the user pasted prose, skip scraping and go straight to `clean`.",
  "  3. Call `clean` to turn the gathered markdown into a typed payload",
  "     (`startup` | `founder` | `event`).",
  "  4. Call `finalize` LAST with a markdown summary, the outcome, and a",
  "     redirect URL when one applies. Then stop.",
  "",
  "Style:",
  "- Plans should have between 2 and 5 steps. Don't over-engineer.",
  "- Never invent data. If the input is too vague, plan a single 'search' step",
  "  via `scout` of a likely URL, or finalize with outcome='noop' and ask the",
  "  user for more detail in the summary.",
  "- After `finalize`, write a short, structured markdown reply (1–2 sentences",
  "  + bullet list of what was captured + the redirect link).",
  "- All times in AEST/AEDT (Australia/Sydney) when the time zone is ambiguous.",
].join("\n")

/**
 * Durable intake workflow. Each tool call is automatically a workflow step
 * (durable + retryable + traced in the WDK dashboard) thanks to DurableAgent.
 * Streams UIMessageChunks to the run's default stream, which the route
 * handler pipes back to `useChat` on the client.
 *
 * Tools are built per-run via `buildIntakeTools(ctx)` so they can persist
 * `scrape_provenance` / `cleaned_payloads` against the right run id, and
 * route reads through Vercel Runtime Cache (scout) and writes raw HTML
 * to Vercel Blob.
 */
export async function intakeWorkflow(
  uiMessages: UIMessage[],
  ctx: IntakeRunContext,
) {
  "use workflow"

  const tools = buildIntakeTools({
    runId: ctx.runId,
    host: {
      // Read-through Vercel Runtime Cache for scout. Tagged so a moderator
      // can purge by domain ("force re-scrape acme.com").
      scoutCache: async (url, producer) => {
        const urlHash = await sha256(url)
        const host = safeHost(url)
        const tags = host
          ? [cacheTags.scrapeUrl(urlHash), cacheTags.scrapeDomain(host)]
          : [cacheTags.scrapeUrl(urlHash)]
        return getOrSet(cacheKeys.scrape(urlHash), producer, {
          ttl: 3600, // 1h — see TTL ladder in docs/database-schema.md §7.2
          tags,
        })
      },
      // Forensic raw-HTML upload to Vercel Blob, content-addressed.
      uploadHtmlSnapshot: async (contentHash, html) => {
        const result = await putHtmlSnapshot(contentHash, html)
        return { url: result.url, pathname: result.pathname }
      },
    },
  })

  const agent = new DurableAgent({
    model: SCRAPER_MODELS.primary,
    system: INTAKE_INSTRUCTIONS,
    tools,
  })

  try {
    const result = await agent.stream({
      messages: await convertToModelMessages(uiMessages),
      writable: getWritable<UIMessageChunk>(),
      maxSteps: 16,
    })

    // Persist assistant transcript at the end of the run. The route already
    // wrote the user-side messages before it called start().
    const assistantMessages = result.messages.filter(
      (m) => m.role === "assistant",
    )
    if (assistantMessages.length > 0) {
      await appendMessages(
        ctx.runId,
        assistantMessages.map((m) => ({
          role: "assistant" as const,
          parts: (m as { parts?: unknown }).parts ?? m,
        })),
      )
    }

    return result.messages
  } catch (err) {
    await failRun(
      ctx.runId,
      err instanceof Error ? err.message : String(err),
    )
    throw err
  }
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest("SHA-256", buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}
