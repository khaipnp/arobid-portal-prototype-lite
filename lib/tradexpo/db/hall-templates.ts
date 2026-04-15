import { sql } from "@/lib/db/neon"
import type {
  HallTemplate,
  HallTemplateUsage,
  ModelAsset,
  TranslationRecord,
} from "@/lib/tradexpo/types"

type AssetRow = {
  id: string
  file_name: string
  file_url: string
  kind: ModelAsset["kind"]
  status: ModelAsset["status"]
  created_at: string | Date
}

type HallTemplateRow = {
  id: string
  name: string
  source_blend_asset_id: string | null
  render_glb_asset_id: string
  thumbnail_asset_id: string
  is_public: boolean
  is_active: boolean
  updated_by: string
  updated_at: string | Date
}

type HallTemplateTranslationRow = {
  hall_template_id: string
  language_code: string
  name: string
}

function rowToAsset(row: AssetRow): ModelAsset {
  return {
    id: row.id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    kind: row.kind,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function rowToTemplate(
  row: HallTemplateRow,
  translations: TranslationRecord[],
): HallTemplate {
  return {
    id: row.id,
    name: row.name,
    translations,
    sourceBlendAssetId: row.source_blend_asset_id ?? undefined,
    renderGlbAssetId: row.render_glb_asset_id,
    thumbnailAssetId: row.thumbnail_asset_id,
    isPublic: row.is_public,
    isActive: row.is_active,
    updatedBy: row.updated_by,
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listHallTemplateAssets(): Promise<ModelAsset[]> {
  const rows =
    (await sql`select * from model_assets order by created_at desc`) as AssetRow[]
  return rows.map(rowToAsset)
}

export async function listHallTemplates(): Promise<HallTemplate[]> {
  const templates =
    (await sql`select * from hall_templates order by updated_at desc`) as HallTemplateRow[]
  const translations =
    (await sql`select * from hall_template_translations`) as HallTemplateTranslationRow[]

  const translationsByTemplate = new Map<string, TranslationRecord[]>()
  for (const tr of translations) {
    const list = translationsByTemplate.get(tr.hall_template_id) ?? []
    list.push({ languageCode: tr.language_code, name: tr.name })
    translationsByTemplate.set(tr.hall_template_id, list)
  }

  return templates.map((t) =>
    rowToTemplate(t, translationsByTemplate.get(t.id) ?? []),
  )
}

export async function listHallTemplateUsage(): Promise<HallTemplateUsage[]> {
  const rows = await sql`select * from hall_template_usage`
  return rows.map((r) => ({
    hallTemplateId: r.hall_template_id,
    upcomingExpoCount: r.upcoming_expo_count,
    liveExpoCount: r.live_expo_count,
    archivedExpoCount: r.archived_expo_count,
  }))
}
