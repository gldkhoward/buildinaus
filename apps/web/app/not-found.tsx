import Link from "next/link"
import { Compass, Sparkles } from "lucide-react"
import { PageShell } from "@/components/layout/page-shell"
import { CommandBarTrigger } from "@/components/intake/command-bar-trigger"

export const metadata = {
  title: "Not found — BuildinAus",
  description: "We couldn't find that page.",
}

export default function NotFound() {
  return (
    <PageShell className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-xl border border-border/80 bg-card/60 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-muted-foreground">
          <Compass className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            404
          </p>
          <h1 className="text-balance text-2xl font-medium tracking-tight">
            That page isn&apos;t on the index
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            The link may have moved, or the company / founder hasn&apos;t been
            indexed yet. You can search the ecosystem from the command bar, or
            paste a link and the agent will pick it up.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <CommandBarTrigger
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Search or paste a link
          </CommandBarTrigger>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-md border border-border/80 bg-card/60 px-4 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            Back to home
          </Link>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 border-t border-border/60 pt-6 text-xs">
          {[
            { href: "/companies", label: "Companies" },
            { href: "/founders", label: "Founders" },
            { href: "/jobs", label: "Jobs" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
