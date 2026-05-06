"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@buildinaus/ui/lib/utils"
import { Logo } from "@/components/brand/logo"
import { IntakeBubbles } from "@/components/intake/intake-bubbles"
import { MobileNav } from "@/components/layout/mobile-nav"

const NAV = [
  { label: "Atlas", href: "/atlas" },
  { label: "Companies", href: "/companies" },
  { label: "Founders", href: "/founders" },
  { label: "Jobs", href: "/jobs" },
  { label: "Events", href: "/events" },
]

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-8">
          <MobileNav items={NAV} />
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium tracking-tight"
          >
            <Logo className="h-5 w-5" />
            <span>
              Buildin<span className="text-muted-foreground">Aus</span>
            </span>
            <span className="ml-1 hidden rounded-sm border border-border/80 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
              Beta
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <IntakeBubbles />
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}
