import { tool } from "ai"
import { z } from "zod"
import { deepDive } from "../fetchers/deep-diver"

export const deepDiverTool = tool({
  description:
    "Deep-Diver: scout a root URL, then follow same-origin 'high value' links " +
    "(about / team / founders / company) in parallel and return aggregated Markdown. " +
    "Use this when the user wants a profile of an entity, not just one page.",
  inputSchema: z.object({
    url: z.string().url(),
    maxPages: z
      .number()
      .int()
      .min(1)
      .max(8)
      .default(4)
      .describe("Max sub-pages to follow beyond the root."),
  }),
  execute: async ({ url, maxPages }) => {
    const result = await deepDive(url, { maxPages })
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
