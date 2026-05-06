/**
 * Run-aware intake tool factory.
 *
 * `buildIntakeTools(ctx)` returns the tool registry the workflow hands to
 * `DurableAgent`. Each tool wraps the corresponding underlying fetcher with
 * two side-effects driven by the run context:
 *
 *   1. **Persistence** — every scrape writes a `scrape_provenance` row,
 *      every clean writes a `cleaned_payloads` row, the plan updates
 *      `intake_runs.intent`, finalize closes the run.
 *   2. **Vercel Runtime Cache + Blob** — when host adapters are provided,
 *      scout results are read-through-cached and raw HTML is uploaded to
 *      Blob for forensic replay.
 *
 * The tool **input schemas** match the static tools in `./tools/*` exactly
 * — only the execute side-effects differ — so the model's contract doesn't
 * change.
 */

import { tool } from "ai"
import { z } from "zod"
import { scout } from "./fetchers/scout"
import { deepDive } from "./fetchers/deep-diver"
import { fetchEventbriteEvent, fetchLumaEvent } from "./fetchers/events"
import { clean } from "./cleaner"
import {
  FinalizeSchema,
  PlanSchema,
  type Plan,
  type ScoutOutput,
  type Finalize,
} from "./schemas"
import {
  finalizeRun,
  recordCleanedPayload,
  recordPlan,
  recordScrape,
  recordStep,
} from "./persistence"

/** Optional host adapters — wire these from the web app to light up the
 *  Vercel Runtime Cache + Blob features. Both fall back gracefully so the
 *  package stays runnable in isolation (tests, agent-engine consumers
 *  other than `apps/web`). */
export interface IntakeToolHostAdapters {
  scoutCache?: (
    url: string,
    producer: () => Promise<ScoutOutput>,
  ) => Promise<{ value: ScoutOutput; hit: boolean }>
  uploadHtmlSnapshot?: (
    contentHash: string,
    html: string,
  ) => Promise<{ url: string; pathname: string }>
}

export interface BuildIntakeToolsContext {
  runId: string
  host?: IntakeToolHostAdapters
}

