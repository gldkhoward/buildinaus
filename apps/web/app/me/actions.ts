"use server"

import { revalidatePath } from "next/cache"
import { eq, getDb, users, curatedConfigs } from "@buildinaus/database"
import { revalidateTag } from "next/cache"
import { tags } from "@/lib/cache-tags"
import { requireCurrentUser } from "@/lib/auth/current-user"

export interface UpdateProfileInput {
  name?: string
  headline?: string | null
  linkedinUrl?: string | null
  avatarBlobUrl?: string | null
  citySlug?: string | null
}

export async function updateProfile(input: UpdateProfileInput): Promise<void> {
  const user = await requireCurrentUser()
  const db = getDb()

  await db
    .update(users)
    .set({
      name: input.name?.trim() || user.name,
      headline: cleanText(input.headline),
      linkedinUrl: cleanUrl(input.linkedinUrl),
      avatarBlobUrl: cleanUrl(input.avatarBlobUrl),
      citySlug: cleanText(input.citySlug)?.slice(0, 32) ?? null,
    })
    .where(eq(users.id, user.id))

  revalidateTag(tags.user(user.id), "max")
  revalidatePath("/me")
}

export interface UpdateCuratedInput {
  blocks: string[]
  layout: "grid" | "feed" | "kanban"
  autoCurated: boolean
}

export async function updateCuratedConfig(
  input: UpdateCuratedInput,
): Promise<void> {
  const user = await requireCurrentUser()
  const db = getDb()

  // curated_configs has a unique FK on user_id, so upsert via insert/update.
  const [existing] = await db
    .select()
    .from(curatedConfigs)
    .where(eq(curatedConfigs.userId, user.id))
    .limit(1)

  const now = new Date()
  if (existing) {
    await db
      .update(curatedConfigs)
      .set({
        blocks: input.blocks,
        layout: input.layout,
        autoCurated: input.autoCurated,
        updatedAt: now,
      })
      .where(eq(curatedConfigs.userId, user.id))
  } else {
    await db.insert(curatedConfigs).values({
      userId: user.id,
      blocks: input.blocks,
      layout: input.layout,
      autoCurated: input.autoCurated,
    })
  }

  revalidateTag(tags.user(user.id), "max")
  revalidatePath("/me")
  revalidatePath("/me/curated")
}

function cleanText(v?: string | null): string | null {
  if (v === undefined) return null
  const t = String(v).trim()
  return t.length === 0 ? null : t
}

function cleanUrl(v?: string | null): string | null {
  const t = cleanText(v)
  if (!t) return null
  try {
    const u = new URL(/^https?:/i.test(t) ? t : `https://${t}`)
    return u.toString()
  } catch {
    return null
  }
}
