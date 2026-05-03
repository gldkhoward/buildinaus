import Link from "next/link"
import { Button } from "@buildinaus/ui/atoms/button"
import { Logo } from "@/components/logo"

const NAV = [
  { label: "Companies", href: "#companies" },
  { label: "Founders", href: "#founders" },
  { label: "Jobs", href: "#jobs" },
  { label: "Events", href: "#events" },
  { label: "Newsletter", href: "#newsletter" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-tight">
            <Logo className="h-5 w-5" />
            <span>
              Buildin<span className="text-muted-foreground">Aus</span>
            </span>
            <span className="ml-1 hidden rounded-sm border border-border/80 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
              Beta
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="#signin"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
          >
            <Link href="#submit">Submit a startup</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
