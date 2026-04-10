import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar portal="partner" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
