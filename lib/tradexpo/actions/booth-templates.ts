"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db/neon"
import { getAssetUrl } from "@/lib/image-utils"
import type { BoothTemplate, ModelAsset } from "@/lib/tradexpo/types"

const REUPLOAD_UPDATED_BY = "Admin"

type AssetKind = "glb" | "thumbnail" | "blend"

function newAssetId() {
  return `asset-${crypto.randomUUID()}`
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

export async function reuploadBoothTemplateAsset(
  templateId: string,
  kind: AssetKind
): Promise<{
  asset: ModelAsset
  templateFields: Pick<
    BoothTemplate,
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
  const fileUrl = getAssetUrl(null, assetId)

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
      update booth_templates
      set
        render_glb_asset_id = ${assetId},
        updated_at = now(),
        updated_by = ${REUPLOAD_UPDATED_BY}
      where id = ${templateId}
      returning render_glb_asset_id, thumbnail_asset_id, source_blend_asset_id, updated_by, updated_at
    `) as UpdatedRow[]
  } else if (kind === "thumbnail") {
    updated = (await sql`
      update booth_templates
      set
        thumbnail_asset_id = ${assetId},
        updated_at = now(),
        updated_by = ${REUPLOAD_UPDATED_BY}
      where id = ${templateId}
      returning render_glb_asset_id, thumbnail_asset_id, source_blend_asset_id, updated_by, updated_at
    `) as UpdatedRow[]
  } else {
    updated = (await sql`
      update booth_templates
      set
        source_blend_asset_id = ${assetId},
        updated_at = now(),
        updated_by = ${REUPLOAD_UPDATED_BY}
      where id = ${templateId}
      returning render_glb_asset_id, thumbnail_asset_id, source_blend_asset_id, updated_by, updated_at
    `) as UpdatedRow[]
  }

  if (updated.length === 0) {
    throw new Error("Booth template not found")
  }

  const row = updated[0]
  revalidatePath("/admin/tradexpo/booth-templates")
  revalidatePath(`/admin/tradexpo/booth-templates/${templateId}`)

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

export async function toggleBoothTemplatePublic(templateId: string) {
  const rows =
    await sql`update booth_templates set is_public = not is_public, updated_at = now() where id = ${templateId} returning id`
  if (rows.length === 0) {
    throw new Error("Booth template not found")
  }
  revalidatePath("/admin/tradexpo/booth-templates")
  revalidatePath(`/admin/tradexpo/booth-templates/${templateId}`)
}

export async function toggleBoothTemplateActive(templateId: string) {
  const rows =
    await sql`update booth_templates set is_active = not is_active, updated_at = now() where id = ${templateId} returning id`
  if (rows.length === 0) {
    throw new Error("Booth template not found")
  }
  revalidatePath("/admin/tradexpo/booth-templates")
  revalidatePath(`/admin/tradexpo/booth-templates/${templateId}`)
}

export async function deleteBoothTemplate(templateId: string) {
  const usageRows = (await sql`
    select upcoming_expo_booth_count, live_expo_booth_count, archived_expo_booth_count
    from booth_template_usage
    where booth_template_id = ${templateId}
  `) as {
    upcoming_expo_booth_count: number
    live_expo_booth_count: number
    archived_expo_booth_count: number
  }[]

  const usage = usageRows[0]
  const totalReferences = usage
    ? usage.upcoming_expo_booth_count +
      usage.live_expo_booth_count +
      usage.archived_expo_booth_count
    : 0

  if (totalReferences > 0) {
    throw new Error(
      "This template is used by one or more expo booths and cannot be deleted."
    )
  }

  await sql`begin`
  try {
    const templateRows = (await sql`
      delete from booth_templates
      where id = ${templateId}
      returning source_blend_asset_id, render_glb_asset_id, thumbnail_asset_id
    `) as {
      source_blend_asset_id: string | null
      render_glb_asset_id: string
      thumbnail_asset_id: string
    }[]

    if (templateRows.length === 0) {
      throw new Error("Booth template not found")
    }

    const assetIds = [
      templateRows[0].source_blend_asset_id,
      templateRows[0].render_glb_asset_id,
      templateRows[0].thumbnail_asset_id
    ].filter((id): id is string => Boolean(id))

    for (const assetId of assetIds) {
      const rows = (await sql`
        select exists (
          select 1 from booth_templates
          where source_blend_asset_id = ${assetId}
             or render_glb_asset_id = ${assetId}
             or thumbnail_asset_id = ${assetId}
        ) as is_used
      `) as { is_used: boolean }[]

      if (!rows[0]?.is_used) {
        await sql`delete from model_assets where id = ${assetId}`
      }
    }

    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }

  revalidatePath("/admin/tradexpo/booth-templates")
  revalidatePath(`/admin/tradexpo/booth-templates/${templateId}`)
}
