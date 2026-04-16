import type {
  AssetKind,
  AssetStatus,
  BoothTemplate,
  ExpoTimelinePhase,
  HallTemplate,
  ModelAsset,
  TemplateDerivedStatus,
  TranslationRecord,
} from "@/lib/tradexpo/types"

export const GLB_ACCEPT = [".glb"]
export const BLEND_ACCEPT = [".blend"]
export const THUMBNAIL_ACCEPT = [".jpg", ".jpeg", ".png", ".webp"]

export function createMockId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function getTranslationName(
  fallbackName: string,
  translations: TranslationRecord[],
  locale: string,
) {
  const shortLocale = locale.toLowerCase().split("-")[0]
  const translated = translations.find(
    (item) => item.languageCode.toLowerCase() === shortLocale,
  )
  return translated?.name || fallbackName
}

export function getAssetMap(assets: ModelAsset[]) {
  return Object.fromEntries(assets.map((asset) => [asset.id, asset]))
}

function getRequiredAssetStatuses(
  assets: Record<string, ModelAsset | undefined>,
  glbAssetId: string,
  thumbnailAssetId: string,
) {
  return [assets[glbAssetId]?.status, assets[thumbnailAssetId]?.status]
}

function hasStatus(
  statuses: Array<AssetStatus | undefined>,
  status: AssetStatus,
) {
  return statuses.some((item) => item === status)
}

export function getHallTemplateStatus(
  template: HallTemplate,
  assets: Record<string, ModelAsset | undefined>,
): TemplateDerivedStatus {
  if (!template.isActive) {
    return "Inactive"
  }

  const statuses = getRequiredAssetStatuses(
    assets,
    template.renderGlbAssetId,
    template.thumbnailAssetId,
  )

  if (hasStatus(statuses, "failed")) {
    return "Failed"
  }

  if (hasStatus(statuses, "pending") || hasStatus(statuses, "processing")) {
    return "Processing"
  }

  if (!template.isPublic) {
    return "Draft"
  }

  return "Published"
}

export function getBoothTemplateStatus(
  template: BoothTemplate,
  assets: Record<string, ModelAsset | undefined>,
): TemplateDerivedStatus {
  if (!template.isActive) {
    return "Inactive"
  }

  const statuses = getRequiredAssetStatuses(
    assets,
    template.renderGlbAssetId,
    template.thumbnailAssetId,
  )

  if (hasStatus(statuses, "failed")) {
    return "Failed"
  }

  if (hasStatus(statuses, "pending") || hasStatus(statuses, "processing")) {
    return "Processing"
  }

  if (!template.isPublic) {
    return "Draft"
  }

  return "Published"
}

export function canPublish(
  template: Pick<
    HallTemplate | BoothTemplate,
    "renderGlbAssetId" | "thumbnailAssetId"
  >,
  assets: Record<string, ModelAsset | undefined>,
) {
  const glbStatus = assets[template.renderGlbAssetId]?.status
  const thumbnailStatus = assets[template.thumbnailAssetId]?.status
  return glbStatus === "ready" && thumbnailStatus === "ready"
}

export function parseMetadataInput(input: string) {
  const pairs = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const result: Record<string, string> = {}

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split(":")
    const value = valueParts.join(":").trim()

    if (!key?.trim()) {
      continue
    }

    result[key.trim()] = value
  }

  return result
}

export function serializeMetadata(metadata: Record<string, string>) {
  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")
}

export function isValidFileName(fileName: string, kind: AssetKind) {
  const lower = fileName.toLowerCase()

  if (kind === "glb") {
    return GLB_ACCEPT.some((ext) => lower.endsWith(ext))
  }

  if (kind === "blend") {
    return BLEND_ACCEPT.some((ext) => lower.endsWith(ext))
  }

  return THUMBNAIL_ACCEPT.some((ext) => lower.endsWith(ext))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

/** Lazy-evaluated timeline phase from start/end vs current time (US-02). */
export function getExpoTimelinePhase(
  nowMs: number,
  startAtIso: string,
  endAtIso: string,
): ExpoTimelinePhase {
  const start = new Date(startAtIso).getTime()
  const end = new Date(endAtIso).getTime()
  if (nowMs < start) return "Upcoming"
  if (nowMs > end) return "Archived"
  return "Live"
}
