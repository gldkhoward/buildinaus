/**
 * Whitelist a `?next=` redirect target before pushing to the router.
 *
 * Open-redirect prevention: only return the value if it's a same-origin
 * absolute path (`/foo`, optionally with `?...` and `#...`). Anything
 * with a scheme, protocol-relative `//host`, or `\` returns `null`.
 *
 * Used by /sign-in and /sign-up to honor the page that bounced the user
 * to auth (e.g. /me/curated, /founders/[slug]/claim).
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith("/")) return null
  // Block protocol-relative URLs and Windows-style backslash paths.
  if (value.startsWith("//") || value.startsWith("/\\")) return null
  return value
}
