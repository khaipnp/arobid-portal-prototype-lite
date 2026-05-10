import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { requireRole } from "@/lib/auth/rbac"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const userId = await requireRole("admin")
  const user = await getAuthenticatedUserById(userId)

  return (
    <SidebarProvider>
      <AppSidebar
        portal="admin"
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
