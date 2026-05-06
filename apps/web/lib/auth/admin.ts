import { redirect } from "next/navigation"
import { getCurrentUser } from "./current-user"

/**
 * Admin gate. Reads the comma-separated `ADMIN_EMAILS` env var — anything
 * not listed redirects to /me. Cheap, env-driven, and good enough for the
 * pitch demo. When we move to multi-admin we'll add a dedicated `users.role`
 * value or a separate join table.
 */
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in?next=/admin/queue")

  const allowList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (allowList.length === 0) {
    // No allow-list configured — refuse, don't fail-open. Surfaces the
    // misconfiguration during the demo rather than silently leaking the
    // queue.
    redirect("/me")
  }

  if (!allowList.includes(user.email.toLowerCase())) redirect("/me")

  return user
}
