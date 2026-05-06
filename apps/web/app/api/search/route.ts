import { NextResponse } from "next/server"
import { searchAll } from "@/lib/data/search"
import { type SearchKind } from "@/lib/search"

const ALLOWED_KINDS: SearchKind[] = ["company", "founder", "job", "event"]

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = (url.searchParams.get("q") ?? "").trim()
  const kindParam = url.searchParams.get("kind")
  const kind = kindParam && (ALLOWED_KINDS as string[]).includes(kindParam)
    ? (kindParam as SearchKind)
    : null
  const limitParam = Number(url.searchParams.get("limit"))
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(limitParam, 50)
    : 6

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  const results = await searchAll(q, { kind, limit })
  return NextResponse.json(
    { results },
    {
      headers: {
        // Brief edge cache so rapid keystroke variants don't all hit the DB.
        "Cache-Control": "public, max-age=10, s-maxage=10, stale-while-revalidate=30",
      },
    },
  )
}
