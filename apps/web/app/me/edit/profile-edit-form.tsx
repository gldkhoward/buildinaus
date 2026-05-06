"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { updateProfile } from "../actions"

interface ProfileEditFormProps {
  initial: {
    name: string
    headline: string | null
    linkedinUrl: string | null
    avatarBlobUrl: string | null
    citySlug: string | null
  }
}

export function ProfileEditForm({ initial }: ProfileEditFormProps) {
  const router = useRouter()
  const [name, setName] = React.useState(initial.name)
  const [headline, setHeadline] = React.useState(initial.headline ?? "")
  const [linkedinUrl, setLinkedinUrl] = React.useState(
    initial.linkedinUrl ?? "",
  )
  const [avatarBlobUrl, setAvatarBlobUrl] = React.useState(
    initial.avatarBlobUrl ?? "",
  )
  const [citySlug, setCitySlug] = React.useState(initial.citySlug ?? "")
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateProfile({
          name,
          headline: headline || null,
          linkedinUrl: linkedinUrl || null,
          avatarBlobUrl: avatarBlobUrl || null,
          citySlug: citySlug || null,
        })
        setSaved(true)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Name" htmlFor="name">
        <input
          id="name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
        />
      </Field>

      <Field
        label="Headline"
        htmlFor="headline"
        hint="One sentence on what you're building or working on."
      >
        <input
          id="headline"
          maxLength={140}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Building voice agents for SMBs."
          className="block w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
        />
      </Field>

      <Field label="LinkedIn URL" htmlFor="linkedin">
        <input
          id="linkedin"
          type="url"
          inputMode="url"
          maxLength={400}
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/your-handle"
          className="block w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
        />
      </Field>

      <Field
        label="Avatar URL"
        htmlFor="avatar"
        hint="Paste a Vercel Blob URL (uploads land here in v1.1)."
      >
        <input
          id="avatar"
          type="url"
          inputMode="url"
          maxLength={400}
          value={avatarBlobUrl}
          onChange={(e) => setAvatarBlobUrl(e.target.value)}
          placeholder="https://…public.blob.vercel-storage.com/me.png"
          className="block w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
        />
      </Field>

      <Field label="City" htmlFor="city">
        <select
          id="city"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          className="block w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
        >
          <option value="">— None —</option>
          <option value="sydney">Sydney</option>
          <option value="melbourne">Melbourne</option>
          <option value="brisbane">Brisbane</option>
          <option value="perth">Perth</option>
          <option value="adelaide">Adelaide</option>
          <option value="canberra">Canberra</option>
        </select>
      </Field>

      <div className="flex items-center gap-3 border-t border-border/60 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
        {saved && (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Saved.
          </span>
        )}
        {error && (
          <span className="text-xs text-red-500" role="alert">
            {error}
          </span>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
