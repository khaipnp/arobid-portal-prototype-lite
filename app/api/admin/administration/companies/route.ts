import { NextResponse } from "next/server"
import { listAdminCompanies } from "@/lib/administration/companies"
import { requireRole } from "@/lib/auth/rbac"

export async function GET(request: Request) {
  await requireRole("admin")

  const url = new URL(request.url)
  const result = await listAdminCompanies({
    search: url.searchParams.get("search") ?? "",
    categoryId: url.searchParams.get("categoryId") ?? "all",
    status: url.searchParams.get("status") ?? "all",
    page: url.searchParams.get("page"),
    pageSize: url.searchParams.get("pageSize")
  })

  return NextResponse.json(result)
}
