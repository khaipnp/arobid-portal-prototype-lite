import { NextResponse } from "next/server"
import {
  type AdministrationEntity,
  getAdministrationList,
} from "@/lib/administration/list"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params
  if (
    entity !== "modules" &&
    entity !== "roles" &&
    entity !== "features" &&
    entity !== "permissions"
  ) {
    return NextResponse.json({ error: "Entity not found." }, { status: 404 })
  }

  const url = new URL(request.url)
  const search = url.searchParams.get("search") ?? ""
  const moduleId = url.searchParams.get("moduleId") ?? "all"
  const result = getAdministrationList({
    entity: entity as AdministrationEntity,
    search,
    moduleId,
    page: url.searchParams.get("page"),
    pageSize: url.searchParams.get("pageSize"),
  })

  return NextResponse.json(result)
}
