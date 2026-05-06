import Link from "next/link"
import { ArrowUpRight, Pencil, Sparkles } from "lucide-react"
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

export default function MeLoading() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Your account"
        title={
          <>
            Welcome back, <InlineTextSkeleton className="w-32" />
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
          <ProfilePanelSkeleton />
        </div>
        <div className="lg:col-span-2">
          <AccountPanelSkeleton />
        </div>

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
              Pick the blocks that show up on your tailored one-pager. We
              filter the index down to the founders, jobs, and events that
              match your stage.
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

        <Panel className="lg:col-span-3">
          <PanelHeader label="Founder profile" />
          <div className="space-y-3 p-6 text-sm text-foreground/90">
            <p>
              Already a founder in the index? Claim your existing profile to
              link it to this account so edits sync.
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
      </div>
    </PageShell>
  )
}
