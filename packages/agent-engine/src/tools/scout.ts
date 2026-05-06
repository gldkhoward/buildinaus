import { tool } from "ai"
import { z } from "zod"
import { scout } from "../fetchers/scout"

export const scoutTool = tool({
  description:
    "Scout: fetch a single URL and return clean Markdown plus detected outbound links. " +
    "Use this for any unknown URL the user gives you. Prefer Markdown over HTML.",
  inputSchema: z.object({
    url: z.string().url().describe("The full URL to scrape."),
    depth: z
      .literal(1)
      .default(1)
      .describe("Always 1 — call deepDive instead for multi-page traversal."),
  }),
  execute: async ({ url }) => {
    const page = await scout(url)
    return {
      url: page.url,
      page_title: page.page_title,
      meta_description: page.meta_description,
      markdown_content: page.markdown_content,
      detected_links: page.detected_links.slice(0, 200),
      fetched_at: page.fetched_at,
    }
  },
})
