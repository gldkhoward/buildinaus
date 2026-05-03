import { Button } from "@buildinaus/ui/atoms/button"
import { Badge } from "@buildinaus/ui/atoms/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@buildinaus/ui/atoms/card"
import { SydneyBridge } from "@buildinaus/ui/branding/sydney-bridge"

export default function DocsHome() {
  return (
    <main className="mx-auto max-w-4xl space-y-12 px-6 py-16">
      <header className="space-y-4">
        <Badge variant="outline">Style Guide</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">
          BuildinAus Design System
        </h1>
        <p className="text-muted-foreground">
          Anything shipped from <code>@buildinaus/ui</code> is documented here.
          Update a component once and every app inherits the change.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Branding</h2>
        <Card>
          <CardContent className="py-8">
            <SydneyBridge className="mx-auto w-full max-w-xl" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Cards</h2>
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
          </CardHeader>
          <CardContent>
            Cards are the base container for dashboard blocks.
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
