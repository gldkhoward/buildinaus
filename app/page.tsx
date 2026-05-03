import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { TrendingBento } from "@/components/trending-bento"
import { EcosystemStats } from "@/components/ecosystem-stats"
import { CtaSection } from "@/components/cta-section"
import { SiteFooter } from "@/components/site-footer"

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
