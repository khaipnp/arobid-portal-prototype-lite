import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireRole } from "@/lib/auth/rbac"

export default async function SellerLayout({
  children
}: {
  children: React.ReactNode
}) {
  await requireRole("seller")

  return (
    <SidebarProvider>
      <AppSidebar portal="seller" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
