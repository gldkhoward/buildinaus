import type { SVGProps } from "react"
import { cn } from "@/lib/utils"

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("text-foreground", className)}
      {...props}
    >
      {/* Stylised "A" / arch — nods to the Harbour Bridge */}
      <path
        d="M3 20 L12 4 L21 20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 20 C 7 14, 17 14, 21 20"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="12" cy="20" r="1.25" fill="currentColor" />
    </svg>
  )
}
