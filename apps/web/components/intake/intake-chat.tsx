"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Loader2,
  ListChecks,
  Sparkles,
  XCircle,
} from "lucide-react"
import { Streamdown } from "streamdown"
import type { IntakeAgentUIMessage } from "@buildinaus/agent-engine"
import {
  EventCard,
  FounderCard,
  StartupBento,
  type EventCardData,
  type FounderCardData,
  type StartupBentoData,
} from "@buildinaus/dashboard-blocks"
import { cn } from "@buildinaus/ui/lib/utils"
import { promote } from "@/lib/data/promote"

const TOOL_LABELS: Record<string, string> = {
  scout: "Top search",
  deepDive: "Deep dive",
  luma: "Luma event lookup",
  eventbrite: "Eventbrite lookup",
  clean: "Sanitize content",
  finalize: "Finalize",
}

// Lightweight typography for Streamdown output. We target the semantic tags
// Streamdown emits with descendant selectors so we don't have to ship the
// Tailwind Typography plugin just to get list spacing right.
const markdownClass = cn(
  "text-sm leading-relaxed",
  "[&>*+*]:mt-3",
  "[&_p]:leading-relaxed",
  "[&_strong]:font-semibold",
  "[&_em]:italic",
  "[&_a]:underline [&_a]:underline-offset-2 [&_a]:text-foreground hover:[&_a]:text-foreground/80",
  "[&_code]:rounded [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted/40 [&_pre]:p-3 [&_pre]:text-xs",
  "[&_h1]:mt-4 [&_h1]:text-base [&_h1]:font-semibold",
  "[&_h2]:mt-4 [&_h2]:text-sm [&_h2]:font-semibold",
  "[&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-1 [&_li]:leading-relaxed",
  "[&_li>p]:my-0",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
)

interface IntakeChatProps {
  initialInput: string
}

export function IntakeChat({ initialInput }: IntakeChatProps) {
  const router = useRouter()

  const { messages, sendMessage, status, error } = useChat<IntakeAgentUIMessage>(
    {
      transport: new DefaultChatTransport({ api: "/api/intake" }),
    },
  )

  // Kick the agent off automatically when we land here with a query.
  const sentRef = React.useRef(false)
  React.useEffect(() => {
    if (sentRef.current) return
    if (!initialInput.trim()) return
    sentRef.current = true
    sendMessage({ text: initialInput })
  }, [initialInput, sendMessage])

  const finalize = useFinalizePart(messages)
  const cleanedPayloadId = useLatestCleanedPayloadId(messages)
  const isStreaming = status === "submitted" || status === "streaming"

  // Auto-scroll on new content.
  const scrollRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isStreaming])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl space-y-5 px-6 py-6">
          {messages.length === 0 && !initialInput ? (
            <EmptyState />
          ) : null}

          {messages.map((message) =>
            message.role === "user" ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AssistantMessage key={message.id} message={message} />
            ),
          )}

          {isStreaming ? <ThinkingPing /> : null}

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error.message ?? "Something went wrong."}
            </div>
          ) : null}

          <PostRunActions
            finalize={finalize}
            cleanedPayloadId={cleanedPayloadId}
            onRedirect={(url) => router.push(url)}
          />
        </div>
      </div>

      <Composer
        disabled={isStreaming}
        onSubmit={(text) => sendMessage({ text })}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
      Paste a link, drop in a company description, or ask a question to start.
    </div>
  )
}

/**
 * After-run CTAs. Three branches:
 *   - outcome === "created" + redirect_url → "Open <kind>" navigates straight there.
 *   - outcome === "drafted" + cleanedPayloadId → "Publish draft" calls the
 *     promote() server action (writes the entity, embeds, busts cache tags),
 *     then navigates.
 *   - otherwise → no CTA.
 */
