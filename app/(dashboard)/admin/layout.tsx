import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireRole } from "@/lib/auth/rbac"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole("admin")

  return (
    <SidebarProvider>
      <AppSidebar portal="admin" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
