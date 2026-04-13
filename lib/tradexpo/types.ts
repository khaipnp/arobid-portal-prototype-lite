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

export type NotificationKind =
  | "approval_needed"
  | "expo_live"
  | "expo_ended"
  | "asset_failed"
  | "expo_starting_soon"
  | "expo_canceled"

export interface AdminNotification {
  id: string
  kind: NotificationKind
  title: string
  message: string
  relatedExpoId?: string
  createdAt: string
  isRead: boolean
}

// ─── Orders & Transactions ───────────────────────────────────────────────────

export type PaymentMethod = "vnpay" | "bank_transfer"

export type OrderStatus =
  | "Pending Payment"
  | "Awaiting Confirmation"
  | "Paid"
  | "Failed"
  | "Cancelled"
  | "Expired"
  | "Rejected"

export type OrderType = "booth_registration" | "b2b_subscription"

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  customerCompany: string
  orderType: OrderType
  referenceId: string
  expoName: string
  boothRef: string
  boothTier: string
  amount: number
  paymentMethod: PaymentMethod
  status: OrderStatus
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface TransactionLogEntry {
  id: string
  orderId: string
  type: "payment" | "refund" | "status_change"
  status: OrderStatus
  actor: string
  note?: string
  rejectionReason?: string
  processedAt: string
}

export interface BankAccount {
  id: string
  bankName: string
  bankBIN: string
  accountNumber: string
  accountHolderName: string
  branch?: string
  isPrimary: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PaymentConfig {
  vnpayEnabled: boolean
  bankTransferEnabled: boolean
  updatedAt: string
  updatedBy: string
}

export interface ExpoPaymentConfig {
  expoId: string
  isInherited: boolean
  vnpayEnabled: boolean
  bankTransferEnabled: boolean
  bankAccountId: string | null
  updatedAt: string
  updatedBy: string
}

// ─── Seller / Supplier ───────────────────────────────────────────────────────

export type SellerBoothStatus =
  | "Pending Setup"
  | "Configured"
  | "Approved"
  | "Live"
  | "Ended"

export interface SellerBoothRegistration {
  id: string
  expoId: string
  slotId?: string
  /** Exhibitor-selected booth template. undefined = not yet selected. */
  boothTemplateId?: string
  boothRef: string
  boothTier: string
  status: SellerBoothStatus
  purchasedAt: string
}

export interface SellerBoothProduct {
  id: string
  name: string
  description: string
  imageUrl?: string
}

/** Customization config defined per BoothTemplate (what fields the template exposes). */
export interface BoothTemplateCustomizationConfig {
  boothTemplateId: string
  colorSlots: number
  imageSlots: number
  productLimit: number
  hasVideo: boolean
}

/** Which BoothTemplates the admin has made available for a given expo. */
export interface ExpoBoothTemplateAssignment {
  expoId: string
  boothTemplateIds: string[]
}

/** An item from the exhibitor's B2B Marketplace product catalog. */
export interface ExhibitorCatalogProduct {
  id: string
  name: string
  description: string
  imageUrl?: string
}

export type BoothPublishStatus = "Draft" | "Published"

/** Rich booth customization state — template-driven. Replaces SellerBoothConfig. */
export interface BoothCustomization {
  registrationId: string
  selectedBoothTemplateId: string | null
  publishStatus: BoothPublishStatus
  colors: string[]
  logoUrl: string
  imageUrls: string[]
  videoType: "upload" | "youtube" | null
  videoUrl: string
  products: SellerBoothProduct[]
}
