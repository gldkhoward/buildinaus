/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@buildinaus/ui",
    "@buildinaus/dashboard-blocks",
    "@buildinaus/agent-engine",
    "@buildinaus/database",
    "@buildinaus/types",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
