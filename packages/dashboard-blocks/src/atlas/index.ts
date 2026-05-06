import {
  AtlasCallout,
  AtlasFeatureCard,
  AtlasGrid,
  AtlasH1,
  AtlasH2,
  AtlasH3,
  AtlasLink,
  AtlasList,
  AtlasListItem,
  AtlasParagraph,
  AtlasStat,
  AtlasStrong,
} from "./components"

export {
  AtlasCallout,
  AtlasFeatureCard,
  AtlasGrid,
  AtlasH1,
  AtlasH2,
  AtlasH3,
  AtlasLink,
  AtlasList,
  AtlasListItem,
  AtlasParagraph,
  AtlasStat,
  AtlasStrong,
}

/**
 * Component map passed to `@mdx-js/mdx` evaluate via `useMDXComponents`.
 * Standard Markdown elements get atlas-styled equivalents; the named
 * exports (AtlasGrid, AtlasFeatureCard, AtlasStat) are available to the
 * agent if it uses inline MDX.
 *
 * Adding a component is non-breaking: new key here + (optionally) a
 * mention in the agent's system prompt. No DB migration needed since
 * atlas content is stored as Markdown source.
 */
export const atlasComponents = {
  h1: AtlasH1,
  h2: AtlasH2,
  h3: AtlasH3,
  p: AtlasParagraph,
  ul: AtlasList,
  li: AtlasListItem,
  blockquote: AtlasCallout,
  a: AtlasLink,
  strong: AtlasStrong,
  AtlasGrid,
  AtlasFeatureCard,
  AtlasStat,
} as const
