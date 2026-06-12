import { SiteContentBuilder } from "@/components/admin/site-content-builder"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdminSiteContentBuilderPage() {
  return (
    <DashboardShell
      title="Site Content Builder"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings" },
        { label: "Site Content Builder" }
      ]}
    >
      <SiteContentBuilder />
    </DashboardShell>
  )
}
