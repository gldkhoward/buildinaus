import { evaluate } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"
import { atlasComponents } from "@buildinaus/dashboard-blocks"
import { cacheLife, cacheTag } from "next/cache"
import type { ReactElement } from "react"
import type { AtlasSection } from "@buildinaus/database"

/**
 * Compile a prose atlas section's Markdown into a React tree using the
 * atlas component catalog. Result is cached at the Cache Components
 * layer (sub-ms hits, weeks-long TTL); section edits invalidate via
 * `revalidateTag('atlas:${citySlug}:${slug}')`.
 *
 * List sections render from `atlas_entries` rather than this path.
 */
export async function renderProseSection(
  section: AtlasSection,
): Promise<ReactElement> {
  "use cache"
  cacheLife("weeks")
  cacheTag(
    "atlas",
    `atlas:${section.citySlug}`,
    `atlas:${section.citySlug}:${section.slug}`,
  )

  if (section.kind !== "prose" || !section.contentMd) {
    throw new Error(
      `renderProseSection called on non-prose section ${section.id} (kind=${section.kind})`,
    )
  }

  const { default: Content } = await evaluate(section.contentMd, {
    ...(runtime as Parameters<typeof evaluate>[1]),
    useMDXComponents: () =>
      atlasComponents as unknown as Parameters<
        typeof evaluate
      >[1]["useMDXComponents"] extends () => infer T
        ? T
        : never,
  })

  return <Content />
}
