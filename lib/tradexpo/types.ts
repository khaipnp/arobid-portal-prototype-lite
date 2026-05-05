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
  /** Categories are flat (single-level taxonomy). */
  level: 1
}

export interface Expo {
  id: string
  name: string
  thumbnailUrl: string
  ownerEmail: string
  /** ISO date (YYYY-MM-DD), derived from `startAt` when present. */
  startDate: string
  /** ISO date (YYYY-MM-DD), derived from `endAt` when present. */
  endDate: string
  /** Full timestamps for lazy timeline phase (US-02). */
  startAt?: string
  endAt?: string
  status: ExpoStatus
  categoryIds: string[]
  createdAt: string
  description?: string
  timezone?: string
  expoTemplateId?: string | null
  ownerUserId?: string | null
}

/** Booth tier counts per hall block (US-03). */
export interface ExpoHallDraft {
  hallName: string
  hallTemplateId: string
  basicQty: number
  professionalQty: number
  premiumQty: number
}

export interface ExpoHall extends ExpoHallDraft {
  id: string
  expoId: string
  sortOrder: number
}

export interface ExpoLayoutTemplate {
  id: string
  name: string
}

export type ExpoTimelinePhase = "Upcoming" | "Live" | "Archived"

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

export type PaymentMethod = "vnpay"

export type OrderStatus =
  | "Pending Payment"
  | "Paid"
  | "Failed"
  | "Cancelled"
  | "Expired"

export type OrderType = "booth_registration" | "b2b_subscription"

export type InvoiceType = "individual" | "business"

export type InvoiceStatus =
  | "not_requested"
  | "requested_pending_payment"
  | "requested_paid"
  | "exported"
  | "issued"
  | "sent"

export interface BillingInfoSnapshot {
  fullName?: string
  companyName?: string
  invoiceEmail: string
  taxCode: string
  address: string
  phoneNumber?: string
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  customerCompany: string
  partnerName?: string
  orderType: OrderType
  referenceId: string
  expoName?: string
  boothRef?: string
  boothTier?: string
  originalAmount: number
  discountAmount: number
  amount: number
  voucherId?: string
  paymentMethod: PaymentMethod
  status: OrderStatus
  invoiceRequested: boolean
  invoiceType?: InvoiceType
  billingInfoSnapshot?: BillingInfoSnapshot
  invoiceStatus: InvoiceStatus
  paidAt?: string
  exportedAt?: string
  exportedBy?: string
  exportBatchId?: string
  issuedAt?: string
  issuedBy?: string
  sentAt?: string
  sentBy?: string
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
  userId: string
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

// ─── Core: Streaming Service ─────────────────────────────────────────────────

export type StreamSessionStatus =
  | "Provisioned"
  | "Active"
  | "Ended"
  | "Canceled"

export interface StreamSession {
  streamSessionId: string
  status: StreamSessionStatus
  hostUserId: string
  hostDisplayName: string
  streamUrl: string
  streamKey: string
  replayEnabled: boolean
  replayUrl: string | null
  startedAt: string | null
  endedAt: string | null
  peakViewerCount: number | null
  createdAt: string
  updatedAt: string
}

export interface LiveComment {
  liveCommentId: string
  streamSessionId: string
  authorUserId: string | null
  authorDisplayName: string | null
  guestDisplayName: string | null
  guestEmail: string | null
  commentText: string
  isDeleted: boolean
  createdAt: string
  deletedAt: string | null
  deletedByUserId: string | null
}

// ─── TradeXpo: Event GoLIVE ───────────────────────────────────────────────────

export type GoLIVEEventStatus =
  | "Scheduled"
  | "Ready"
  | "Live"
  | "Ended"
  | "Canceled"

export type GoLIVESessionType =
  | "Workshop"
  | "Talkshow"
  | "Keynote"
  | "Panel"
  | "ProductDemo"
  | "Other"

export interface GoLIVEEvent {
  goLiveEventId: string
  expoId: string
  streamSessionId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  sessionType: GoLIVESessionType
  scheduledStartAt: string | null
  status: GoLIVEEventStatus
  broadcasterUserId: string
  broadcasterDisplayName: string
  createdAt: string
  updatedAt: string
}

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
