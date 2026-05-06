import { NextResponse } from "next/server"
import { z } from "zod"
import { scrapeAndPresent } from "@buildinaus/agent-engine"

// Scraping fans out network calls; keep the function alive for a bit.
export const maxDuration = 60

const InputSchema = z.object({
  url: z.string().url(),
  hint: z.enum(["event", "startup"]).optional(),
})

/**
 * One-shot scrape: POST { url, hint? } → { payload, block, trace }.
 * The block field is exactly what the dashboard renderer consumes:
 *   { component: "EventCard" | "StartupBento", props }
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const result = await scrapeAndPresent(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "scrape_failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
