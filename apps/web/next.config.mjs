import { withWorkflow } from "workflow/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  transpilePackages: [
    "@buildinaus/ui",
    "@buildinaus/dashboard-blocks",
    "@buildinaus/agent-engine",
    "@buildinaus/database",
    "@buildinaus/types",
  ],
  experimental: {
    // Tree-shake huge icon barrels — saves ~300KB on the client bundle.
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // Vercel Blob is the canonical store for company logos, founder avatars,
    // and event covers. Keep this list narrow — every host added here is
    // surface area for arbitrary downstream image fetches.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
  },
}

export default withWorkflow(nextConfig)
