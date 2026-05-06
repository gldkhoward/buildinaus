"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@buildinaus/ui/lib/utils"
import { CommandBar } from "@/components/intake/command-bar"

const HERO_THRESHOLD = 600

// Routes that own a focused surface — they have their own composer / form
// and shouldn't get the floating top command bar layered on top. Includes
// the agent chat (/intake), the auth pages (/sign-in, /sign-up), and the
// admin queue where the bar would compete with the action buttons.
const CHAT_ROUTES = ["/intake", "/sign-in", "/sign-up", "/admin"]

export function FloatingChrome() {
  return (
    <>
      <FloatingTopCommandBar />
      <FloatingThemeToggle />
    </>
  )
}

function FloatingTopCommandBar() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const isChat = CHAT_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  )
  const [visible, setVisible] = React.useState(!isHome && !isChat)

  React.useEffect(() => {
    if (isChat) {
      setVisible(false)
      return
    }
    if (!isHome) {
      setVisible(true)
      return
    }
    const onScroll = () => setVisible(window.scrollY > HERO_THRESHOLD)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isHome, isChat, pathname])

  if (isChat) return null

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-14 z-30 flex justify-center px-4 transition-all duration-300 md:px-6",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-4 opacity-0",
      )}
    >
      <div
        className={cn(
          "mt-3 w-full max-w-3xl",
          visible && "pointer-events-auto",
        )}
      >
        <CommandBar variant="compact" />
      </div>
    </div>
  )
}

function FloatingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = mounted ? resolvedTheme === "dark" : true

  return (
    <button
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "fixed bottom-5 right-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-card/85 text-muted-foreground backdrop-blur-md transition-all hover:border-foreground/30 hover:text-foreground",
        "shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]",
      )}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all",
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all",
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90",
        )}
      />
    </button>
  )
}
