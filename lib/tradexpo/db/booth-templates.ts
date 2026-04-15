import { sql } from "@/lib/db/neon"
import type {
  BoothTemplate,
  BoothTemplateUsage,
  BoothType,
  TranslationRecord,
} from "@/lib/tradexpo/types"

type BoothTemplateRow = {
  id: string
  name: string
  booth_type_id: string
  source_blend_asset_id: string | null
  render_glb_asset_id: string
  thumbnail_asset_id: string
  description: string
  is_public: boolean
  is_active: boolean
  updated_by: string
  updated_at: string | Date
}

type BoothTemplateTranslationRow = {
  booth_template_id: string
  language_code: string
  name: string
}

function rowToTemplate(
  row: BoothTemplateRow,
  translations: TranslationRecord[],
): BoothTemplate {
  return {
    id: row.id,
    name: row.name,
    translations,
    boothTypeId: row.booth_type_id,
    sourceBlendAssetId: row.source_blend_asset_id ?? undefined,
    renderGlbAssetId: row.render_glb_asset_id,
    thumbnailAssetId: row.thumbnail_asset_id,
    description: row.description,
    isPublic: row.is_public,
    isActive: row.is_active,
    updatedBy: row.updated_by,
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listBoothTypes(): Promise<BoothType[]> {
  const rows = await sql`select * from booth_types order by name asc`
  return rows.map((r) => ({ id: r.id, name: r.name }))
}

export async function listBoothTemplates(): Promise<BoothTemplate[]> {
  const templates =
    (await sql`select * from booth_templates order by updated_at desc`) as BoothTemplateRow[]
  const translations =
    (await sql`select * from booth_template_translations`) as BoothTemplateTranslationRow[]

  const translationsByTemplate = new Map<string, TranslationRecord[]>()
  for (const tr of translations) {
    const list = translationsByTemplate.get(tr.booth_template_id) ?? []
    list.push({ languageCode: tr.language_code, name: tr.name })
    translationsByTemplate.set(tr.booth_template_id, list)
  }

  return templates.map((t) =>
    rowToTemplate(t, translationsByTemplate.get(t.id) ?? []),
  )
}

export async function listBoothTemplateUsage(): Promise<BoothTemplateUsage[]> {
  const rows = await sql`select * from booth_template_usage`
  return rows.map((r) => ({
    boothTemplateId: r.booth_template_id,
    upcomingExpoBoothCount: r.upcoming_expo_booth_count,
    liveExpoBoothCount: r.live_expo_booth_count,
    archivedExpoBoothCount: r.archived_expo_booth_count,
  }))
}
