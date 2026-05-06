import { cache } from "react"
import { eq, getDb, or, users, type User as UserRow } from "@buildinaus/database"
import { auth } from "./server"

export interface SessionAccount {
  /** Better Auth subject id — opaque external id. */
  authSubjectId: string
  email: string
  name: string
  image?: string | null
}

/**
 * Server-side helper that returns the BuildinAus `users` row for the
 * current session, lazily creating it on first sign-in. Returns `null`
 * when there's no active session.
 *
 * The Neon Auth (Better Auth) session carries the email + name; we map
 * that onto our application-owned `users` table so foreign keys
 * (intake_runs.userId, founders.userId, curated_configs.userId) stay
 * stable across sessions.
 */
// React `cache()` dedupes per-request, so multiple suspended children that
// each call `getCurrentUser()` share a single auth + DB roundtrip.
export const getCurrentUser = cache(async (): Promise<UserRow | null> => {
  let session: Awaited<ReturnType<typeof auth.getSession>>["data"] = null
  try {
    const result = await auth.getSession()
    session = result.data
  } catch {
    // `auth.getSession()` reads the request cookies. During a static
    // prerender pass it can reject — treat that as "no user" and let the
    // caller redirect, instead of bubbling a hanging promise.
    return null
  }
  if (!session?.user) return null

  const acct: SessionAccount = {
    authSubjectId: session.user.id,
    email: session.user.email,
    name: (session.user.name?.trim() || session.user.email.split("@")[0]) ?? "Friend",
    image: session.user.image ?? null,
  }

  return ensureUser(acct)
})

export async function requireCurrentUser(): Promise<UserRow> {
  const user = await getCurrentUser()
  if (!user) throw new Error("not_authenticated")
  return user
}

async function ensureUser(acct: SessionAccount): Promise<UserRow> {
  const db = getDb()

  const existing = await findUser(db, acct)
  if (existing) return reconcileSubjectId(db, existing, acct)

  const slug = uniqueSlug(acct.name, acct.authSubjectId)
  const [created] = await db
    .insert(users)
    .values({
      authSubjectId: acct.authSubjectId,
      email: acct.email,
      slug,
      name: acct.name,
      avatarBlobUrl: acct.image ?? null,
    })
    .onConflictDoNothing({ target: users.authSubjectId })
    .returning()
  if (created) return created

  // Lost a race (or hit the email unique constraint via onConflictDoNothing
  // skipping silently). Re-read by either identifier and reconcile.
  const refetched = await findUser(db, acct)
  if (!refetched) throw new Error("failed_to_create_user")
  return reconcileSubjectId(db, refetched, acct)
}

async function findUser(
  db: ReturnType<typeof getDb>,
  acct: SessionAccount,
): Promise<UserRow | undefined> {
  const [row] = await db
    .select()
    .from(users)
    .where(or(eq(users.authSubjectId, acct.authSubjectId), eq(users.email, acct.email)))
    .limit(1)
  return row
}

// Better Auth has just verified the email via OTP, so if we find the row by
// email but its auth_subject_id is stale (e.g. the auth account was recreated
// in dev, or a prior failed sign-up left an orphan row), claim it for the
// current session.
async function reconcileSubjectId(
  db: ReturnType<typeof getDb>,
  row: UserRow,
  acct: SessionAccount,
): Promise<UserRow> {
  if (row.authSubjectId === acct.authSubjectId) return row
  const [updated] = await db
    .update(users)
    .set({ authSubjectId: acct.authSubjectId })
    .where(eq(users.id, row.id))
    .returning()
  return updated ?? row
}

function uniqueSlug(name: string, subject: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "user"
  // Append a short suffix from the auth subject so collisions on the
  // human-readable name don't fail the unique constraint on first sign-in.
  const suffix = subject.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase()
  return `${base}-${suffix}`.slice(0, 64)
}
