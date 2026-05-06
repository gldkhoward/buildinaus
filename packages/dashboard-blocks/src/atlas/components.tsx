import type { ComponentPropsWithoutRef, ReactNode } from "react"

/**
 * Atlas component catalog.
 *
 * The agent emits standard Markdown; the MDX compiler in
 * `apps/web/lib/atlas/compile.tsx` maps standard tags (h1-h3, p, ul, li, …)
 * to these atlas-styled components via the `useMDXComponents` hook. This
 * keeps the agent's contract minimal (it only writes Markdown) while
 * giving us a single place to evolve atlas typography / layout.
 *
 * Optional MDX components (AtlasGrid, AtlasFeatureCard, …) can be invoked
 * by name from inside MDX once the agent is trained on the catalog.
 */

/* ── Block-level (mapped from standard MD tags) ───────────────────────── */

export function AtlasH1({
  children,
  ...rest
}: ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
      {...rest}
    >
      {children}
    </h1>
  )
}

export function AtlasH2({
  children,
  ...rest
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className="mt-10 scroll-mt-24 text-xl font-medium tracking-tight text-foreground md:text-2xl"
      {...rest}
    >
      {children}
    </h2>
  )
}

export function AtlasH3({
  children,
  ...rest
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className="mt-6 text-base font-medium tracking-tight text-foreground"
      {...rest}
    >
      {children}
    </h3>
  )
}

export function AtlasParagraph({
  children,
  ...rest
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p className="mt-4 text-base leading-7 text-muted-foreground" {...rest}>
      {children}
    </p>
  )
}

export function AtlasList({
  children,
  ...rest
}: ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      className="mt-4 space-y-2 border-l border-border/60 pl-4 text-sm text-muted-foreground"
      {...rest}
    >
      {children}
    </ul>
  )
}

export function AtlasListItem({
  children,
  ...rest
}: ComponentPropsWithoutRef<"li">) {
  return (
    <li className="leading-6" {...rest}>
      {children}
    </li>
  )
}

export function AtlasCallout({
  children,
  ...rest
}: ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote
      className="mt-6 rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
      {...rest}
    >
      {children}
    </blockquote>
  )
}

export function AtlasLink({
  children,
  className,
  ...rest
}: ComponentPropsWithoutRef<"a">) {
  return (
    <a
      className={
        "underline-offset-4 hover:underline " + (className ?? "text-foreground")
      }
      {...rest}
    >
      {children}
    </a>
  )
}

export function AtlasStrong({
  children,
  ...rest
}: ComponentPropsWithoutRef<"strong">) {
  return (
    <strong className="font-medium text-foreground" {...rest}>
      {children}
    </strong>
  )
}

/* ── Optional MDX components (agent invokes by name) ─────────────────── */

export interface AtlasGridProps {
  children: ReactNode
  cols?: 2 | 3 | 4
}

export function AtlasGrid({ children, cols = 3 }: AtlasGridProps) {
  const gridClass =
    cols === 2
      ? "md:grid-cols-2"
      : cols === 4
        ? "md:grid-cols-4"
        : "md:grid-cols-3"
  return (
    <div className={`mt-6 grid grid-cols-1 gap-3 ${gridClass}`}>{children}</div>
  )
}

export interface AtlasFeatureCardProps {
  title: string
  href?: string
  children: ReactNode
}

export function AtlasFeatureCard({
  title,
  href,
  children,
}: AtlasFeatureCardProps) {
  const inner = (
    <div className="rounded-md border border-border/60 bg-background p-4 text-sm transition hover:border-border">
      <div className="text-base font-medium tracking-tight text-foreground">
        {title}
      </div>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </div>
  )
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  )
}

export interface AtlasStatProps {
  label: string
  value: string
}

export function AtlasStat({ label, value }: AtlasStatProps) {
  return (
    <div className="rounded-md border border-border/60 bg-background p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-medium tabular-nums tracking-tight text-foreground">
        {value}
      </div>
    </div>
  )
}
