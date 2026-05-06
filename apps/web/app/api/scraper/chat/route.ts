import { createAgentUIStreamResponse } from "ai"
import { scraperAgent } from "@buildinaus/agent-engine"

export const maxDuration = 60

/**
 * Streaming chat endpoint for the scraper agent. Drop-in compatible with
 * `useChat<ScraperAgentUIMessage>()` on the client.
 */
export async function POST(req: Request) {
  const { messages } = await req.json()
  return createAgentUIStreamResponse({
    agent: scraperAgent,
    uiMessages: messages,
  })
}
