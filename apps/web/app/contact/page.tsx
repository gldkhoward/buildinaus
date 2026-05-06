import { Mail, MessageSquare } from "lucide-react"
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"
import { CommandBarTrigger } from "@/components/intake/command-bar-trigger"

export const metadata = {
  title: "Contact — BuildinAus",
  description:
    "Reach the team behind BuildinAus — partnerships, editorial, press, or feedback.",
}

const CHANNELS = [
  {
    icon: <Mail className="h-4 w-4" />,
    title: "hello@buildinaus.dev",
    body: "General questions, editorial, press. We aim to reply within two business days.",
    href: "mailto:hello@buildinaus.dev",
  },
  {
    icon: <Mail className="h-4 w-4" />,
    title: "partners@buildinaus.dev",
    body: "VCs, accelerators, and ecosystem partners — for sponsorships, data partnerships, or atlas contributions.",
    href: "mailto:partners@buildinaus.dev",
  },
]

export default function ContactPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the team"
        description="The fastest way to add something to the index is the intake bar. For everything else, email works best."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <Panel key={c.title} className="p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground">
                {c.icon}
              </span>
              <a className="hover:underline" href={c.href}>
                {c.title}
              </a>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {c.body}
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="mt-6">
        <PanelHeader
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Submit something instead"
        />
        <div className="space-y-3 p-6 text-sm">
          <p className="text-muted-foreground">
            Got a startup, role, or event to add? Skip the email — drop it
            into the intake bar and the agent will draft a structured profile
            for review.
          </p>
          <CommandBarTrigger
            prefill="Submit something — paste a link or describe it"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background hover:bg-foreground/90"
          >
            Open the intake bar
          </CommandBarTrigger>
        </div>
      </Panel>
    </PageShell>
  )
}
