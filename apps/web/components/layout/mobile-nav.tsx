"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@buildinaus/ui/atoms/sheet"
import { cn } from "@buildinaus/ui/lib/utils"
import { Logo } from "@/components/brand/logo"

interface NavItem {
  label: string
  href: string
}

interface MobileNavProps {
  items: NavItem[]
}

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  // Close the sheet on navigation. usePathname only updates after the next
  // render, so closing in the link onClick is enough — but this is the
  // belt-and-braces version that also closes on browser-back.
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/80 bg-card/50 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground md:hidden"
      >
        <Menu className="h-4 w-4" />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[80vw] max-w-xs gap-0 p-0"
      >
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle className="flex items-center gap-2 text-sm font-medium tracking-tight">
            <Logo className="h-5 w-5" />
            <span>
              Buildin<span className="text-muted-foreground">Aus</span>
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Primary navigation
          </SheetDescription>
        </SheetHeader>

        <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-muted/70 text-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </SheetClose>
            )
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-border/60 p-4">
          <SheetClose asChild>
            <Link
              href="/sign-in"
              className="inline-flex h-9 w-full items-center justify-center rounded-md bg-foreground text-xs font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Sign in
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/sign-up"
              className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border/80 bg-card/60 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              Create account
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
