import { getAdministrationList } from "$lib/administration/list"
import { ensurePlatformSchema } from "$lib/platform/ensure-schema"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async () => {
  await ensurePlatformSchema()
  const initialData = await getAdministrationList({
    entity: "users",
    pageSize: 20
  })

  return { initialData }
}