export function buildIntakeTools(ctx: BuildIntakeToolsContext) {
  const { runId, host } = ctx

  /* ── plan ── */

  const planTool = tool({
    description:
      "Declare the workflow you intend to run. ALWAYS call this first, before any other tool. " +
      "Return the user's intent and an ordered list of steps so the UI can show them upfront.",
    inputSchema: PlanSchema,
    execute: async (input): Promise<Plan> => {
      const startedAt = new Date()
      await Promise.all([
        recordPlan(runId, input),
        recordStep(runId, { stepName: "plan", startedAt, finishedAt: new Date() }),
      ])
      return input
    },
  })

  /* ── scout ── */

  const scoutTool = tool({
    description:
      "Scout: fetch a single URL and return clean Markdown plus detected outbound links. " +
      "Use this for any unknown URL the user gives you. Prefer Markdown over HTML.",
    inputSchema: z.object({
      url: z.string().url(),
      depth: z.literal(1).default(1),
    }),
    execute: async ({ url }) => {
      const startedAt = new Date()
      const producer = () => scout(url)
      const { value, hit } = host?.scoutCache
        ? await host.scoutCache(url, producer)
        : { value: await producer(), hit: false }

      let blobInfo: { url?: string; pathname?: string } = {}
      if (!hit && value.raw_html && host?.uploadHtmlSnapshot) {
        try {
          const contentHash = await sha256(value.markdown_content)
          blobInfo = await host.uploadHtmlSnapshot(contentHash, value.raw_html)
        } catch (err) {
          console.warn("[intake-tools] html snapshot upload failed", { err })
        }
      }

      void recordScrape(runId, {
        url: value.url,
        provider: value.provider ?? "fetch",
        status: value.http_status,
        markdown: value.markdown_content,
        cacheHit: hit,
        htmlBlobUrl: blobInfo.url,
        htmlBlobPathname: blobInfo.pathname,
      })
      void recordStep(runId, {
        stepName: "scout",
        startedAt,
        finishedAt: new Date(),
      })

      // Strip raw_html before handing to the LLM — bloats context.
      const { raw_html: _raw, ...rest } = value
      return {
        ...rest,
        detected_links: value.detected_links.slice(0, 200),
      }
    },
  })

  /* ── deepDive ── */

  const deepDiveTool = tool({
    description:
      "Deep-Diver: scout a root URL, then follow same-origin 'high value' links " +
      "(about / team / founders / company) in parallel and return aggregated Markdown. " +
      "Use this when the user wants a profile of an entity, not just one page.",
    inputSchema: z.object({
      url: z.string().url(),
      maxPages: z.number().int().min(1).max(8).default(4),
    }),
    execute: async ({ url, maxPages }) => {
      const startedAt = new Date()
      const result = await deepDive(url, { maxPages })

      await Promise.allSettled(
        result.pages.map((p) =>
          recordScrape(runId, {
            url: p.url,
            provider: p.provider ?? "fetch",
            status: p.http_status,
            markdown: p.markdown_content,
            cacheHit: false,
          }),
        ),
      )
      void recordStep(runId, {
        stepName: "deepDive",
        startedAt,
        finishedAt: new Date(),
      })

      return {
        root_url: result.root_url,
        visited: result.pages.map((p) => ({
          url: p.url,
          page_title: p.page_title,
        })),
        aggregated_markdown: result.aggregated_markdown,
      }
    },
  })

  /* ── luma / eventbrite ── */

  const lumaTool = tool({
    description:
      "Pull event metadata from a Luma (lu.ma) event URL and return it in the " +
      "unified Event schema { title, date, location, tags, ... }.",
    inputSchema: z.object({ url: z.string().url() }),
    execute: async ({ url }) => {
      const startedAt = new Date()
      const out = await fetchLumaEvent(url)
      void recordStep(runId, {
        stepName: "luma",
        startedAt,
        finishedAt: new Date(),
      })
      return out
    },
  })

  const eventbriteTool = tool({
    description:
      "Pull event metadata from an Eventbrite event URL and return it in the " +
      "unified Event schema { title, date, location, tags, ... }. Captures the " +
      "ticket price and Startup-category tags when present.",
    inputSchema: z.object({ url: z.string().url() }),
    execute: async ({ url }) => {
      const startedAt = new Date()
      const out = await fetchEventbriteEvent(url)
      void recordStep(runId, {
        stepName: "eventbrite",
        startedAt,
        finishedAt: new Date(),
      })
      return out
    },
  })

  /* ── clean ── */

  const cleanTool = tool({
    description:
      "Sanitize raw markdown / pasted text into a typed payload. Use this after a scout / deepDive / event tool, or when the user pasted a prose description directly. The hint must match the intent.",
    inputSchema: z.object({
      url: z
        .string()
        .describe("Source URL the markdown came from, or 'inline' for pasted text."),
      markdown: z.string().min(1),
      hint: z.enum(["event", "startup", "founder"]).optional(),
    }),
    execute: async ({ url, markdown, hint }) => {
      const startedAt = new Date()
      const payload = await clean({ url, markdown, hint })
      const sourceUrl = url === "inline" ? undefined : url
      const stored = await recordCleanedPayload(runId, payload, { sourceUrl })
      void recordStep(runId, {
        stepName: "clean",
        startedAt,
        finishedAt: new Date(),
      })
      return {
        ...payload,
        cleaned_payload_id: stored?.id,
      }
    },
  })

  /* ── finalize ── */

  const finalizeTool = tool({
    description:
      "Conclude the workflow. ALWAYS call this last. Provide a short markdown summary of what happened, the outcome, and a redirect URL when applicable.",
    inputSchema: FinalizeSchema,
    execute: async (input): Promise<Finalize> => {
      const startedAt = new Date()
      await finalizeRun(runId, input)
      void recordStep(runId, {
        stepName: "finalize",
        startedAt,
        finishedAt: new Date(),
      })
      return input
    },
  })

  return {
    plan: planTool,
    scout: scoutTool,
    deepDive: deepDiveTool,
    luma: lumaTool,
    eventbrite: eventbriteTool,
    clean: cleanTool,
    finalize: finalizeTool,
  }
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest("SHA-256", buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export type { ScoutOutput } from "./schemas"
