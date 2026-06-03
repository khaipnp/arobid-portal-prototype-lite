import { TenantLandingPage } from "@/components/tenant/landing"
import { getLatestPublishedPartnerMiniSite } from "@/lib/partner/db"

export const dynamic = "force-dynamic"

export default async function Page() {
  const miniSite = await getLatestPublishedPartnerMiniSite()
  return <TenantLandingPage miniSiteContent={miniSite?.content ?? null} />
}
