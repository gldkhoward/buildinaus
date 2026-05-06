import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { eq, getDb, curatedConfigs } from "@buildinaus/database"
import { PageShell, Panel, PanelHeader } from "@/components/layout/page-shell"
import { DetailBodySkeleton } from "@/components/layout/skeletons"
import { getCurrentUser } from "@/lib/auth/current-user"
import { CuratedConfigForm } from "./curated-config-form"

export const metadata = {
  title: "Personalised atlas — BuildinAus",
  description: "Pick the blocks that show up on your tailored page.",
}

export default function CuratedPage() {
  return (
    <PageShell>
      <Link
        href="/me"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to profile
      </Link>

      <header className="mt-6 border-b border-border/60 pb-6">
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          Personalised atlas
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Choose which blocks show up on your tailored one-pager. The intake
          agent uses this to filter the index down to what matters for you.
        </p>
      </header>

      <Panel className="mt-8">
        <PanelHeader label="Curated blocks" />
        <div className="p-6">
          <Suspense fallback={<DetailBodySkeleton />}>
            <CuratedFormBody />
          </Suspense>
        </div>
      </Panel>
    </PageShell>
  )
}

async function CuratedFormBody() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in?next=/me/curated")

  const db = getDb()
  const [config] = await db
    .select()
    .from(curatedConfigs)
    .where(eq(curatedConfigs.userId, user.id))
    .limit(1)

  return (
    <CuratedConfigForm
      initial={{
        blocks: (config?.blocks as string[] | undefined) ?? [],
        layout:
          (config?.layout as "grid" | "feed" | "kanban" | undefined) ??
          "grid",
        autoCurated: config?.autoCurated ?? true,
      }}
    />
  )
}
