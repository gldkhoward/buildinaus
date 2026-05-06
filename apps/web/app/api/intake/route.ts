import { createHash, randomUUID } from "node:crypto"
import { checkBotId } from "botid/server"
import { start } from "workflow/api"
import type { UIMessage } from "ai"
import {
  eq,
  getDb,
  intakeMessages,
  intakeRuns,
} from "@buildinaus/database"
import { auth } from "@/lib/auth/server"
import { clientIp, intakeAnonymousLimiter } from "@/lib/rate-limit"
import { intakeWorkflow } from "./workflows/intake"

// Node.js is the default under Fluid Compute. Segment-level runtime
// pinning is rejected when cacheComponents is on, so we don't set it.
export const maxDuration = 60

/**
 * Streaming chat endpoint for the intake agent — backed by a Vercel
 * Workflow so each tool call is a durable, retryable step. Drop-in
 * compatible with `useChat<IntakeAgentUIMessage>()` on the client; the
 * workflow's default stream surfaces UIMessageChunks the same shape
 * `streamText` would emit.
 *
 * Per-request layering (in order):
 *  1. **Vercel BotID** — rejects scripted clients before any AI Gateway spend.
 *  2. **Upstash Ratelimit** — caps anonymous IPs at 2 runs / hour. Auth'd
 *     users uncapped (subject to AI Gateway spend monitoring).
 *  3. **`intake_runs` row created upfront** — we own the uuid, so the
 *     workflow's tools can persist scrape/clean rows against the run id
 *     before the workflow has even resolved.
 *  4. **Workflow start** — pass `[uiMessages, runContext]`. Workflow steps
 *     own per-step durability + observability via the WDK dashboard.
 *  5. **Persist the user message** before streaming back, so a tab close
 *     mid-stream doesn't leave the run with empty `intake_messages`.
 */
export async function POST(req: Request) {
  const verdict = await checkBotId()
  if (verdict.isBot) {
    return Response.json({ error: "bot_blocked" }, { status: 403 })
  }

  const { data: session } = await auth.getSession()
  let rateLimitBucket: "user" | "anon" = "user"
  if (!session) {
    rateLimitBucket = "anon"
    const ip = clientIp(req)
    const { success, reset } = await intakeAnonymousLimiter().limit(ip)
    if (!success) {
      return Response.json(
        { error: "anonymous_intake_limit", reset },
        { status: 429 },
      )
    }
  }

  const { messages } = (await req.json()) as { messages: UIMessage[] }

  // Generate the intake_runs uuid up-front. The workflow uses it to
  // persist `scrape_provenance` / `cleaned_payloads` against this run before
  // the workflow has even returned.
  const runId = randomUUID()
  const userId = session?.user?.id ? Number(session.user.id) : null
  const ipHash = sha256(clientIp(req)).slice(0, 64)
  const initialInput = extractFirstUserText(messages)
  const region = process.env.VERCEL_REGION ?? null

  const db = getDb()
  await db.insert(intakeRuns).values({
    id: runId,
    userId,
    sessionToken: session?.session?.token ?? null,
    ipHash,
    region,
    initialInput,
    status: "running",
    rateLimitBucket,
  })

  // Persist the inbound user message before we start the workflow so any
  // tab-close mid-stream still leaves the transcript correct.
  await persistInboundMessages(runId, messages)

  const run = await start(intakeWorkflow, [
    messages,
    { runId, userId },
  ])

  // Link the WDK run id back to our row so the dashboard deep-links work.
  await db
    .update(intakeRuns)
    .set({ workflowRunId: run.runId })
    .where(eq(intakeRuns.id, runId))

  return new Response(run.getReadable(), {
    headers: {
      "Content-Type": "text/event-stream",
      "X-Intake-Run-Id": runId,
      "X-Workflow-Run-Id": run.runId,
    },
  })
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function extractFirstUserText(messages: UIMessage[]): string {
  for (const m of messages) {
    if (m.role !== "user") continue
    const text = (m.parts ?? [])
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
      .trim()
    if (text) return text.slice(0, 4_000)
  }
  return ""
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex")
}

async function persistInboundMessages(
  runId: string,
  messages: UIMessage[],
): Promise<void> {
  const db = getDb()
  // Only persist USER messages here — assistant parts arrive via the
  // workflow stream and are persisted at the end of `intakeWorkflow`.
  const userMsgs = messages.filter((m) => m.role === "user")
  if (userMsgs.length === 0) return
  try {
    await db.insert(intakeMessages).values(
      userMsgs.map((m) => ({
        runId,
        role: "user",
        parts: m.parts as unknown as Record<string, unknown>,
      })),
    )
  } catch (err) {
    console.warn("[intake] persistInboundMessages failed", { runId, err })
  }
}
