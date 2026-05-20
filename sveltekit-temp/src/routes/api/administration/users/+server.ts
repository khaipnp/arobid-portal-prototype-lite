import { json } from "@sveltejs/kit"
import { getAdministrationList } from "$lib/administration/list"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url }) => {
  const result = await getAdministrationList({
    entity: "users",
    search: url.searchParams.get("search") ?? "",
    moduleId: url.searchParams.get("moduleId") ?? "all",
    page: url.searchParams.get("page"),
    pageSize: url.searchParams.get("pageSize")
  })

  return json(result)
}
