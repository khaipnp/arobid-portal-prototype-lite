import { BannerAdsManagement } from "@/components/banner-ads/banner-ads-management"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdminBannerAdsPage() {
  return (
    <DashboardShell
      title="Banner Ads"
      description="Manage fixed banner placements, upload banner inventory, and control display rule and switch timing for each page position."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings" },
        { label: "Banner Ads" }
      ]}
    >
      <BannerAdsManagement />
    </DashboardShell>
  )
}
