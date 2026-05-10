import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireRole } from "@/lib/auth/rbac"

export default async function PartnerLayout({
  children
}: {
  children: React.ReactNode
}) {
  await requireRole("exhibitor")

  return (
    <SidebarProvider>
      <AppSidebar portal="partner" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
