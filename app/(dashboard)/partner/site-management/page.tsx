import { PartnerSiteManagementManager } from "@/components/partner/partner-site-management-manager";
import { DashboardShell } from "@/components/tradexpo/dashboard-shell";
import { requireRole } from "@/lib/auth/rbac";
import { requirePartnerModule } from "@/lib/partner/access";
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema";

export const dynamic = "force-dynamic";

export default async function PartnerSiteManagementPage() {
  await ensurePlatformSchema();
  const userId = await requireRole("partner");
  const access = await requirePartnerModule(userId, "mini_site");

  return (
    <DashboardShell
      title="Mini-Site Management"
      description="Configure the tenant homepage branding, sections, partners, and sponsors in a local preview workspace."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Mini-Site Management" },
      ]}
    >
      <PartnerSiteManagementManager access={access} />
    </DashboardShell>
  );
}
