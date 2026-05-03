import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
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
  title: "BuildinAus — The home of the Australian startup ecosystem",
  description:
    "BuildinAus is the central hub for Australian startups, founders, and operators. Discover what's trending across Sydney, Melbourne, Brisbane, and beyond.",
  generator: "v0.app",
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
  themeColor: "#0a0a0a",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased selection:bg-foreground/10">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
