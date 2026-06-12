import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { CURRENT_USER_PROFILE } from "@/lib/user/current-user"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const isLocalPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.ADMIN_PREVIEW_NO_DATABASE === "true" &&
    !process.env.DATABASE_URL

  const user = isLocalPreview
    ? {
        ...CURRENT_USER_PROFILE,
        roles: ["sys_admin", "admin", "partner", "seller", "buyer"]
      }
    : await (async () => {
        const [{ requireRole }, { getAuthenticatedUserById }] =
          await Promise.all([
            import("@/lib/auth/rbac"),
            import("@/lib/auth/service")
          ])
        const userId = await requireRole("admin")
        return getAuthenticatedUserById(userId)
      })()

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
