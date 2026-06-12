import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireRole } from "@/lib/auth/rbac"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { getPartnerAccess } from "@/lib/partner/access"

export default async function PartnerLayout({
  children
}: {
  children: React.ReactNode
}) {
  const userId = await requireRole("partner")

  return (
    <SidebarProvider>
      <Suspense fallback={<PartnerSidebarFallback />}>
        <PartnerSidebar userId={userId} />
      </Suspense>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

async function PartnerSidebar({ userId }: { userId: string }) {
  const [user, partnerAccess] = await Promise.all([
    getAuthenticatedUserById(userId),
    getPartnerAccess(userId)
  ])

  return (
    <AppSidebar
      portal="partner"
      partnerAccess={partnerAccess}
      user={{
        name: user?.name ?? "User",
        email: user?.email ?? "",
        avatar: "/avatar.webp",
        roles: user?.roles ?? []
      }}
    />
  )
}

function PartnerSidebarFallback() {
  return (
    <aside
      className="hidden h-svh w-(--sidebar-width) shrink-0 border-r bg-sidebar md:block"
      aria-hidden="true"
    />
  )
}
