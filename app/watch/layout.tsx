import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Watch — Arobid"
}

export default function WatchLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-background">{children}</div>
}
