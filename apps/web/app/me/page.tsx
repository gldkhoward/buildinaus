import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ArrowUpRight, ExternalLink, Pencil, Sparkles } from "lucide-react"
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"
import {
  AccountPanelSkeleton,
  InlineTextSkeleton,
  ProfilePanelSkeleton,
} from "@/components/layout/skeletons"
import { getCurrentUser } from "@/lib/auth/current-user"

export const metadata = {
  title: "Your profile — BuildinAus",
  description: "Manage your BuildinAus profile, headline, and curated atlas.",
}

export default function MePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Your account"
        title={
          <>
            Welcome back,{" "}
            <Suspense fallback={<InlineTextSkeleton className="w-32" />}>
              <FirstName />
            </Suspense>
          </>
        }
        description="Edit how you appear across the index, manage your personalised atlas, and keep your founder profile in sync."
        action={
          <Link
            href="/me/edit"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit profile
          </Link>
        }
      />

      <div className="mt-10 grid gap-3 lg:grid-cols-6">
        <div className="lg:col-span-4">
          <Suspense fallback={<ProfilePanelSkeleton />}>
            <PublicProfilePanel />
          </Suspense>
        </div>

        <div className="lg:col-span-2">
          <Suspense fallback={<AccountPanelSkeleton />}>
            <AccountPanel />
          </Suspense>
        </div>

        <CuratedAtlasPanel />
        <FounderProfilePanel />
      </div>
    </PageShell>
  )
}

async function FirstName() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in?next=/me")
  return <>{user.name.split(" ")[0]}</>
}

async function PublicProfilePanel() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in?next=/me")

  return (
    <Panel>
      <PanelHeader label="Public profile" />
      <div className="flex items-start gap-4 p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border/80 bg-gradient-to-b from-muted/60 to-muted/20 font-mono text-xl font-medium">
          {user.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="text-base font-medium tracking-tight">
            {user.name}
          </div>
          <div className="text-xs text-muted-foreground">
            @{user.slug} · {user.role}
          </div>
          <p className="text-sm text-foreground/80">
            {user.headline ?? (
              <span className="text-muted-foreground">
                No headline yet — add one so people know what you&apos;re
                building.
              </span>
            )}
          </p>
          {user.linkedinUrl && (
            <a
              href={user.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              LinkedIn
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Panel>
  )
}

async function AccountPanel() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in?next=/me")

  return (
    <Panel>
      <PanelHeader label="Account" />
      <dl className="space-y-2.5 p-6 text-xs">
        <div>
          <dt className="font-mono uppercase tracking-wider text-muted-foreground">
            Email
          </dt>
          <dd className="mt-0.5 text-sm text-foreground">{user.email}</dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-wider text-muted-foreground">
            Joined
          </dt>
          <dd className="mt-0.5 text-sm text-foreground">
            {formatDate(user.createdAt)}
          </dd>
        </div>
        {user.citySlug && (
          <div>
            <dt className="font-mono uppercase tracking-wider text-muted-foreground">
              City
            </dt>
            <dd className="mt-0.5 text-sm text-foreground">{user.citySlug}</dd>
          </div>
        )}
      </dl>
    </Panel>
  )
}

function CuratedAtlasPanel() {
  return (
    <Panel className="lg:col-span-3">
      <PanelHeader
        icon={<Sparkles className="h-3.5 w-3.5" />}
        label="Personalised atlas"
        accessory={
          <Link
            href="/me/curated"
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Edit →
          </Link>
        }
      />
      <div className="space-y-3 p-6 text-sm text-foreground/90">
        <p>
          Pick the blocks that show up on your tailored one-pager. We filter
          the index down to the founders, jobs, and events that match your
          stage.
        </p>
        <Link
          href="/me/curated"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-foreground/80"
        >
          Configure curated blocks
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Panel>
  )
}

function FounderProfilePanel() {
  return (
    <Panel className="lg:col-span-3">
      <PanelHeader label="Founder profile" />
      <div className="space-y-3 p-6 text-sm text-foreground/90">
        <p>
          Already a founder in the index? Claim your existing profile to link
          it to this account so edits sync.
        </p>
        <Link
          href="/founders"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-foreground/80"
        >
          Find your profile
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Panel>
  )
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
