import * as React from "react"

/**
 * Shared layout for opengraph-image responses. The image route handlers
 * pass the image dimensions and the page-specific copy; this component
 * keeps the brand consistent across every social card.
 *
 * Tailwind classes don't work here — `next/og` only understands inline
 * style. Keep visuals simple: solid background + accent stripe + type.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = "image/png" as const

interface OgCardProps {
  eyebrow?: string
  title: string
  subtitle?: string
}

export function OgCard({ eyebrow, title, subtitle }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #111714 50%, #0a0a0a 100%)",
        color: "#f5f5f4",
        padding: 72,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Mark />
        <span
          style={{
            fontSize: 28,
            letterSpacing: -0.4,
            fontWeight: 500,
          }}
        >
          BuildinAus
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxWidth: 980,
        }}
      >
        {eyebrow && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.06)",
              fontSize: 18,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "rgba(245,245,244,0.72)",
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            fontSize: title.length > 64 ? 64 : 80,
            lineHeight: 1.05,
            letterSpacing: -1.6,
            fontWeight: 500,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(245,245,244,0.72)",
              maxWidth: 920,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 18,
          color: "rgba(245,245,244,0.55)",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        <span>buildinaus.dev</span>
        <span>The Australian startup ecosystem</span>
      </div>
    </div>
  )
}

function Mark() {
  return (
    <div
      style={{
        display: "flex",
        width: 36,
        height: 36,
        borderRadius: 8,
        background:
          "linear-gradient(140deg, oklch(0.78 0.16 150 / 0.9), oklch(0.78 0.14 80 / 0.85))",
      }}
    />
  )
}
