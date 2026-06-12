import type { Metadata } from "next"
import { MarketplaceHome } from "@/components/marketplace/marketplace-home"

export const metadata: Metadata = {
  title: "Arobid Marketplace",
  description:
    "AI-powered B2B marketplace for verified products, suppliers and trade opportunities."
}

export default function MarketplacePage() {
  return <MarketplaceHome />
}
