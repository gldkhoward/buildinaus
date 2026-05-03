import { z } from "zod"

export const StartupExtractionSchema = z.object({
  name: z.string(),
  description: z.string(),
  industry: z.array(z.string()),
  city: z.string(),
  founders: z.array(z.string()),
  links: z.object({
    website: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  }),
})

export type StartupExtraction = z.infer<typeof StartupExtractionSchema>

// TODO: replace with `generateObject` from the AI SDK using Vercel AI Gateway:
//
//   import { generateObject } from "ai"
//   const { object } = await generateObject({
//     model: "anthropic/claude-sonnet-4-6",
//     schema: StartupExtractionSchema,
//     prompt: `Extract startup metadata from this HTML: ${html}`,
//   })
//
// Routing through the Gateway (plain "provider/model" string) gets us
// observability, fallbacks, and zero data retention without provider lock-in.
export async function extractStartup(_html: string): Promise<StartupExtraction> {
  throw new Error("extractStartup: not yet implemented")
}
