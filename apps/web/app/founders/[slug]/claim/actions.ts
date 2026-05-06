"use server"

import { revalidatePath } from "next/cache"
import { revalidateTag } from "next/cache"
import { eq, founders, getDb } from "@buildinaus/database"
import { tags } from "@/lib/cache-tags"
import { requireCurrentUser } from "@/lib/auth/current-user"

export type ClaimResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "already_claimed" | "owned_by_other" }

export async function claimFounder(slug: string): Promise<ClaimResult> {
  const user = await requireCurrentUser()
  const db = getDb()

  const [row] = await db
    .select()
    .from(founders)
    .where(eq(founders.slug, slug))
    .limit(1)
  if (!row) return { ok: false, error: "not_found" }

  if (row.userId !== null && row.userId !== user.id) {
    return { ok: false, error: "owned_by_other" }
  }
  if (row.userId === user.id) return { ok: false, error: "already_claimed" }

  await db
    .update(founders)
    .set({ userId: user.id })
    .where(eq(founders.id, row.id))

  revalidateTag(tags.founder(slug), "max")
  revalidatePath(`/founders/${slug}`)
  return { ok: true }
}
