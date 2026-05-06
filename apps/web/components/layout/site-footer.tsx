import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { CommandBarTrigger } from "@/components/intake/command-bar-trigger"

interface FooterLink {
  label: string
  href?: string
  /** Optional command bar prefill — renders as a button instead of a link. */
  prefill?: string
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Discover",
    links: [
      { label: "Atlas", href: "/atlas" },
      { label: "Companies", href: "/companies" },
      { label: "Founders", href: "/founders" },
      { label: "Jobs", href: "/jobs" },
      { label: "Events", href: "/events" },
    ],
  },
  {
    title: "Contribute",
    links: [
      {
        label: "Submit a startup",
        prefill: "Submit a startup — paste a link or describe the company",
      },
      {
        label: "Post a job",
        prefill: "Post a job — paste the listing URL or describe the role",
      },
      {
        label: "List an event",
        prefill: "List an event — paste the Lu.ma / Eventbrite URL",
      },
      { label: "Editorial", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "About", href: "/about" },
      { label: "Changelog", href: "/changelog" },
      { label: "Brand kit", href: "/brand-kit" },
      { label: "Contact", href: "/contact" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 max-w-sm">
            <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-tight">
              <Logo className="h-5 w-5" />
              <span>
                Buildin<span className="text-muted-foreground">Aus</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The home of the Australian startup ecosystem. Made on unceded land — Gadigal
              Country, Sydney.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterEntry link={l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>© 2026 BuildinAus</span>
            <span aria-hidden>·</span>
            <span>v1.0.0</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-chart-1" />
              All systems normal
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterEntry({ link }: { link: FooterLink }) {
  const cls =
    "text-left text-sm text-foreground/80 transition-colors hover:text-foreground"
  if (link.prefill) {
    return (
      <CommandBarTrigger prefill={link.prefill} className={cls}>
        {link.label}
      </CommandBarTrigger>
    )
  }
  return (
    <Link href={link.href ?? "#"} className={cls}>
      {link.label}
    </Link>
  )
}
