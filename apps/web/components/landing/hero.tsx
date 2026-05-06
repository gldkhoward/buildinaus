import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { CommandBar } from "@/components/intake/command-bar"
import { SydneyLinework } from "@/components/landing/sydney-linework"

const TRUSTED_BY = [
  "Canva",
  "Atlassian",
  "Linktree",
  "Culture Amp",
  "Airwallex",
  "SafetyCulture",
  "Mr Yum",
  "Immutable",
  "Linear",
  "Eucalyptus",
]

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Ambient background glows — subtle, single-temperature */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.16_150/0.12),transparent_70%)] blur-2xl" />
        <div className="absolute right-[-10%] top-[20%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.14_80/0.10),transparent_70%)] blur-2xl" />
      </div>

      {/* Faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Sydney linework illustration — sits behind hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex justify-center [mask-image:linear-gradient(to_top,black_30%,transparent_95%)]"
      >
        <SydneyLinework className="w-[1400px] max-w-none text-foreground/10" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16 md:px-6 md:pb-32 md:pt-24">
        {/* Eyebrow pill */}
        <div className="mb-8 flex justify-center">
          <Link
            href="/changelog"
            className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 py-1 pl-1 pr-3 text-xs text-muted-foreground backdrop-blur transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <span className="rounded-full border border-border/80 bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
              New
            </span>
            <span>BuildinAus 2026 State of Founders report</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-3xl text-balance text-center text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl">
          The home of the{" "}
          <span className="relative inline-block">
            Australian
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent"
            />
          </span>{" "}
          startup ecosystem.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-center text-base leading-relaxed text-muted-foreground md:text-[17px]">
          Discover what&apos;s being built across Sydney, Melbourne, Brisbane and beyond. Submit a
          link, surface what&apos;s shipping, and follow the founders building Australia&apos;s next
          generation of companies.
        </p>

        {/* Command bar */}
        <div className="mx-auto mt-10 max-w-2xl">
          <CommandBar />
        </div>

        {/* Trust strip */}
        <div className="mt-16">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            Built and read by operators from
          </p>
          <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max animate-marquee gap-12">
              {[...TRUSTED_BY, ...TRUSTED_BY].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="shrink-0 text-sm tracking-tight text-muted-foreground/80"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
