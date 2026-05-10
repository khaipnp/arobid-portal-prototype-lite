"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db/neon"
import type { HallTemplate, ModelAsset } from "@/lib/tradexpo/types"

const REUPLOAD_UPDATED_BY = "Admin"

type AssetKind = "glb" | "thumbnail" | "blend"

function newAssetId() {
  return `asset-${crypto.randomUUID()}`
}

function placeholderFileUrl(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/360`
}

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

export async function reuploadHallTemplateAsset(
  templateId: string,
  kind: AssetKind
): Promise<{
  asset: ModelAsset
  templateFields: Pick<
    HallTemplate,
    | "renderGlbAssetId"
    | "thumbnailAssetId"
    | "sourceBlendAssetId"
    | "updatedBy"
    | "updatedAt"
  >
}> {
  const ext = kind === "thumbnail" ? "png" : kind === "blend" ? "blend" : "glb"
  const fileName = `re-upload-${kind}.${ext}`
  const assetId = newAssetId()
  const fileUrl = placeholderFileUrl(assetId)

  await sql`
    insert into model_assets (id, file_name, file_url, kind, status, created_at)
    values (${assetId}, ${fileName}, ${fileUrl}, ${kind}, 'pending', now())
  `

  type UpdatedRow = {
    render_glb_asset_id: string
    thumbnail_asset_id: string
    source_blend_asset_id: string | null
    updated_by: string
    updated_at: string | Date
  }
  let updated: UpdatedRow[]
  if (kind === "glb") {
    updated = (await sql`
      update hall_templates
      set
        render_glb_asset_id = ${assetId},
        updated_at = now(),
        updated_by = ${REUPLOAD_UPDATED_BY}
      where id = ${templateId}
      returning render_glb_asset_id, thumbnail_asset_id, source_blend_asset_id, updated_by, updated_at
    `) as UpdatedRow[]
  } else if (kind === "thumbnail") {
    updated = (await sql`
      update hall_templates
      set
        thumbnail_asset_id = ${assetId},
        updated_at = now(),
        updated_by = ${REUPLOAD_UPDATED_BY}
      where id = ${templateId}
      returning render_glb_asset_id, thumbnail_asset_id, source_blend_asset_id, updated_by, updated_at
    `) as UpdatedRow[]
  } else {
    updated = (await sql`
      update hall_templates
      set
        source_blend_asset_id = ${assetId},
        updated_at = now(),
        updated_by = ${REUPLOAD_UPDATED_BY}
      where id = ${templateId}
      returning render_glb_asset_id, thumbnail_asset_id, source_blend_asset_id, updated_by, updated_at
    `) as UpdatedRow[]
  }

  if (updated.length === 0) {
    throw new Error("Hall template not found")
  }

  const row = updated[0]
  revalidatePath("/admin/tradexpo/hall-templates")
  revalidatePath(`/admin/tradexpo/hall-templates/${templateId}`)

  const assetRows = (await sql`
    select id, file_name, file_url, kind, status, created_at
    from model_assets
    where id = ${assetId}
  `) as AssetRow[]

  return {
    asset: rowToAsset(assetRows[0]),
    templateFields: {
      renderGlbAssetId: row.render_glb_asset_id,
      thumbnailAssetId: row.thumbnail_asset_id,
      sourceBlendAssetId: row.source_blend_asset_id ?? undefined,
      updatedBy: row.updated_by,
      updatedAt: new Date(row.updated_at).toISOString()
    }
  }
}

export async function toggleHallTemplatePublic(templateId: string) {
  const rows =
    await sql`update hall_templates set is_public = not is_public, updated_at = now() where id = ${templateId} returning id`
  if (rows.length === 0) {
    throw new Error("Hall template not found")
  }
  revalidatePath("/admin/tradexpo/hall-templates")
  revalidatePath(`/admin/tradexpo/hall-templates/${templateId}`)
}

export async function toggleHallTemplateActive(templateId: string) {
  const rows =
    await sql`update hall_templates set is_active = not is_active, updated_at = now() where id = ${templateId} returning id`
  if (rows.length === 0) {
    throw new Error("Hall template not found")
  }
  revalidatePath("/admin/tradexpo/hall-templates")
  revalidatePath(`/admin/tradexpo/hall-templates/${templateId}`)
}
