import type { SVGProps } from "react"

/**
 * Minimalist linework illustration of the Sydney skyline:
 * the Harbour Bridge arch on the left, Opera House shells on the right,
 * with a thin water line and a few skyscrapers behind.
 *
 * Rendered with slate-700 strokes so it sits quietly behind hero content.
 */
export function SydneyLinework(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 1440 360"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Water line */}
      <line x1="0" y1="300" x2="1440" y2="300" strokeWidth="1" opacity="0.6" />
      <line x1="0" y1="312" x2="1440" y2="312" strokeWidth="1" opacity="0.25" strokeDasharray="2 8" />

      {/* Distant city skyline behind */}
      <g strokeWidth="1" opacity="0.55">
        <path d="M520 300 L520 250 L538 250 L538 232 L556 232 L556 252 L572 252 L572 240 L590 240 L590 258 L608 258 L608 246 L624 246 L624 268 L642 268 L642 254 L660 254 L660 272 L676 272 L676 260 L694 260 L694 278 L710 278 L710 268 L728 268 L728 282 L746 282 L746 270 L762 270 L762 286 L780 286 L780 276 L798 276 L798 290 L816 290 L816 280 L834 280 L834 292 L852 292 L852 300" />
        {/* Antennae */}
        <line x1="556" y1="232" x2="556" y2="220" />
        <line x1="624" y1="246" x2="624" y2="232" />
        <line x1="694" y1="260" x2="694" y2="246" />
      </g>

      {/* Sydney Harbour Bridge — left */}
      <g strokeWidth="1.25">
        {/* Pylons */}
        <rect x="86" y="208" width="22" height="92" />
        <rect x="86" y="200" width="22" height="10" />
        <rect x="430" y="208" width="22" height="92" />
        <rect x="430" y="200" width="22" height="10" />

        {/* Main arch */}
        <path d="M97 270 C 160 110, 380 110, 441 270" />
        {/* Inner arch */}
        <path d="M97 270 C 165 145, 375 145, 441 270" opacity="0.85" />

        {/* Deck */}
        <line x1="60" y1="270" x2="478" y2="270" />
        <line x1="60" y1="278" x2="478" y2="278" opacity="0.6" />

        {/* Vertical hangers from deck up to inner arch */}
        <g opacity="0.7">
          <line x1="135" y1="270" x2="135" y2="206" />
          <line x1="165" y1="270" x2="165" y2="186" />
          <line x1="195" y1="270" x2="195" y2="170" />
          <line x1="225" y1="270" x2="225" y2="160" />
          <line x1="255" y1="270" x2="255" y2="155" />
          <line x1="285" y1="270" x2="285" y2="155" />
          <line x1="315" y1="270" x2="315" y2="160" />
          <line x1="345" y1="270" x2="345" y2="170" />
          <line x1="375" y1="270" x2="375" y2="186" />
          <line x1="405" y1="270" x2="405" y2="206" />
        </g>

        {/* Diagonal cross-bracing in deck */}
        <g opacity="0.4" strokeWidth="0.75">
          <line x1="60" y1="270" x2="478" y2="278" />
          <line x1="60" y1="278" x2="478" y2="270" />
        </g>

        {/* Flag pole */}
        <line x1="269" y1="155" x2="269" y2="135" strokeWidth="0.75" />
        <path d="M269 135 L283 138 L269 142 Z" strokeWidth="0.75" />
      </g>

      {/* Connecting waterfront line */}
      <line x1="478" y1="300" x2="900" y2="300" strokeWidth="1" opacity="0.6" />

      {/* Sydney Opera House — right */}
      <g strokeWidth="1.25" transform="translate(880, 0)">
        {/* Platform */}
        <line x1="0" y1="300" x2="440" y2="300" />
        <line x1="20" y1="288" x2="420" y2="288" opacity="0.7" />
        <line x1="20" y1="288" x2="20" y2="300" opacity="0.7" />
        <line x1="420" y1="288" x2="420" y2="300" opacity="0.7" />

        {/* Left cluster of shells (3) */}
        <g>
          <path d="M40 288 Q 70 170, 130 288" />
          <path d="M70 288 Q 110 195, 170 288" opacity="0.9" />
          <path d="M110 288 Q 150 215, 200 288" opacity="0.85" />
          {/* Shell ridge details */}
          <path d="M70 230 Q 90 215, 110 222" opacity="0.5" strokeWidth="0.75" />
          <path d="M110 245 Q 135 230, 155 240" opacity="0.5" strokeWidth="0.75" />
        </g>

        {/* Small connecting shell */}
        <path d="M205 288 Q 225 250, 248 288" opacity="0.7" />

        {/* Right cluster of shells (3) */}
        <g>
          <path d="M250 288 Q 290 200, 345 288" opacity="0.85" />
          <path d="M285 288 Q 325 180, 380 288" opacity="0.9" />
          <path d="M320 288 Q 360 200, 410 288" />
          {/* Shell ridge details */}
          <path d="M295 230 Q 315 215, 335 222" opacity="0.5" strokeWidth="0.75" />
          <path d="M335 240 Q 360 225, 380 235" opacity="0.5" strokeWidth="0.75" />
        </g>

        {/* Tiny back shell */}
        <path d="M395 288 Q 410 260, 425 288" opacity="0.55" strokeWidth="0.9" />
      </g>

      {/* A solitary sailboat between bridge and opera house */}
      <g strokeWidth="1" opacity="0.7" transform="translate(700, 268)">
        <path d="M0 28 L40 28 L34 34 L6 34 Z" />
        <line x1="20" y1="28" x2="20" y2="6" />
        <path d="M20 8 L34 28 L20 28 Z" />
      </g>
    </svg>
  )
}
