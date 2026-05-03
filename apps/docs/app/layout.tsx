import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "BuildinAus — Style Guide",
  description: "Internal documentation and design system for BuildinAus.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
