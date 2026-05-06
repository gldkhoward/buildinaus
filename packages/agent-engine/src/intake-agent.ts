import { InferAgentUIMessage, ToolLoopAgent, stepCountIs } from "ai"
import { pickModel } from "./gateway"
import { scoutTool } from "./tools/scout"
import { deepDiverTool } from "./tools/deep-diver"
import { lumaTool, eventbriteTool } from "./tools/events"
import { planTool, cleanTool, finalizeTool } from "./tools/intake"

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

export const intakeAgent = new ToolLoopAgent({
  model: pickModel("primary"),
  instructions: INTAKE_INSTRUCTIONS,
  tools: {
    plan: planTool,
    scout: scoutTool,
    deepDive: deepDiverTool,
    luma: lumaTool,
    eventbrite: eventbriteTool,
    clean: cleanTool,
    finalize: finalizeTool,
  },
  stopWhen: stepCountIs(16),
})

export type IntakeAgentUIMessage = InferAgentUIMessage<typeof intakeAgent>
