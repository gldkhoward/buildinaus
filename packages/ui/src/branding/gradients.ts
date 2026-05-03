/**
 * Shared "Vercel x Australia" gradient tokens.
 * Used for hero backgrounds, hover treatments, and accent surfaces.
 */
export const gradients = {
  harbourDawn:
    "linear-gradient(135deg, oklch(0.18 0.05 260) 0%, oklch(0.32 0.12 25) 60%, oklch(0.55 0.18 50) 100%)",
  outbackDusk:
    "linear-gradient(180deg, oklch(0.22 0.07 30) 0%, oklch(0.45 0.16 35) 100%)",
  reefLine:
    "linear-gradient(90deg, oklch(0.55 0.18 200) 0%, oklch(0.65 0.18 180) 100%)",
} as const

export type GradientToken = keyof typeof gradients
