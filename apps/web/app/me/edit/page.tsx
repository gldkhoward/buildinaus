import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageShell, Panel, PanelHeader } from "@/components/layout/page-shell"
import { DetailBodySkeleton } from "@/components/layout/skeletons"
import { getCurrentUser } from "@/lib/auth/current-user"
import { ProfileEditForm } from "./profile-edit-form"

export const metadata = {
  title: "Edit profile — BuildinAus",
}

export default function EditProfilePage() {
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
          Edit profile
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Tell people what you&apos;re building. Headlines and avatars surface
          across the index, on your founder profile, and on tailored pages.
        </p>
      </header>

      <Panel className="mt-8">
        <PanelHeader label="Profile" />
        <div className="p-6">
          <Suspense fallback={<DetailBodySkeleton />}>
            <EditFormBody />
          </Suspense>
        </div>
      </Panel>
    </PageShell>
  )
}

async function EditFormBody() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in?next=/me/edit")
  return (
    <ProfileEditForm
      initial={{
        name: user.name,
        headline: user.headline,
        linkedinUrl: user.linkedinUrl,
        avatarBlobUrl: user.avatarBlobUrl,
        citySlug: user.citySlug,
      }}
    />
  )
}
