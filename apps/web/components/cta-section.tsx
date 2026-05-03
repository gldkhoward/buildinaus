import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.16_150/0.10),transparent_70%)] blur-2xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-8 backdrop-blur md:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, oklch(0.255 0 0) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.255 0 0) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Get on the index
              </div>
              <h3 className="mt-3 text-balance text-3xl font-medium tracking-tight md:text-4xl">
                Building something great in Australia? We want to hear about it.
              </h3>
              <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
                Submit your startup, your job, or your event. Reviewed by humans. Free, forever.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#submit"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Submit a startup
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#newsletter"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border/80 bg-muted/40 px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
              >
                Subscribe to weekly digest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