function PostRunActions({
  finalize,
  cleanedPayloadId,
  onRedirect,
}: {
  finalize: { outcome: string; redirect_url?: string; resource_kind?: string; resource_label?: string } | null
  cleanedPayloadId: number | null
  onRedirect: (url: string) => void
}) {
  const [pending, setPending] = React.useState(false)
  const [errorText, setErrorText] = React.useState<string | null>(null)

  if (!finalize) return null

  const isCreated = finalize.outcome === "created" && finalize.redirect_url
  const isDrafted = finalize.outcome === "drafted" && cleanedPayloadId != null

  if (isCreated) {
    return (
      <button
        type="button"
        onClick={() => onRedirect(finalize.redirect_url!)}
        className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
      >
        Open {finalize.resource_label ?? finalize.resource_kind ?? "result"}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    )
  }

  if (isDrafted) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true)
            setErrorText(null)
            try {
              const result = await promote(cleanedPayloadId!)
              if (result.ok) {
                onRedirect(result.redirectUrl)
              } else {
                setErrorText(`promote_failed:${result.error}`)
              }
            } catch (err) {
              setErrorText(err instanceof Error ? err.message : "promote_failed")
            } finally {
              setPending(false)
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              Publish draft
              <Sparkles className="h-3.5 w-3.5" />
            </>
          )}
        </button>
        {errorText ? (
          <p className="text-xs text-destructive">{errorText}</p>
        ) : null}
      </div>
    )
  }

  return null
}

function UserMessage({ message }: { message: IntakeAgentUIMessage }) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim()
  if (!text) return null
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md border border-border/60 bg-foreground px-3.5 py-2 text-sm text-background">
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>
    </div>
  )
}

// ── Composer ───────────────────────────────────────────────────────────────

