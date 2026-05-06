/**
 * Vercel Blob helpers — the storage layer for user-visible images plus the
 * forensic raw-HTML snapshots from each scrape.
 *
 * Path convention:
 *   <entity-plural>/<id-or-slug>/<asset>[-<random>]
 *   scrapes/<sha256(url)>/raw.html         (content-addressed, no random)
 *
 * Every Blob URL column on the schema has a paired `*_pathname` column —
 * `del(pathname)` works without re-parsing the URL when an entity is rejected
 * or replaced.
 */

import { put, del, type PutBlobResult } from "@vercel/blob"

/** Public asset — small, browser-cacheable, suffix-randomised for cache busting. */
export async function putAsset(
  pathname: string,
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType?: string,
): Promise<PutBlobResult> {
  // `@vercel/blob` `PutBody` accepts Buffer but not plain Uint8Array; promote
  // it via Buffer.from when needed (Node runtime; this lib is server-only).
  const body =
    data instanceof Uint8Array && !(data instanceof Buffer)
      ? Buffer.from(data)
      : data
  return put(pathname, body, {
    access: "public",
    addRandomSuffix: true,
    contentType,
    // No `cacheControlMaxAge` override — Vercel's default (1 year for public
    // blobs with addRandomSuffix) is what we want.
  })
}

/**
 * Content-addressed scrape snapshot. Stable pathname per content hash so
 * dedup works across runs that scraped the same page.
 */
export async function putHtmlSnapshot(
  contentHash: string,
  html: string,
): Promise<PutBlobResult> {
  return put(`scrapes/${contentHash}/raw.html`, html, {
    access: "public",
    addRandomSuffix: false,
    contentType: "text/html; charset=utf-8",
    allowOverwrite: true,
  })
}

/**
 * Best-effort delete by pathname. Used by promote()/reject() flows when the
 * agent re-scrapes and supersedes an old snapshot.
 */
export async function deleteBlobByPathname(pathname: string): Promise<void> {
  try {
    await del(pathname)
  } catch (err) {
    console.warn("[blob] delete failed", { pathname, err })
  }
}
