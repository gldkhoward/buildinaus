import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/system/theme-provider"
import { FloatingChrome } from "@/components/layout/floating-chrome"
import { siteUrl } from "@/lib/site"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "BuildinAus — The home of the Australian startup ecosystem",
  description:
    "BuildinAus is the central hub for Australian startups, founders, and operators. Discover what's trending across Sydney, Melbourne, Brisbane, and beyond.",
  keywords: [
    "Australian startups",
    "Sydney startups",
    "Melbourne startups",
    "founders",
    "venture capital",
    "BuildinAus",
  ],
  openGraph: {
    title: "BuildinAus — The home of the Australian startup ecosystem",
    description:
      "Discover, contribute to, and follow what's being built across Australia.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased selection:bg-foreground/10">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          {/*
            FloatingChrome reads `usePathname()` and `useTheme()` — both
            uncached client state. Under Cache Components, anything that
            isn't statically prerenderable must sit behind Suspense so
            it doesn't poison sibling pages' build-time rendering.
          */}
          <Suspense fallback={null}>
            <FloatingChrome />
          </Suspense>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
