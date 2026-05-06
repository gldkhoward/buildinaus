import { SiteHeader } from "@/components/layout/site-header"
import { Hero } from "@/components/landing/hero"
import { TrendingBento } from "@/components/landing/trending-bento"
import { EcosystemStats } from "@/components/landing/ecosystem-stats"
import { CtaSection } from "@/components/landing/cta-section"
import { SiteFooter } from "@/components/layout/site-footer"

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <EcosystemStats />
      <TrendingBento />
      <CtaSection />
      <SiteFooter />
    </main>
  )
}
