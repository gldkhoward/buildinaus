import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Stylised Harbour Bridge silhouette used as a hero motif.
 * Single-stroke SVG so it inherits currentColor for theming.
 */
export function SydneyBridge({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 800 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("text-foreground/40", className)}
      {...props}
    >
      <path d="M0 160 H800" />
      <path d="M120 160 V120" />
      <path d="M680 160 V120" />
      <path d="M120 120 Q400 -40 680 120" />
      <path d="M120 120 H680" />
      <path d="M180 120 V160 M240 120 V160 M300 120 V160 M360 120 V160 M440 120 V160 M500 120 V160 M560 120 V160 M620 120 V160" />
      <path d="M380 60 V40 M380 40 H420 M420 40 V60" />
    </svg>
  )
}
