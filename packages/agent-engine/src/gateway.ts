import { gateway } from "@ai-sdk/gateway"
import type { LanguageModel } from "ai"

/**
 * Model routing through the Vercel AI Gateway.
 *
 * The Gateway handles fallbacks, caching, and observability for us — we just
 * pick the best model for the job and let the Gateway worry about rate limits.
 *
 *   primary  → fast, cheap reasoning for tool selection / cleaning
 *   fallback → kicks in if the primary errors or rate-limits
 *   reasoning → reserved for harder extraction prompts (used by the cleaner)
 */
export const SCRAPER_MODELS = {
  primary: "openai/gpt-5.5",
  fallback: "anthropic/claude-sonnet-4.6",
  reasoning: "anthropic/claude-sonnet-4.6",
} as const

export type ScraperModelTier = keyof typeof SCRAPER_MODELS

export function pickModel(tier: ScraperModelTier = "primary"): LanguageModel {
  const id = SCRAPER_MODELS[tier]
  return gateway(id)
}

export { gateway }
