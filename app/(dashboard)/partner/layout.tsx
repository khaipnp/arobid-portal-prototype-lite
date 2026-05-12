import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireRole } from "@/lib/auth/rbac"
import { getAuthenticatedUserById } from "@/lib/auth/service"

export default async function PartnerLayout({
  children
}: {
  children: React.ReactNode
}) {
  const userId = await requireRole("partner")
  const user = await getAuthenticatedUserById(userId)

  return (
    <SidebarProvider>
      <AppSidebar
        portal="partner"
        user={{
          name: user?.name ?? "User",
          email: user?.email ?? "",
          avatar: "/avatar.webp",
          roles: user?.roles ?? []
        }}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
