/** @type {import('next').NextConfig} */
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
        hostname: process.env.R2_PUBLIC_DOMAIN || ""
      }
    ].filter((pattern) => pattern.hostname !== "")
  }
}

export default nextConfig
