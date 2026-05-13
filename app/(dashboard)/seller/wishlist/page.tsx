import { WishlistPageContent } from "@/components/seller/wishlist-page-content"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireAnyRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { listWishlistItems } from "@/lib/wishlist/db"

export const dynamic = "force-dynamic"

export default async function SellerWishlistPage() {
  await ensurePlatformSchema()
  const userId = await requireAnyRole(["seller", "buyer"])
  const items = await listWishlistItems(userId)

  return (
    <DashboardShell
      title="Wishlist"
      description="Review exhibitors you saved from public Expo pages."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Wishlist" }
      ]}
    >
      <WishlistPageContent initialItems={items} />
    </DashboardShell>
  )
}
