export type AssetStatus = "pending" | "processing" | "ready" | "failed"

export type AssetKind = "blend" | "glb" | "thumbnail"

export interface ModelAsset {
  id: string
  fileName: string
  fileUrl: string
  kind: AssetKind
  status: AssetStatus
  createdAt: string
}

export interface TranslationRecord {
  languageCode: string
  name: string
}

export interface HallTemplate {
  id: string
  name: string
  translations: TranslationRecord[]
  sourceBlendAssetId?: string
  renderGlbAssetId: string
  thumbnailAssetId: string
  isPublic: boolean
  isActive: boolean
  updatedBy: string
  updatedAt: string
}

export interface HallTemplateSlot {
  id: string
  hallTemplateId: string
  slotCode: string
  name: string
  posX: number
  posY: number
  posZ: number
  rotX: number
  rotY: number
  rotZ: number
  scaleX: number
  scaleY: number
  scaleZ: number
  width: number
  height: number
  depth: number
  metadata: Record<string, string>
}

export interface BoothType {
  id: string
  name: string
}

export interface BoothTemplate {
  id: string
  name: string
  translations: TranslationRecord[]
  boothTypeId: string
  sourceBlendAssetId?: string
  renderGlbAssetId: string
  thumbnailAssetId: string
  description: string
  isPublic: boolean
  isActive: boolean
  updatedBy: string
  updatedAt: string
}

export interface HallTemplateUsage {
  hallTemplateId: string
  upcomingExpoCount: number
  liveExpoCount: number
  archivedExpoCount: number
}

export interface HallSlotUsage {
  slotId: string
  upcomingExpoCount: number
  liveExpoCount: number
}

export interface BoothTemplateUsage {
  boothTemplateId: string
  upcomingExpoBoothCount: number
  liveExpoBoothCount: number
  archivedExpoBoothCount: number
}

export type TemplateDerivedStatus =
  | "Inactive"
  | "Draft"
  | "Published"
  | "Processing"
  | "Failed"

export type ExpoStatus =
  | "Draft"
  | "Pending Review"
  | "Live"
  | "Ended"
  | "Archived"
  | "Canceled"

export interface ExpoCategory {
  id: string
  name: string
  level: 1 | 2 | 3 | 4
  parentId?: string
}

export interface Expo {
  id: string
  name: string
  thumbnailUrl: string
  ownerEmail: string
  startDate: string
  endDate: string
  status: ExpoStatus
  categoryIds: string[]
  createdAt: string
}
