import { notFound } from "next/navigation"
import { ProductManagement } from "@/components/seller/product-management"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { requireAnyRole } from "@/lib/auth/rbac"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { listCompanyProducts } from "@/lib/tradexpo/db/products"

export default async function SellerProductsPage() {
  const userId = await requireAnyRole(["seller", "exhibitor"])
  const user = await getAuthenticatedUserById(userId)

  if (!user?.companyId) {
    notFound()
  }

  const products = await listCompanyProducts(user.companyId)

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/seller">Workspace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Product Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ProductManagement initialProducts={products} />
      </div>
    </>
  )
}