function Composer({
  disabled,
  onSubmit,
}: {
  disabled: boolean
  onSubmit: (text: string) => void
}) {
  const [value, setValue] = React.useState("")
  const taRef = React.useRef<HTMLTextAreaElement>(null)

  // Land focus on the composer when the user arrives — their initial query
  // already showed up as a message above, so the cursor should be primed for
  // the next reply.
  React.useEffect(() => {
    taRef.current?.focus()
  }, [])

  // Re-focus when the agent finishes streaming so follow-ups feel snappy.
  React.useEffect(() => {
    if (!disabled) taRef.current?.focus()
  }, [disabled])

  // Auto-grow up to ~6 lines.
  React.useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`
  }, [value])

  function submit() {
    const text = value.trim()
    if (!text || disabled) return
    onSubmit(text)
    setValue("")
    requestAnimationFrame(() => taRef.current?.focus())
  }

  return (
    <div className="border-t border-border/60 bg-background/90 backdrop-blur">
      <form
        className="mx-auto max-w-3xl px-6 py-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div
          className={cn(
            "group flex items-end gap-2 rounded-xl border border-border/80 bg-card/80 p-1.5 pl-3 transition-colors",
            "focus-within:border-foreground/30",
          )}
        >
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={1}
            placeholder={
              disabled
                ? "Agent is working…"
                : "Reply, paste a link, or add more detail…"
            }
            className="max-h-40 min-h-9 w-full resize-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
          />
          <button
            type="submit"
            disabled={disabled || value.trim().length === 0}
            aria-label="Send message"
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-all",
              "hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground/70">
          Enter to send · Shift+Enter for newline
        </p>
      </form>
    </div>
  )
}

function ThinkingPing() {
  return (
    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Thinking…
    </div>
  )
}

// ── Assistant message rendering ────────────────────────────────────────────

type AssistantMessage = IntakeAgentUIMessage
type Part = AssistantMessage["parts"][number]

function AssistantMessage({ message }: { message: AssistantMessage }) {
  const planPart = message.parts.find(
    (p): p is Extract<Part, { type: "tool-plan" }> => p.type === "tool-plan",
  )

  const stepParts = message.parts.filter((p) => isStepPart(p))
  const finalizePart = message.parts.find(
    (p): p is Extract<Part, { type: "tool-finalize" }> =>
      p.type === "tool-finalize",
  )
  const textParts = message.parts.filter(
    (p): p is Extract<Part, { type: "text" }> => p.type === "text",
  )

  return (
    <div className="space-y-4">
      {planPart ? <PlanCard plan={planPart} steps={stepParts} /> : null}

      {stepParts.length > 0 ? (
        <ol className="space-y-2">
          {stepParts.map((part, i) => (
            <StepCard key={`${part.toolCallId}-${i}`} part={part} index={i + 1} />
          ))}
        </ol>
      ) : null}

      {finalizePart ? <FinalizeCard part={finalizePart} /> : null}

      {textParts.length > 0 ? (
        <div
          className={cn(
            markdownClass,
            "rounded-xl border border-border/60 bg-card/60 p-4",
          )}
        >
          {textParts.map((part, i) => (
            <Streamdown key={i}>{part.text}</Streamdown>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// ── Plan ───────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  steps,
}: {
  plan: Extract<Part, { type: "tool-plan" }>
  steps: ReadonlyArray<StepPart>
}) {
  const completed = new Set(
    steps
      .filter((s) => s.state === "output-available")
      .map((s) => stripToolPrefix(s.type)),
  )
  const inFlight = steps.find(
    (s) => s.state === "input-streaming" || s.state === "input-available",
  )

  if (plan.state === "input-streaming") {
    return (
      <ShellCard icon={<ListChecks className="size-4" />} title="Drafting plan…">
        <ThinkingPing />
      </ShellCard>
    )
  }

  if (plan.state !== "output-available" && plan.state !== "input-available") {
    return null
  }

  // Both `input-available` and `output-available` carry the plan in `input`
  // (the `plan` tool's execute is identity).
  const value = plan.state === "output-available" ? plan.output : plan.input
  if (!value) return null

  return (
    <ShellCard
      icon={<ListChecks className="size-4" />}
      title="Plan"
      sublabel={value.summary}
    >
      <ol className="space-y-1.5 text-sm">
        {value.steps.map((s, i) => {
          const done = completed.has(s.tool)
          const active =
            !done && inFlight && stripToolPrefix(inFlight.type) === s.tool
          return (
            <li key={i} className="flex items-start gap-2">
              <StatusDot
                state={done ? "done" : active ? "running" : "pending"}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">
                    {TOOL_LABELS[s.tool] ?? s.tool}
                  </span>
                  <span className="text-muted-foreground">— {s.label}</span>
                </div>
                <div className="text-xs text-muted-foreground/80">{s.reason}</div>
              </div>
            </li>
          )
        })}
      </ol>
    </ShellCard>
  )
}

// ── Per-step expandable cards ──────────────────────────────────────────────

const STEP_TOOL_TYPES = [
  "tool-scout",
  "tool-deepDive",
  "tool-luma",
  "tool-eventbrite",
  "tool-clean",
] as const
type StepToolType = (typeof STEP_TOOL_TYPES)[number]
type StepPart = Extract<Part, { type: StepToolType }>

function isStepPart(part: Part): part is StepPart {
  return (STEP_TOOL_TYPES as readonly string[]).includes(part.type)
}

function StepCard({ part, index }: { part: StepPart; index: number }) {
  const [open, setOpen] = React.useState(false)
  const tool = stripToolPrefix(part.type)
  const label = TOOL_LABELS[tool] ?? tool
  const status = stateToStatus(part.state)

  return (
    <li className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/30"
      >
        <span className="font-mono text-xs text-muted-foreground/70">
          {String(index).padStart(2, "0")}
        </span>
        <StatusDot state={status} />
        <span className="flex-1 truncate font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {humanStatus(status)}
        </span>
        {open ? (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground" />
        )}
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border/60 bg-background/40 p-3 text-xs">
          <Section title="Input">
            <CodeBlock value={part.input} />
          </Section>
          {part.state === "output-available" ? (
            <Section title="Output">
              <StepOutput tool={tool} output={part.output} />
            </Section>
          ) : part.state === "output-error" ? (
            <Section title="Error">
              <pre className="whitespace-pre-wrap break-words text-destructive">
                {part.errorText}
              </pre>
            </Section>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

function StepOutput({ tool, output }: { tool: string; output: unknown }) {
  if (tool === "clean" && isCleanedPayload(output)) {
    if (output.type === "event") {
      return <EventCard event={output.data as EventCardData} />
    }
    if (output.type === "startup") {
      return <StartupBento startup={output.data as StartupBentoData} />
    }
    if (output.type === "founder") {
      return <FounderCard founder={output.data as FounderCardData} />
    }
  }
  if (
    (tool === "scout" || tool === "deepDive") &&
    typeof (output as { aggregated_markdown?: string; markdown_content?: string })
      ?.aggregated_markdown === "string"
  ) {
    return (
      <CollapsedMarkdown
        text={(output as { aggregated_markdown: string }).aggregated_markdown}
      />
    )
  }
  if (
    (tool === "scout" || tool === "deepDive") &&
    typeof (output as { markdown_content?: string })?.markdown_content === "string"
  ) {
    return (
      <CollapsedMarkdown
        text={(output as { markdown_content: string }).markdown_content}
      />
    )
  }
  return <CodeBlock value={output} />
}

function CollapsedMarkdown({ text }: { text: string }) {
  return (
    <details className="rounded-md border border-border/60 bg-background/30 p-2">
      <summary className="cursor-pointer text-xs text-muted-foreground">
        Markdown ({text.length} chars)
      </summary>
      <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
        {text}
      </pre>
    </details>
  )
}

// ── Finalize ───────────────────────────────────────────────────────────────

function FinalizeCard({
  part,
}: {
  part: Extract<Part, { type: "tool-finalize" }>
}) {
  if (part.state !== "input-available" && part.state !== "output-available") {
    return null
  }
  const value = part.state === "output-available" ? part.output : part.input
  if (!value) return null

  const tone =
    value.outcome === "error"
      ? "border-destructive/40 bg-destructive/10"
      : value.outcome === "noop"
        ? "border-border/60 bg-card/60"
        : "border-emerald-500/40 bg-emerald-500/5"

  return (
    <div className={cn("rounded-xl border p-4", tone)}>
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Sparkles className="size-3.5" />
        Outcome · {value.outcome}
      </div>
      <div className={markdownClass}>
        <Streamdown>{value.summary_markdown}</Streamdown>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function useFinalizePart(messages: IntakeAgentUIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (!msg || msg.role !== "assistant") continue
    for (const p of msg.parts) {
      if (p.type !== "tool-finalize") continue
      if (p.state === "output-available") return p.output
      if (p.state === "input-available") return p.input
    }
  }
  return null
}

/**
 * Walk the latest assistant message for a `tool-clean` output and pull the
 * `cleaned_payload_id` the wrapped clean tool wrote in. The promote()
 * server action takes that id directly.
 */
function useLatestCleanedPayloadId(
  messages: IntakeAgentUIMessage[],
): number | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (!msg || msg.role !== "assistant") continue
    for (const p of msg.parts) {
      if (p.type !== "tool-clean") continue
      if (p.state !== "output-available") continue
      const out = p.output as { cleaned_payload_id?: number } | undefined
      if (typeof out?.cleaned_payload_id === "number") {
        return out.cleaned_payload_id
      }
    }
  }
  return null
}

function stripToolPrefix(type: string): string {
  return type.startsWith("tool-") ? type.slice(5) : type
}

type Status = "pending" | "running" | "done" | "error"

function stateToStatus(state: string): Status {
  switch (state) {
    case "input-streaming":
    case "input-available":
      return "running"
    case "output-available":
      return "done"
    case "output-error":
      return "error"
    default:
      return "pending"
  }
}

function humanStatus(s: Status): string {
  switch (s) {
    case "pending":
      return "Pending"
    case "running":
      return "Running…"
    case "done":
      return "Done"
    case "error":
      return "Error"
  }
}

function StatusDot({
  state,
  className,
}: {
  state: Status
  className?: string
}) {
  switch (state) {
    case "done":
      return (
        <CheckCircle2
          className={cn("size-3.5 text-emerald-500", className)}
          aria-label="Done"
        />
      )
    case "running":
      return (
        <Loader2
          className={cn("size-3.5 animate-spin text-foreground", className)}
          aria-label="Running"
        />
      )
    case "error":
      return (
        <XCircle
          className={cn("size-3.5 text-destructive", className)}
          aria-label="Error"
        />
      )
    default:
      return (
        <CircleDashed
          className={cn("size-3.5 text-muted-foreground", className)}
          aria-label="Pending"
        />
      )
  }
}

function ShellCard({
  icon,
  title,
  sublabel,
  children,
}: {
  icon: React.ReactNode
  title: string
  sublabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {sublabel ? (
          <p className="text-xs text-muted-foreground">— {sublabel}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {title}
      </p>
      {children}
    </div>
  )
}

function CodeBlock({ value }: { value: unknown }) {
  let text: string
  try {
    text = typeof value === "string" ? value : JSON.stringify(value, null, 2)
  } catch {
    text = String(value)
  }
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/30 p-2 text-[11px] text-muted-foreground">
      {text}
    </pre>
  )
}

function isCleanedPayload(
  v: unknown,
): v is
  | { type: "event"; data: unknown }
  | { type: "startup"; data: unknown }
  | { type: "founder"; data: unknown } {
  if (!v || typeof v !== "object") return false
  const t = (v as { type?: unknown }).type
  return t === "event" || t === "startup" || t === "founder"
}
