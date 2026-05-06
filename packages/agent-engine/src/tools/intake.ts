import { tool } from "ai"
import { z } from "zod"
import {
  FinalizeSchema,
  PlanSchema,
  type CleanedPayload,
  type Finalize,
  type Plan,
} from "../schemas"
import { clean } from "../cleaner"

/**
 * The intake agent's first move: declare a plan. The output schema is the
 * plan — we don't persist anything here; the value of this tool is that the
 * model commits to an ordered list of steps the UI can render as a
 * "thinking view" before any work actually happens.
 */
export const planTool = tool({
  description:
    "Declare the workflow you intend to run. ALWAYS call this first, before any other tool. " +
    "Return the user's intent and an ordered list of steps so the UI can show them upfront.",
  inputSchema: PlanSchema,
  execute: async (plan): Promise<Plan> => plan,
})

/**
 * Run the sanitizer on whichever markdown the prior tools produced. The
 * agent passes in the markdown it wants cleaned, plus a hint about what kind
 * of resource it expects — the cleaner enforces the corresponding schema.
 */
export const cleanTool = tool({
  description:
    "Sanitize raw markdown / pasted text into a typed payload. Use this after a scout / deepDive / event tool, or when the user pasted a prose description directly. The hint must match the intent.",
  inputSchema: z.object({
    url: z
      .string()
      .describe("Source URL the markdown came from, or 'inline' for pasted text."),
    markdown: z
      .string()
      .min(1)
      .describe("The markdown / prose to sanitize."),
    hint: z
      .enum(["event", "startup", "founder"])
      .optional()
      .describe("What kind of resource this should resolve to."),
  }),
  execute: async ({ url, markdown, hint }): Promise<CleanedPayload> => {
    return clean({ url, markdown, hint })
  },
})

/**
 * Final step. Tells the UI we're done, what was created/drafted, and where
 * to redirect the user. The agent must call this exactly once at the end.
 */
export const finalizeTool = tool({
  description:
    "Conclude the workflow. ALWAYS call this last. Provide a short markdown summary of what happened, the outcome, and a redirect URL when applicable.",
  inputSchema: FinalizeSchema,
  execute: async (payload): Promise<Finalize> => payload,
})
