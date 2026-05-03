import Link from "next/link"
import { Logo } from "@/components/logo"

const COLUMNS = [
  {
    title: "Discover",
    links: [
      { label: "Companies", href: "#" },
      { label: "Founders", href: "#" },
      { label: "Investors", href: "#" },
      { label: "Cities", href: "#" },
    ],
  },
  {
    title: "Contribute",
    links: [
      { label: "Submit a startup", href: "#" },
      { label: "Post a job", href: "#" },
      { label: "List an event", href: "#" },
      { label: "Editorial", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "State of Founders", href: "#" },
      { label: "Newsletter", href: "#" },
      { label: "Brand kit", href: "#" },
      { label: "API", href: "#" },
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
                    <Link
                      href={l.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
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
            <Link href="#" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
