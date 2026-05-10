import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { requireAnyRole } from "@/lib/auth/rbac"

export default async function SellerLayout({
  children
}: {
  children: React.ReactNode
}) {
  const userId = await requireAnyRole(["seller", "buyer"])
  const user = await getAuthenticatedUserById(userId)

  return (
    <SidebarProvider>
      <AppSidebar
        portal="seller"
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
