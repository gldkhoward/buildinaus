import Link from "next/link"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { eq, founders, getDb } from "@buildinaus/database"
import {
  PageShell,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"
import { DetailBodySkeleton } from "@/components/layout/skeletons"
import { getCurrentUser } from "@/lib/auth/current-user"
import { ClaimForm } from "./claim-form"

export const metadata = {
  title: "Claim profile — BuildinAus",
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function ClaimFounderPage({ params }: PageProps) {
  return (
    <PageShell>
      <Link
        href="/founders"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to founders
      </Link>

      <Suspense fallback={<DetailBodySkeleton />}>
        <ClaimSection params={params} />
      </Suspense>
    </PageShell>
  )
}

async function ClaimSection({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/sign-in?next=/founders/${slug}/claim`)

  const db = getDb()
  const [row] = await db
    .select()
    .from(founders)
    .where(eq(founders.slug, slug))
    .limit(1)
  if (!row) notFound()

  const ownedByOther = row.userId !== null && row.userId !== user.id
  const alreadyMine = row.userId === user.id

  return (
    <>
      <header className="mt-6 border-b border-border/60 pb-6">
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          Claim {row.name}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Linking this profile to your account lets you edit the bio, headline,
          and links from <Link className="underline underline-offset-4" href="/me/edit">/me/edit</Link>.
          We&apos;ll only attach it if the email on the profile matches your account.
        </p>
      </header>

      <Panel className="mt-8">
        <PanelHeader label="Claim" />
        <div className="space-y-4 p-6 text-sm">
          <dl className="space-y-2 text-xs">
            <div className="flex gap-3">
              <dt className="w-24 font-mono uppercase tracking-wider text-muted-foreground">
                Profile
              </dt>
              <dd className="text-foreground">{row.name} · {row.role}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 font-mono uppercase tracking-wider text-muted-foreground">
                You
              </dt>
              <dd className="text-foreground">
                {user.name} · {user.email}
              </dd>
            </div>
          </dl>

          {alreadyMine ? (
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              You already own this profile.{" "}
              <Link
                href="/me/edit"
                className="text-foreground underline underline-offset-4"
              >
                Edit your profile →
              </Link>
            </div>
          ) : ownedByOther ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              This profile is linked to a different account. Email{" "}
              <a className="underline" href="mailto:hello@buildinaus.dev">
                hello@buildinaus.dev
              </a>{" "}
              if that&apos;s wrong.
            </div>
          ) : (
            <ClaimForm slug={slug} />
          )}
        </div>
      </Panel>
    </>
  )
}
