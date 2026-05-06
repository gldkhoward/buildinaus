/**
 * Canonical site URL — used by robots, sitemap, OG image absolute URLs,
 * and anywhere else we need a fully-qualified link. Order:
 *
 * 1. NEXT_PUBLIC_SITE_URL (explicit production override)
 * 2. NEXT_PUBLIC_VERCEL_URL (preview / production deployments)
 * 3. http://localhost:3000 (local dev fallback)
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return stripTrailingSlash(explicit)

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL
  if (vercel) return `https://${stripTrailingSlash(vercel)}`

  return "http://localhost:3000"
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "")
}
