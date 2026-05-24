/** @type {import('next').NextConfig} */
const r2PublicHostname = process.env.R2_PUBLIC_DOMAIN
  ? process.env.R2_PUBLIC_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "")
  : ""

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos"
      },
      {
        protocol: "https",
        hostname: "*.r2.dev"
      },
      {
        protocol: "https",
        hostname: r2PublicHostname
      }
    ].filter((pattern) => pattern.hostname !== "")
  },
  async rewrites() {
    return [
      {
        source: "/tradexpo/expos/:path*",
        destination: "/expos/:path*"
      }
    ]
  }
}

export default nextConfig
