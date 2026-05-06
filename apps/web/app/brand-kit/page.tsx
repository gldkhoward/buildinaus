import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"
import { Logo } from "@/components/brand/logo"

export const metadata = {
  title: "Brand kit — BuildinAus",
  description: "Logos, colours, and usage guidance for partners.",
}

const COLOURS = [
  { name: "Background", value: "var(--background)" },
  { name: "Foreground", value: "var(--foreground)" },
  { name: "Muted", value: "var(--muted)" },
  { name: "Accent (chart-1)", value: "var(--chart-1)" },
]

export default function BrandKitPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Brand"
        title="Brand kit"
        description="Use these assets when linking to BuildinAus. If you want a vector or a custom variant, email partners@buildinaus.dev."
      />

      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <PanelHeader label="Wordmark" />
          <div className="flex flex-1 items-center justify-center bg-muted/30 p-10">
            <div className="flex items-center gap-2 text-2xl font-medium tracking-tight">
              <Logo className="h-7 w-7" />
              <span>
                Buildin<span className="text-muted-foreground">Aus</span>
              </span>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader label="Mark" />
          <div className="grid flex-1 grid-cols-3 divide-x divide-border/60">
            {[
              { bg: "bg-background", fg: "text-foreground" },
              { bg: "bg-muted", fg: "text-foreground" },
              { bg: "bg-foreground", fg: "text-background" },
            ].map((v, i) => (
              <div
                key={i}
                className={`${v.bg} flex aspect-square items-center justify-center`}
              >
                <Logo className={`h-12 w-12 ${v.fg}`} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-3">
          <PanelHeader label="Colours" />
          <div className="grid grid-cols-2 gap-px border-y border-border/60 bg-border/60 sm:grid-cols-4">
            {COLOURS.map((c) => (
              <div
                key={c.name}
                className="flex flex-col gap-3 bg-background p-5"
              >
                <div
                  aria-hidden
                  className="h-12 rounded-md border border-border/60"
                  style={{ background: c.value }}
                />
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {c.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-3">
          <PanelHeader label="Voice" />
          <div className="space-y-3 p-6 text-sm leading-relaxed text-foreground/90">
            <p>
              Direct, dry, and operator-first. We&apos;re writing for founders,
              engineers, and investors who don&apos;t need to be sold to —
              they need to find what&apos;s shipping.
            </p>
            <p className="text-muted-foreground">
              Avoid superlatives unless they&apos;re true. &ldquo;The home of the
              Australian startup ecosystem&rdquo; is a positioning claim
              we&apos;ve earned through indexing breadth, not a tagline to be
              decorative.
            </p>
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}
