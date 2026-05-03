import type { Config } from "tailwindcss"

/**
 * Shared Tailwind v4 preset.
 * Tailwind v4 prefers CSS-driven config via @theme, but a JS preset is still
 * useful for sharing content globs and plugin lists across apps.
 */
const preset: Partial<Config> = {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default preset
