"use server"

import { revalidatePath } from "next/cache"
import { sql } from "$lib/db/neon"
import type { ModelAsset } from "$lib/tradexpo/types"

type AssetRow = {
  id: string
  file_name: string
  file_url: string
  kind: ModelAsset["kind"]
  status: ModelAsset["status"]
  created_at: string | Date
}

function rowToAsset(row: AssetRow): ModelAsset {
  return {
    id: row.id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    kind: row.kind,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString()
  }
}

export type TemplateRevalidateScope =
  | { type: "hall"; templateId: string }
  | { type: "booth"; templateId: string }

function revalidateForScope(scope: TemplateRevalidateScope) {
  if (scope.type === "hall") {
    revalidatePath("/admin/tradexpo/hall-templates")
    revalidatePath(`/admin/tradexpo/hall-templates/${scope.templateId}`)
  } else {
    revalidatePath("/admin/tradexpo/booth-templates")
    revalidatePath(`/admin/tradexpo/booth-templates/${scope.templateId}`)
  }
}

export async function updateModelAssetStatus(
  assetId: string,
  status: ModelAsset["status"],
  scope: TemplateRevalidateScope
): Promise<ModelAsset> {
  const rows = (await sql`
    update model_assets
    set status = ${status}
    where id = ${assetId}
    returning id, file_name, file_url, kind, status, created_at
  `) as AssetRow[]
  if (rows.length === 0) {
    throw new Error("Asset not found")
  }
  revalidateForScope(scope)
  return rowToAsset(rows[0])
}
