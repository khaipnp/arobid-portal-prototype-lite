import { createHash, randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import { publishNotification } from "@/lib/notifications/service"
import type {
  PartnerMembershipStatus,
  PartnerMembershipStatusAction,
  PartnerMiniSiteStatus,
  PartnerCapability as PartnerMvpCapability,
  PartnerMvpRole,
  PartnerScopeSummary
} from "@/lib/partner/core"
import {
  canAssignPartnerRole,
  canChangePartnerMembershipStatus,
  canInvitePartnerRole,
  canTransitionMiniSiteStatus,
  normalizePartnerRole
} from "@/lib/partner/core"
import type { Expo, ExpoStatus } from "@/lib/tradexpo/types"

export type PartnerModel = "co_host" | "turnkey" | "tenant"

export type PartnerType =
  | "strategic_partner"
  | "expo_partner"
  | "distribution_partner"
  | "alliance_partner"
  | "government_program_partner"

export type PartnerMembershipRole =
  | "primary_representative"
  | "admin"
  | "operator"
  | "analyst"
  | "partner_owner"
  | "partner_admin"
  | "program_manager"
  | "business_manager"
  | "operations"
  | "finance"
  | "viewer"

export type PartnerCapability =
  | "view_dashboard"
  | "manage_golive"
  | "manage_exhibitors"
  | "edit_expo_content"
  | "configure_operations"
  | "manage_branding"
  | "manage_tenant_settings"
  | "manage_partner_users"

export type PartnerOrganization = {
  id: string
  name: string
  model: PartnerModel
  partnerType: PartnerType
  status: "active" | "inactive"
  primaryUserId: string | null
}

export type PartnerAssignment = {
  partnerOrganization: PartnerOrganization
  membershipRole: PartnerMembershipRole
  partnershipModel: PartnerModel
  capabilities: PartnerCapability[]
}

export type PartnerPortalOrganization = PartnerOrganization & {
  membershipRole: PartnerMembershipRole
}

export type PartnerUserInvitationStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired"

export type PartnerUserInvitation = {
  id: string
  partnerOrgId: string
  email: string
  displayName: string | null
  message: string | null
  role: "partner_owner" | "partner_admin" | "viewer"
  status: PartnerUserInvitationStatus
  invitedByUserId: string
  acceptedByUserId: string | null
  expiresAt: string
  acceptedAt: string | null
  cancelledAt: string | null
  createdAt: string
}

export type PartnerOrganizationMember = {
  userId: string
  name: string | null
  email: string
  role: PartnerMvpRole
  rawRole: PartnerMembershipRole
  status: PartnerMembershipStatus | "inactive"
  createdAt: string
}

export type PartnerUserManagementWorkspace = {
  organization: PartnerPortalOrganization | null
  members: PartnerOrganizationMember[]
  invitations: PartnerUserInvitation[]
}

export type PartnerPortalSummary = {
  organization: PartnerPortalOrganization | null
  overview: {
    enterprisesActivated: number
    expoBoothsUsed: number
    activeInviteCampaigns: number
    rfqGenerated: number
    dealContexts: number
    bundleSales: number
    partnerRevenue: number
  }
  expoPrograms: {
    assignedExpos: number
    coHost: number
    turnkey: number
    bulkBooking: number
  }
  enterprises: {
    total: number
    invited: number
    registered: number
    profileCompleted: number
    expoActivated: number
    rfqGenerated: number
  }
  quotas: {
    totalQuantity: number
    allocatedQuantity: number
    consumedQuantity: number
    availableQuantity: number
    activeInviteCampaigns: number
  }
  bundles: {
    total: number
    published: number
    draft: number
    archived: number
  }
  communications: {
    expoContextMessages: number
    activeContextTypes: number
  }
  finance: {
    recordedRevenue: number
    partnerShare: number
    pendingSettlement: number
    settledSettlement: number
  }
  reports: {
    expoOverviewReady: boolean
    tradeActivityReady: boolean
    industryInsightReady: boolean
    buyerLeadsReady: boolean
  }
}

export type PartnerQuota = {
  id: string
  quotaType: "booth_credits" | "expo_program_quota" | "bulk_booth_inventory"
  label: string
  totalQuantity: number
  allocatedQuantity: number
  consumedQuantity: number
  availableQuantity: number
  createdAt: string
}

export type PartnerDealContextStage =
  | "rfq_generated"
  | "qualified"
  | "meeting_scheduled"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost"

export type PartnerCompanySearchResult = {
  id: string
  name: string
  taxId: string | null
  website: string | null
  address: string | null
  isActive: boolean
}

export type PartnerEnterpriseAssociationAuditAction =
  | "invite"
  | "resend_invite"
  | "accept"
  | "activate"
  | "deactivate"
  | "remove"
  | "block"
  | "unblock"
  | "reactivate"

export type PartnerEnterpriseAssociationAuditActor =
  | "partner_user"
  | "company_user"
  | "arobid_admin"
  | "system"

export type PartnerEnterpriseAssociationAuditEvent = {
  id: string
  associationId: string
  partnerOrgId: string
  partnerOrgName: string
  enterpriseId: string | null
  enterpriseName: string
  action: PartnerEnterpriseAssociationAuditAction
  oldStatus: PartnerEnterpriseMember["activationStatus"] | null
  newStatus: PartnerEnterpriseMember["activationStatus"]
  source: string
  actorType: PartnerEnterpriseAssociationAuditActor
  actorId: string | null
  actorLabel: string | null
  reason: string | null
  createdAt: string
}

export type PartnerEnterpriseAssociationAuditFilters = {
  partnerOrgId?: string
  enterpriseId?: string
  action?: PartnerEnterpriseAssociationAuditAction
  source?: string
  actorType?: PartnerEnterpriseAssociationAuditActor
  q?: string
  limit?: number
}

export type PartnerSiteInvitationType = "site_visit" | "join_partner_site"

export type PartnerSiteInvitationSendResult = {
  sentCount: number
  createdCount: number
  resentCount: number
  skipped: { email: string; reason: string }[]
}

export type PartnerEnterpriseMember = {
  id: string
  enterpriseId?: string | null
  enterpriseName: string
  contactEmail: string | null
  logoUrl: string | null
  activationStatus:
    | "invited"
    | "pending_acceptance"
    | "active"
    | "inactive"
    | "removed"
    | "blocked"
  source: string
  relationshipType: string
  publicProfile: boolean
  lastAction: string | null
  acceptedAt: string | null
  removedAt: string | null
  createdAt: string
  updatedAt: string
  removedReason: string | null
  expoParticipationCount: number
  rfqGeneratedCount: number
  tradeSignalCount: number
  dealContextStage?: PartnerDealContextStage | null
  dealContextEvents?: number
  quotaAllocatedQuantity?: number
  quotaConsumedQuantity?: number
}

export type PartnerEnterpriseActivity = {
  id: string
  type: "association" | "deal_context"
  title: string
  description: string | null
  actorLabel: string | null
  createdAt: string
}

export type PartnerEnterpriseMemberDetail = {
  organization: PartnerPortalOrganization
  member: Required<PartnerEnterpriseMember>
  activities: PartnerEnterpriseActivity[]
}

export type PartnerEnterpriseWorkspace = {
  organization: PartnerPortalOrganization | null
  members: Required<PartnerEnterpriseMember>[]
  funnel: {
    invited: number
    registered: number
    profileCompleted: number
    expoActivated: number
    rfqGenerated: number
  }
}

export type PartnerInviteCampaign = {
  id: string
  name: string
  inviteCode: string
  quotaId: string | null
  quotaLabel: string | null
  status: "draft" | "active" | "paused" | "ended"
  claimedCount: number
  createdAt: string
}

export type PartnerQuotaWorkspace = {
  organization: PartnerPortalOrganization | null
  quotas: PartnerQuota[]
  enterpriseMembers: PartnerEnterpriseMember[]
  inviteCampaigns: PartnerInviteCampaign[]
}

export type PartnerExpoProgramsWorkspace = {
  assignedExpos: PartnerAssignedExpo[]
  quotaWorkspace: PartnerQuotaWorkspace
}

export type PartnerServiceExecutionStatus =
  | "scheduled"
  | "in_progress"
  | "delivered"
  | "closed"
  | "canceled"

export type PartnerServiceExecution = {
  id: string
  bundleId: string
  bundleName: string
  status: PartnerServiceExecutionStatus
  eventCount: number
  scheduledAt: string
  slaDueAt: string | null
}

export type PartnerServiceBundle = {
  id: string
  name: string
  description: string
  partnerServicePrice: number
  arobidServicePrice: number
  discountAmount: number
  totalPrice: number
  partnerSharePercent: number
  partnerShareAmount: number
  arobidShareAmount: number
  status: "draft" | "published" | "archived"
  createdAt: string
}

export type PartnerRevenueModelType = "wholesale_partner" | "platform_billing"

export type PartnerRevenueEvent = {
  id: string
  sourceType: string
  sourceId: string | null
  modelType: PartnerRevenueModelType
  grossAmount: number
  partnerAmount: number
  arobidAmount: number
  status: string
  createdAt: string
}

export type PartnerSettlementAuditEvent = {
  id: string
  settlementId: string
  eventType: string
  actorUserId: string | null
  payload: Record<string, unknown>
  createdAt: string
}

export type PartnerSettlement = {
  id: string
  cycleMonth: string
  grossAmount: number
  partnerAmount: number
  arobidAmount: number
  status: "pending" | "settled" | "canceled"
  auditEvents: PartnerSettlementAuditEvent[]
  createdAt: string
  settledAt: string | null
}

export type PartnerBundlesWorkspace = {
  organization: PartnerPortalOrganization | null
  bundles: PartnerServiceBundle[]
  revenueEvents: PartnerRevenueEvent[]
  serviceExecutions: PartnerServiceExecution[]
  totals: {
    published: number
    draft: number
    archived: number
    grossRevenue: number
    partnerRevenue: number
    arobidRevenue: number
  }
}

export type PartnerFinanceWorkspace = {
  organization: PartnerPortalOrganization | null
  revenueEvents: PartnerRevenueEvent[]
  settlements: PartnerSettlement[]
  cycleOptions: string[]
  totals: {
    recordedRevenue: number
    partnerShare: number
    arobidShare: number
    wholesaleRevenue: number
    platformBillingRevenue: number
    pendingSettlement: number
    settledSettlement: number
  }
}

export type PartnerMessageContextType =
  | "service_inquiry"
  | "bundle_purchase"
  | "deal_support"
  | "expo_participation"

export type PartnerMessageThread = {
  id: string
  contextType: PartnerMessageContextType
  contextId: string
  subject: string
  participantLabel: string
  status: "open" | "closed"
  messageCount: number
  lastMessage: string | null
  updatedAt: string
}

export type PartnerThreadMessage = {
  id: string
  threadId: string
  senderUserId: string | null
  senderLabel: string
  body: string
  createdAt: string
}

export type PartnerMessageTrigger = {
  contextType: PartnerMessageContextType
  contextId: string
  label: string
  participantLabel: string
}

export type PartnerCommunicationsWorkspace = {
  organization: PartnerPortalOrganization | null
  threads: PartnerMessageThread[]
  messagesByThread: Record<string, PartnerThreadMessage[]>
  triggers: PartnerMessageTrigger[]
  totals: {
    openThreads: number
    serviceInquiryTriggers: number
    bundlePurchaseTriggers: number
    dealSupportTriggers: number
    expoParticipationTriggers: number
  }
}

export type PartnerReportSnapshot = {
  key: "expo_overview" | "trade_activity" | "industry_insight" | "buyer_leads"
  title: string
  description: string
  source: string
  status: "ready" | "pending"
  metrics: {
    label: string
    value: number
  }[]
}

export type PartnerGovernmentProgramWorkspace = {
  organization: PartnerPortalOrganization | null
  quotaWorkspace: PartnerQuotaWorkspace
  supportedSmes: number
  activeCampaigns: number
  quotaUtilization: number
}

export type PartnerAnalyticsWorkspace = {
  organization: PartnerPortalOrganization | null
  summary: PartnerPortalSummary
  reports: PartnerReportSnapshot[]
  topExpos: {
    expoId: string
    expoName: string
    status: ExpoStatus
    boothUtilization: number
    soldBooths: number
    rfqCount: number
    meetings: number
    revenue: number
  }[]
  funnel: PartnerEnterpriseWorkspace["funnel"]
  sourceMetrics: {
    meetings: number
    countrySegments: number
    boothTierSegments: number
    openThreads: number
    settlementCycles: number
  }
}

export type PartnerAssignedExpo = {
  expo: Expo
  assignment: PartnerAssignment
  goLiveCount: number
  totalBooths: number
  soldBooths: number
  visitors: number
  rfqCount: number
  chatCount: number
}

export type PartnerDashboardExpoMetric = {
  expoId: string
  expoName: string
  status: ExpoStatus
  startDate: string
  endDate: string
  totalBooths: number
  soldBooths: number
  unsoldBooths: number
  boothUtilization: number
  publishedBooths: number
  goLiveEvents: number
  liveSessions: number
  peakViewers: number
  comments: number
  revenue: number
}

export type PartnerDashboardBreakdownItem = {
  name: string
  value: number
}

export type PartnerDashboardDuration = "3D" | "7D" | "15D" | "30D"

export type PartnerDashboardOperationsSummary = {
  views: number
  activatedEnterprises: number
  soldBooths: number
  rfqs: number
}

export type PartnerDashboardMetrics = {
  totals: {
    assignedExpos: number
    liveExpos: number
    soldBooths: number
    totalBooths: number
    boothUtilization: number
    publishedBooths: number
    goLiveEvents: number
    liveSessions: number
    peakViewers: number
    comments: number
    revenue: number
  }
  operationsByDuration: Record<
    PartnerDashboardDuration,
    PartnerDashboardOperationsSummary
  >
  expoMetrics: PartnerDashboardExpoMetric[]
  statusBreakdown: PartnerDashboardBreakdownItem[]
  countryBreakdown: PartnerDashboardBreakdownItem[]
  boothTierBreakdown: PartnerDashboardBreakdownItem[]
}

export type PartnerExpoTierBreakdown = {
  tier: string
  capacity: number
  sold: number
  published: number
}

export type PartnerExpoHallBreakdown = {
  id: string
  name: string
  capacity: number
  basicQty: number
  professionalQty: number
  premiumQty: number
}

export type PartnerExpoRegistrationStatusBreakdown = {
  status: string
  value: number
}

export type PartnerExpoOperationsDetail = {
  summary: {
    totalBooths: number
    soldBooths: number
    unsoldBooths: number
    boothUtilization: number
    publishedBooths: number
    goLiveEvents: number
    liveSessions: number
    peakViewers: number
    comments: number
    revenue: number
    visitors: number
    products: number
  }
  tierBreakdown: PartnerExpoTierBreakdown[]
  hallBreakdown: PartnerExpoHallBreakdown[]
  registrationStatusBreakdown: PartnerExpoRegistrationStatusBreakdown[]
}

export type PartnerExpoExhibitorPaymentStatus = "Paid" | "Pending" | "No order"

export type PartnerExpoExhibitorTierMix = {
  Basic: number
  Professional: number
  Premium: number
}

export type PartnerExpoExhibitorListItem = {
  id: string
  displayName: string
  contactName: string | null
  contactEmail: string | null
  phone: string | null
  website: string | null
  address: string | null
  industry: string | null
  taxId: string | null
  logoUrl: string | null
  boothCount: number
  boothRefs: string[]
  tierMix: PartnerExpoExhibitorTierMix
  registrationStatuses: string[]
  publishedBoothCount: number
  productCount: number
  paidAmount: number
  paymentStatus: PartnerExpoExhibitorPaymentStatus
  latestPurchasedAt: string | null
}

export type PartnerExpoExhibitorsWorkspace = {
  summary: {
    exhibitorCount: number
    boothCount: number
    publishedBoothCount: number
    paidAmount: number
  }
  exhibitors: PartnerExpoExhibitorListItem[]
  topExhibitors: PartnerExpoExhibitorListItem[]
}

export type PartnerExpoExhibitorRegistration = {
  id: string
  boothRef: string
  boothTier: string
  status: string
  publishStatus: string | null
  productCount: number
  purchasedAt: string
}

export type PartnerExpoExhibitorOrder = {
  id: string
  registrationId: string | null
  boothRef: string | null
  boothTier: string | null
  paymentMethod: string
  status: string
  originalAmount: number
  discountAmount: number
  amount: number
  createdAt: string
  updatedAt: string
}

export type PartnerExpoExhibitorPerformanceProduct = {
  productId: string
  productName: string
  count: number
}

export type PartnerExpoExhibitorPerformance = {
  rfqCount: number
  chatCount: number
  eProfileVisits: number
  topViewedProduct: PartnerExpoExhibitorPerformanceProduct | null
  topChattedProduct: PartnerExpoExhibitorPerformanceProduct | null
  topWishlistedProduct: PartnerExpoExhibitorPerformanceProduct | null
}

export type PartnerExpoExhibitorDetail = {
  exhibitor: PartnerExpoExhibitorListItem
  registrations: PartnerExpoExhibitorRegistration[]
  orders: PartnerExpoExhibitorOrder[]
  performance: PartnerExpoExhibitorPerformance
}

type PartnerExpoRow = {
  id: string
  slug?: string | null
  name: string
  thumbnail_url: string
  owner_email: string
  start_date: string | Date
  end_date: string | Date
  status: string
  category_ids: string[]
  created_at: string | Date
  description?: string
  timezone?: string
  expo_template_id?: string | null
  owner_user_id?: string | null
  start_at?: string | Date | null
  end_at?: string | Date | null
  partner_org_id: string
  partner_org_name: string
  partner_org_model: PartnerModel
  partner_type?: PartnerType
  partner_org_status: "active" | "inactive"
  partner_org_primary_user_id: string | null
  membership_role: PartnerMembershipRole
  partnership_model: PartnerModel
}

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

function toDateOnly(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function normalizePartnerExpoStatus(status: string): ExpoStatus {
  if (
    status === "Draft" ||
    status === "Pending Review" ||
    status === "Live" ||
    status === "Archived" ||
    status === "Canceled"
  ) {
    return status
  }

  return "Archived"
}

function rowToExpo(row: PartnerExpoRow): Expo {
  const startAt = row.start_at ? toIso(row.start_at) : undefined
  const endAt = row.end_at ? toIso(row.end_at) : undefined

  return {
    id: row.id,
    slug: row.slug ?? undefined,
    name: row.name,
    thumbnailUrl: row.thumbnail_url,
    ownerEmail: row.owner_email,
    startDate: startAt
      ? toDateOnly(row.start_at as string | Date)
      : toDateOnly(row.start_date),
    endDate: endAt
      ? toDateOnly(row.end_at as string | Date)
      : toDateOnly(row.end_date),
    startAt,
    endAt,
    status: normalizePartnerExpoStatus(row.status),
    categoryIds: row.category_ids,
    createdAt: toIso(row.created_at),
    description: row.description,
    timezone: row.timezone,
    expoTemplateId: row.expo_template_id ?? undefined,
    ownerUserId: row.owner_user_id ?? undefined
  }
}

export function resolvePartnerCapabilities(
  model: PartnerModel
): PartnerCapability[] {
  const coHost: PartnerCapability[] = [
    "view_dashboard",
    "manage_golive",
    "manage_exhibitors"
  ]

  if (model === "co_host") return coHost

  const turnkey: PartnerCapability[] = [
    ...coHost,
    "edit_expo_content",
    "configure_operations",
    "manage_branding"
  ]

  if (model === "turnkey") return turnkey

  return [...turnkey, "manage_tenant_settings", "manage_partner_users"]
}

function rowToAssignedExpo(
  row: PartnerExpoRow
): Pick<PartnerAssignedExpo, "expo" | "assignment"> {
  return {
    expo: rowToExpo(row),
    assignment: {
      partnerOrganization: {
        id: row.partner_org_id,
        name: row.partner_org_name,
        model: row.partner_org_model,
        partnerType: row.partner_type ?? "expo_partner",
        status: row.partner_org_status,
        primaryUserId: row.partner_org_primary_user_id
      },
      membershipRole: row.membership_role,
      partnershipModel: row.partnership_model,
      capabilities: resolvePartnerCapabilities(row.partnership_model)
    }
  }
}

export function formatPartnerType(type: PartnerType) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function formatPartnerModel(model: PartnerModel) {
  const labels: Record<PartnerModel, string> = {
    co_host: "Co-host",
    turnkey: "Turnkey",
    tenant: "Tenant"
  }
  return labels[model]
}

export async function getPrimaryPartnerOrganization(
  userId: string
): Promise<PartnerPortalOrganization | null> {
  const rows = (await sql`
    select
      po.id,
      po.name,
      po.model,
      po.partner_type,
      po.status,
      po.primary_user_id,
      pm.role as membership_role
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    where pm.user_id = ${userId}
      and pm.status = 'active'
      and po.status = 'active'
    order by
      case pm.role
        when 'partner_owner' then 1
        when 'primary_representative' then 2
        when 'partner_admin' then 3
        when 'admin' then 4
        else 5
      end,
      po.created_at asc
    limit 1
  `) as {
    id: string
    name: string
    model: PartnerModel
    partner_type: PartnerType
    status: "active" | "inactive"
    primary_user_id: string | null
    membership_role: PartnerMembershipRole
  }[]

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    model: row.model,
    partnerType: row.partner_type,
    status: row.status,
    primaryUserId: row.primary_user_id,
    membershipRole: row.membership_role
  }
}

export async function getPartnerCapabilities(
  partnerOrgId: string
): Promise<PartnerMvpCapability[]> {
  const rows = (await sql`
    select capability
    from partner_capability_assignments
    where partner_org_id = ${partnerOrgId}
    order by capability asc
  `) as { capability: PartnerMvpCapability }[]

  if (rows.length === 0) return ["overview"]
  return Array.from(new Set(rows.map((row) => row.capability)))
}

export async function getPartnerScopes(
  partnerOrgId: string
): Promise<PartnerScopeSummary> {
  const [scopeRows, expoRows] = await Promise.all([
    sql`
      select scope_type, scope_id
      from partner_scope_assignments
      where partner_org_id = ${partnerOrgId}
        and status = 'active'
      order by created_at asc
    `,
    sql`
      select expo_id
      from partner_expo_assignments
      where partner_org_id = ${partnerOrgId}
    `
  ])
  const rows = scopeRows as {
    scope_type: "expo" | "program" | "company"
    scope_id: string
  }[]
  const assignedExpoIds = (expoRows as { expo_id: string }[]).map(
    (row) => row.expo_id
  )

  return {
    expoIds: Array.from(
      new Set([
        ...rows
          .filter((row) => row.scope_type === "expo")
          .map((row) => row.scope_id),
        ...assignedExpoIds
      ])
    ),
    programIds: Array.from(
      new Set(
        rows
          .filter((row) => row.scope_type === "program")
          .map((row) => row.scope_id)
      )
    ),
    companyIds: Array.from(
      new Set(
        rows
          .filter((row) => row.scope_type === "company")
          .map((row) => row.scope_id)
      )
    )
  }
}

async function recordPartnerMembershipAudit(input: {
  partnerOrgId: string
  actorUserId: string | null
  targetUserId?: string | null
  invitationId?: string | null
  action: string
  oldRole?: string | null
  newRole?: string | null
  oldStatus?: string | null
  newStatus?: string | null
  reason?: string | null
}) {
  await sql`
    insert into partner_membership_audit_events (
      id,
      partner_org_id,
      actor_user_id,
      target_user_id,
      invitation_id,
      action,
      old_role,
      new_role,
      old_status,
      new_status,
      reason
    )
    values (
      ${`partner-membership-audit-${randomUUID()}`},
      ${input.partnerOrgId},
      ${input.actorUserId},
      ${input.targetUserId ?? null},
      ${input.invitationId ?? null},
      ${input.action},
      ${input.oldRole ?? null},
      ${input.newRole ?? null},
      ${input.oldStatus ?? null},
      ${input.newStatus ?? null},
      ${input.reason?.trim() || null}
    )
  `
}

export async function getPartnerUserManagementWorkspace(
  userId: string
): Promise<PartnerUserManagementWorkspace> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) return { organization: null, members: [], invitations: [] }

  const [memberRows, invitationRows] = await Promise.all([
    sql`
      select
        u.id,
        u.name,
        u.email,
        pm.role,
        pm.status,
        pm.created_at
      from partner_memberships pm
      inner join users u on u.id = pm.user_id
      where pm.partner_org_id = ${organization.id}
      order by pm.created_at asc
    `,
    sql`
      select
        id,
        partner_org_id,
        email,
        display_name,
        message,
        role,
        status,
        invited_by_user_id,
        accepted_by_user_id,
        expires_at,
        accepted_at,
        cancelled_at,
        created_at
      from partner_user_invitations
      where partner_org_id = ${organization.id}
      order by created_at desc
    `
  ])

  return {
    organization,
    members: (
      memberRows as {
        id: string
        name: string | null
        email: string
        role: PartnerMembershipRole
        status: PartnerMembershipStatus | "inactive"
        created_at: string | Date
      }[]
    ).map((row) => ({
      userId: row.id,
      name: row.name,
      email: row.email,
      rawRole: row.role,
      role: normalizePartnerRole(row.role),
      status: row.status,
      createdAt: toIso(row.created_at)
    })),
    invitations: (
      invitationRows as {
        id: string
        partner_org_id: string
        email: string
        display_name: string | null
        message: string | null
        role: PartnerUserInvitation["role"]
        status: PartnerUserInvitationStatus
        invited_by_user_id: string
        accepted_by_user_id: string | null
        expires_at: string | Date
        accepted_at: string | Date | null
        cancelled_at: string | Date | null
        created_at: string | Date
      }[]
    ).map((row) => ({
      id: row.id,
      partnerOrgId: row.partner_org_id,
      email: row.email,
      displayName: row.display_name,
      message: row.message,
      role: row.role,
      status: row.status,
      invitedByUserId: row.invited_by_user_id,
      acceptedByUserId: row.accepted_by_user_id,
      expiresAt: toIso(row.expires_at),
      acceptedAt: row.accepted_at ? toIso(row.accepted_at) : null,
      cancelledAt: row.cancelled_at ? toIso(row.cancelled_at) : null,
      createdAt: toIso(row.created_at)
    }))
  }
}

async function getActiveOwnerCount(partnerOrgId: string) {
  const rows = (await sql`
    select count(*)::int as count
    from partner_memberships
    where partner_org_id = ${partnerOrgId}
      and status = 'active'
      and role in ('partner_owner', 'primary_representative')
  `) as { count: number | string }[]

  return toNumber(rows[0]?.count)
}

export async function createPartnerUserInvitation(
  actorUserId: string,
  input: {
    email: string
    role: PartnerMvpRole
    displayName?: string | null
    message?: string | null
  }
) {
  const organization = await requirePrimaryPartnerOrganization(actorUserId)
  const actorRole = normalizePartnerRole(organization.membershipRole)
  if (!canInvitePartnerRole(actorRole, input.role))
    throw new Error("Forbidden.")

  const email = input.email.trim().toLowerCase()
  if (!email?.includes("@")) throw new Error("Valid email is required.")

  const activeRows = (await sql`
    select 1
    from partner_memberships pm
    inner join users u on u.id = pm.user_id
    where pm.partner_org_id = ${organization.id}
      and lower(u.email) = ${email}
      and pm.status = 'active'
    limit 1
  `) as { "?column?": number }[]
  if (activeRows.length > 0)
    throw new Error("User is already an active member.")

  const id = `partner-user-invite-${randomUUID()}`
  const rows = (await sql`
    insert into partner_user_invitations (
      id,
      partner_org_id,
      email,
      display_name,
      message,
      role,
      invited_by_user_id,
      expires_at
    )
    values (
      ${id},
      ${organization.id},
      ${email},
      ${input.displayName?.trim() || null},
      ${input.message?.trim() || null},
      ${input.role},
      ${actorUserId},
      now() + interval '7 days'
    )
    on conflict (partner_org_id, lower(email)) where status = 'pending'
    do update set
      role = excluded.role,
      display_name = excluded.display_name,
      message = excluded.message,
      invited_by_user_id = excluded.invited_by_user_id,
      expires_at = excluded.expires_at,
      updated_at = now()
    returning id
  `) as { id: string }[]

  await recordPartnerMembershipAudit({
    partnerOrgId: organization.id,
    actorUserId,
    invitationId: rows[0].id,
    action: rows[0].id === id ? "invite_created" : "invite_resent",
    newRole: input.role,
    newStatus: "pending"
  })

  return { id: rows[0].id }
}

export async function cancelPartnerUserInvitation(
  actorUserId: string,
  invitationId: string
) {
  const organization = await requirePrimaryPartnerOrganization(actorUserId)
  const actorRole = normalizePartnerRole(organization.membershipRole)
  if (actorRole === "viewer") throw new Error("Forbidden.")

  const rows = (await sql`
    update partner_user_invitations
    set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = ${invitationId}
      and partner_org_id = ${organization.id}
      and status = 'pending'
    returning id, role
  `) as { id: string; role: string }[]
  if (rows.length === 0) throw new Error("Invitation not found.")

  await recordPartnerMembershipAudit({
    partnerOrgId: organization.id,
    actorUserId,
    invitationId,
    action: "invite_cancelled",
    oldRole: rows[0].role,
    oldStatus: "pending",
    newStatus: "cancelled"
  })
}

export async function acceptPartnerUserInvitation(
  actorUserId: string,
  invitationId: string
) {
  await sql`begin`
  try {
    const rows = (await sql`
      select
        pui.id,
        pui.partner_org_id,
        pui.role,
        pui.email,
        pui.expires_at,
        po.status as partner_org_status,
        u.email as user_email
      from partner_user_invitations pui
      inner join partner_organizations po on po.id = pui.partner_org_id
      inner join users u on u.id = ${actorUserId}
      where pui.id = ${invitationId}
        and pui.status = 'pending'
      for update
      limit 1
    `) as {
      id: string
      partner_org_id: string
      role: PartnerMvpRole
      email: string
      expires_at: string | Date
      partner_org_status: string
      user_email: string
    }[]

    const invite = rows[0]
    if (!invite) throw new Error("Invitation not found.")
    if (invite.partner_org_status !== "active") {
      throw new Error("Partner organization is not active.")
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await sql`
        update partner_user_invitations
        set status = 'expired', updated_at = now()
        where id = ${invitationId}
      `
      throw new Error("Invitation has expired.")
    }
    if (invite.email.toLowerCase() !== invite.user_email.toLowerCase()) {
      throw new Error("Invitation email does not match current user.")
    }

    await sql`
      insert into partner_memberships (partner_org_id, user_id, role, status)
      values (${invite.partner_org_id}, ${actorUserId}, ${invite.role}, 'active')
      on conflict (partner_org_id, user_id) do update set
        role = excluded.role,
        status = 'active'
    `
    await sql`
      update partner_user_invitations
      set
        status = 'accepted',
        accepted_by_user_id = ${actorUserId},
        accepted_at = now(),
        updated_at = now()
      where id = ${invitationId}
    `
    await recordPartnerMembershipAudit({
      partnerOrgId: invite.partner_org_id,
      actorUserId,
      targetUserId: actorUserId,
      invitationId,
      action: "invite_accepted",
      newRole: invite.role,
      newStatus: "active"
    })
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function updatePartnerMemberRole(
  actorUserId: string,
  targetUserId: string,
  input: { role: PartnerMvpRole; reason?: string | null }
) {
  const organization = await requirePrimaryPartnerOrganization(actorUserId)
  const actorRole = normalizePartnerRole(organization.membershipRole)

  await sql`begin`
  try {
    const rows = (await sql`
      select role
      from partner_memberships
      where partner_org_id = ${organization.id}
        and user_id = ${targetUserId}
        and status = 'active'
      for update
      limit 1
    `) as { role: PartnerMembershipRole }[]
    const target = rows[0]
    if (!target) throw new Error("Member not found.")

    const targetRole = normalizePartnerRole(target.role)
    if (
      !canAssignPartnerRole({
        actorRole,
        targetCurrentRole: targetRole,
        targetNextRole: input.role,
        isSelf: actorUserId === targetUserId
      })
    ) {
      throw new Error("Forbidden.")
    }

    if (targetRole === "partner_owner" && input.role !== "partner_owner") {
      const ownerCount = await getActiveOwnerCount(organization.id)
      if (ownerCount <= 1) {
        throw new Error("At least one Partner Owner is required.")
      }
    }

    await sql`
      update partner_memberships
      set role = ${input.role}
      where partner_org_id = ${organization.id}
        and user_id = ${targetUserId}
    `
    await recordPartnerMembershipAudit({
      partnerOrgId: organization.id,
      actorUserId,
      targetUserId,
      action: "role_changed",
      oldRole: targetRole,
      newRole: input.role,
      reason: input.reason ?? null
    })
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function updatePartnerMemberStatus(
  actorUserId: string,
  targetUserId: string,
  input: { action: PartnerMembershipStatusAction; reason?: string | null }
) {
  const organization = await requirePrimaryPartnerOrganization(actorUserId)
  const actorRole = normalizePartnerRole(organization.membershipRole)

  if (
    (input.action === "disable" || input.action === "remove") &&
    !input.reason?.trim()
  ) {
    throw new Error("Reason is required.")
  }

  await sql`begin`
  try {
    const rows = (await sql`
      select role, status
      from partner_memberships
      where partner_org_id = ${organization.id}
        and user_id = ${targetUserId}
      for update
      limit 1
    `) as {
      role: PartnerMembershipRole
      status: PartnerMembershipStatus | "inactive"
    }[]
    const target = rows[0]
    if (!target) throw new Error("Member not found.")

    const targetRole = normalizePartnerRole(target.role)
    if (
      !canChangePartnerMembershipStatus({
        actorRole,
        targetRole,
        action: input.action,
        isSelf: actorUserId === targetUserId
      })
    ) {
      throw new Error("Forbidden.")
    }

    if (
      target.status === "active" &&
      targetRole === "partner_owner" &&
      (input.action === "disable" || input.action === "remove")
    ) {
      const ownerCount = await getActiveOwnerCount(organization.id)
      if (ownerCount <= 1) {
        throw new Error("At least one Partner Owner is required.")
      }
    }

    const nextStatus: PartnerMembershipStatus =
      input.action === "disable"
        ? "disabled"
        : input.action === "remove"
          ? "removed"
          : "active"

    await sql`
      update partner_memberships
      set status = ${nextStatus}
      where partner_org_id = ${organization.id}
        and user_id = ${targetUserId}
    `
    await recordPartnerMembershipAudit({
      partnerOrgId: organization.id,
      actorUserId,
      targetUserId,
      action: `membership_${input.action}`,
      oldRole: targetRole,
      newRole: targetRole,
      oldStatus: target.status,
      newStatus: nextStatus,
      reason: input.reason ?? null
    })
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function getPartnerPortalSummary(
  userId: string
): Promise<PartnerPortalSummary> {
  const organization = await getPrimaryPartnerOrganization(userId)

  const empty: PartnerPortalSummary = {
    organization,
    overview: {
      enterprisesActivated: 0,
      expoBoothsUsed: 0,
      activeInviteCampaigns: 0,
      rfqGenerated: 0,
      dealContexts: 0,
      bundleSales: 0,
      partnerRevenue: 0
    },
    expoPrograms: {
      assignedExpos: 0,
      coHost: 0,
      turnkey: 0,
      bulkBooking: 0
    },
    enterprises: {
      total: 0,
      invited: 0,
      registered: 0,
      profileCompleted: 0,
      expoActivated: 0,
      rfqGenerated: 0
    },
    quotas: {
      totalQuantity: 0,
      allocatedQuantity: 0,
      consumedQuantity: 0,
      availableQuantity: 0,
      activeInviteCampaigns: 0
    },
    bundles: {
      total: 0,
      published: 0,
      draft: 0,
      archived: 0
    },
    communications: {
      expoContextMessages: 0,
      activeContextTypes: 0
    },
    finance: {
      recordedRevenue: 0,
      partnerShare: 0,
      pendingSettlement: 0,
      settledSettlement: 0
    },
    reports: {
      expoOverviewReady: false,
      tradeActivityReady: false,
      industryInsightReady: false,
      buyerLeadsReady: false
    }
  }

  if (!organization) return empty

  const orgId = organization.id
  const [
    expoRows,
    enterpriseRows,
    dealRows,
    quotaRows,
    bundleRows,
    revenueRows,
    settlementRows,
    communicationRows
  ] = await Promise.all([
    sql`
      select
        count(*)::int as assigned_expos,
        count(*) filter (where partnership_model = 'co_host')::int as co_host,
        count(*) filter (where partnership_model = 'turnkey')::int as turnkey,
        count(*) filter (where partnership_model = 'tenant')::int as tenant,
        coalesce((
          select count(*)::int
          from seller_booth_registrations sbr
          inner join partner_expo_assignments pea on pea.expo_id = sbr.expo_id
          where pea.partner_org_id = ${orgId}
        ), 0)::int as expo_booths_used
      from partner_expo_assignments
      where partner_org_id = ${orgId}
    `,
    sql`
      select
        count(*) filter (where activation_status <> 'removed')::int as total,
        count(*) filter (where activation_status in ('invited', 'pending_acceptance'))::int as invited,
        count(*) filter (where activation_status = 'active')::int as registered,
        count(*) filter (where activation_status = 'active')::int as profile_completed,
        count(*) filter (where activation_status = 'active')::int as expo_activated,
        coalesce(sum(rfq_generated_count), 0)::int as rfq_generated,
        coalesce(sum(rfq_generated_count), 0)::int as rfq_generated_count,
        coalesce(sum(trade_signal_count), 0)::int as trade_signal_count
      from partner_enterprise_members
      where partner_org_id = ${orgId}
    `,
    sql`
      select
        count(*)::int as deal_contexts,
        count(*) filter (where stage = 'rfq_generated')::int as rfq_generated,
        count(*) filter (where stage not in ('closed_won', 'closed_lost'))::int as active_deal_contexts
      from partner_deal_contexts
      where partner_org_id = ${orgId}
    `,
    sql`
      select
        coalesce(sum(total_quantity), 0)::int as total_quantity,
        coalesce(sum(allocated_quantity), 0)::int as allocated_quantity,
        coalesce(sum(consumed_quantity), 0)::int as consumed_quantity,
        coalesce((
          select count(*)::int
          from partner_invite_campaigns
          where partner_org_id = ${orgId}
            and status = 'active'
        ), 0)::int as active_invite_campaigns
      from partner_quotas
      where partner_org_id = ${orgId}
    `,
    sql`
      select
        count(*)::int as total,
        count(*) filter (where status = 'published')::int as published,
        count(*) filter (where status = 'draft')::int as draft,
        count(*) filter (where status = 'archived')::int as archived
      from partner_service_bundles
      where partner_org_id = ${orgId}
    `,
    sql`
      select
        coalesce(sum(gross_amount), 0)::numeric as gross_amount,
        coalesce(sum(partner_amount), 0)::numeric as partner_amount,
        count(*) filter (where source_type = 'bundle_purchase')::int as bundle_sales
      from partner_revenue_events
      where partner_org_id = ${orgId}
    `,
    sql`
      select
        coalesce(sum(partner_amount) filter (where status = 'pending'), 0)::numeric as pending,
        coalesce(sum(partner_amount) filter (where status = 'settled'), 0)::numeric as settled
      from partner_settlements
      where partner_org_id = ${orgId}
    `,
    sql`
      select
        coalesce(count(lc.live_comment_id), 0)::int as expo_context_messages
      from partner_expo_assignments pea
      inner join go_live_events gle on gle.expo_id = pea.expo_id
      inner join live_comments lc on lc.stream_session_id = gle.stream_session_id
      where pea.partner_org_id = ${orgId}
        and lc.is_deleted = false
    `
  ])

  const expo = (
    expoRows as {
      assigned_expos: number | string
      co_host: number | string
      turnkey: number | string
      tenant: number | string
      expo_booths_used: number | string
    }[]
  )[0]
  const enterprise = (
    enterpriseRows as {
      total: number | string
      invited: number | string
      registered: number | string
      profile_completed: number | string
      expo_activated: number | string
      rfq_generated: number | string
      rfq_generated_count: number | string
      trade_signal_count: number | string
    }[]
  )[0]
  const deal = (
    dealRows as {
      deal_contexts: number | string
      rfq_generated: number | string
      active_deal_contexts: number | string
    }[]
  )[0]
  const quota = (
    quotaRows as {
      total_quantity: number | string
      allocated_quantity: number | string
      consumed_quantity: number | string
      active_invite_campaigns: number | string
    }[]
  )[0]
  const bundle = (
    bundleRows as {
      total: number | string
      published: number | string
      draft: number | string
      archived: number | string
    }[]
  )[0]
  const revenue = (
    revenueRows as {
      gross_amount: number | string
      partner_amount: number | string
      bundle_sales: number | string
    }[]
  )[0]
  const settlement = (
    settlementRows as {
      pending: number | string
      settled: number | string
    }[]
  )[0]
  const communication = (
    communicationRows as {
      expo_context_messages: number | string
    }[]
  )[0]

  const quotaTotal = toNumber(quota?.total_quantity)
  const quotaAllocated = toNumber(quota?.allocated_quantity)
  const quotaConsumed = toNumber(quota?.consumed_quantity)
  const rfqGenerated =
    toNumber(deal?.rfq_generated) ||
    toNumber(enterprise?.rfq_generated_count) ||
    toNumber(enterprise?.rfq_generated)
  const dealContexts = toNumber(deal?.deal_contexts) || rfqGenerated
  const assignedExpos = toNumber(expo?.assigned_expos)
  const bundleSales = toNumber(revenue?.bundle_sales)

  return {
    ...empty,
    overview: {
      enterprisesActivated: toNumber(enterprise?.expo_activated),
      expoBoothsUsed: toNumber(expo?.expo_booths_used),
      activeInviteCampaigns: toNumber(quota?.active_invite_campaigns),
      rfqGenerated,
      dealContexts,
      bundleSales,
      partnerRevenue: toNumber(revenue?.partner_amount)
    },
    expoPrograms: {
      assignedExpos,
      coHost: toNumber(expo?.co_host),
      turnkey: toNumber(expo?.turnkey),
      bulkBooking: quotaTotal
    },
    enterprises: {
      total: toNumber(enterprise?.total),
      invited: toNumber(enterprise?.invited),
      registered: toNumber(enterprise?.registered),
      profileCompleted: toNumber(enterprise?.profile_completed),
      expoActivated: toNumber(enterprise?.expo_activated),
      rfqGenerated
    },
    quotas: {
      totalQuantity: quotaTotal,
      allocatedQuantity: quotaAllocated,
      consumedQuantity: quotaConsumed,
      availableQuantity: Math.max(
        quotaTotal - quotaAllocated - quotaConsumed,
        0
      ),
      activeInviteCampaigns: toNumber(quota?.active_invite_campaigns)
    },
    bundles: {
      total: toNumber(bundle?.total),
      published: toNumber(bundle?.published),
      draft: toNumber(bundle?.draft),
      archived: toNumber(bundle?.archived)
    },
    communications: {
      expoContextMessages: toNumber(communication?.expo_context_messages),
      activeContextTypes:
        assignedExpos > 0 || bundleSales > 0 || rfqGenerated > 0 ? 1 : 0
    },
    finance: {
      recordedRevenue: toNumber(revenue?.gross_amount),
      partnerShare: toNumber(revenue?.partner_amount),
      pendingSettlement: toNumber(settlement?.pending),
      settledSettlement: toNumber(settlement?.settled)
    },
    reports: {
      expoOverviewReady: assignedExpos > 0,
      tradeActivityReady: rfqGenerated > 0,
      industryInsightReady: toNumber(enterprise?.trade_signal_count) > 0,
      buyerLeadsReady: rfqGenerated > 0
    }
  }
}

async function requirePrimaryPartnerOrganization(
  userId: string
): Promise<PartnerPortalOrganization> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) {
    throw new Error("No active partner organization found.")
  }
  return organization
}

async function requirePartnerQuota(
  userId: string,
  quotaId: string
): Promise<{ organization: PartnerPortalOrganization; quota: PartnerQuota }> {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    select
      id,
      quota_type,
      label,
      total_quantity,
      allocated_quantity,
      consumed_quantity,
      created_at
    from partner_quotas
    where id = ${quotaId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as {
    id: string
    quota_type: PartnerQuota["quotaType"]
    label: string
    total_quantity: number | string
    allocated_quantity: number | string
    consumed_quantity: number | string
    created_at: string | Date
  }[]

  const row = rows[0]
  if (!row) throw new Error("Quota not found.")

  const totalQuantity = toNumber(row.total_quantity)
  const allocatedQuantity = toNumber(row.allocated_quantity)
  const consumedQuantity = toNumber(row.consumed_quantity)
  return {
    organization,
    quota: {
      id: row.id,
      quotaType: row.quota_type,
      label: row.label,
      totalQuantity,
      allocatedQuantity,
      consumedQuantity,
      availableQuantity: Math.max(
        totalQuantity - allocatedQuantity - consumedQuantity,
        0
      ),
      createdAt: toIso(row.created_at)
    }
  }
}

async function recordPartnerEnterpriseAssociationAudit(input: {
  associationId: string
  partnerOrgId: string
  partnerOrgName: string
  enterpriseId?: string | null
  enterpriseName: string
  action: PartnerEnterpriseAssociationAuditAction
  oldStatus?: PartnerEnterpriseMember["activationStatus"] | null
  newStatus: PartnerEnterpriseMember["activationStatus"]
  source: string
  actorType: PartnerEnterpriseAssociationAuditActor
  actorId?: string | null
  reason?: string | null
}) {
  await sql`
    insert into partner_enterprise_member_audit_events (
      id,
      association_id,
      partner_org_id,
      partner_org_name,
      enterprise_id,
      enterprise_name,
      action,
      old_status,
      new_status,
      source,
      actor_type,
      actor_id,
      actor_label,
      reason
    )
    values (
      ${`partner-enterprise-audit-${randomUUID()}`},
      ${input.associationId},
      ${input.partnerOrgId},
      ${input.partnerOrgName},
      ${input.enterpriseId ?? null},
      ${input.enterpriseName},
      ${input.action},
      ${input.oldStatus ?? null},
      ${input.newStatus},
      ${input.source},
      ${input.actorType},
      ${input.actorId ?? null},
      ${input.actorId ?? input.actorType},
      ${input.reason?.trim() || null}
    )
  `
}

async function notifyPartnerCompanyAccepted(input: {
  partnerOrgId: string
  associationId: string
  enterpriseName: string
  enterpriseId?: string | null
  acceptedByUserId: string
}) {
  const recipients = (await sql`
    select user_id
    from partner_memberships
    where partner_org_id = ${input.partnerOrgId}
      and membership_role in ('partner_owner', 'partner_admin')
      and membership_status = 'active'
  `) as { user_id: string }[]

  await Promise.allSettled(
    recipients.map((recipient) =>
      publishNotification({
        userId: recipient.user_id,
        source: "partner_portal",
        type: "partner_company_association_accepted",
        title: "Company accepted Tenant invitation",
        body: "A Company has accepted your Tenant invite and is now active.",
        deepLinkPath: "/partner/enterprises",
        referenceId: input.associationId,
        referenceType: "partner_enterprise_member"
      })
    )
  )
}

async function requirePartnerEnterpriseMember(
  userId: string,
  memberId: string
): Promise<{
  organization: PartnerPortalOrganization
  member: PartnerEnterpriseMember
}> {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    select
      id,
      enterprise_id,
      enterprise_name,
      contact_email,
      activation_status,
      source,
      relationship_type,
      public_profile,
      last_action,
      accepted_at,
      removed_at,
      removed_reason,
      expo_participation_count,
      rfq_generated_count,
      trade_signal_count
    from partner_enterprise_members
    where id = ${memberId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as {
    id: string
    enterprise_id: string | null
    enterprise_name: string
    contact_email: string | null
    logo_url: string | null
    activation_status: PartnerEnterpriseMember["activationStatus"]
    source: string
    relationship_type: string
    public_profile: boolean
    last_action: string | null
    accepted_at: string | Date | null
    removed_at: string | Date | null
    removed_reason: string | null
    expo_participation_count: number | string
    rfq_generated_count: number | string
    trade_signal_count: number | string
  }[]

  const row = rows[0]
  if (!row) throw new Error("Enterprise member not found.")

  return {
    organization,
    member: {
      id: row.id,
      enterpriseId: row.enterprise_id,
      enterpriseName: row.enterprise_name,
      contactEmail: row.contact_email,
      logoUrl: null,
      activationStatus: row.activation_status,
      source: row.source,
      relationshipType: row.relationship_type,
      publicProfile: row.public_profile,
      lastAction: row.last_action,
      acceptedAt: row.accepted_at ? toIso(row.accepted_at) : null,
      removedAt: row.removed_at ? toIso(row.removed_at) : null,
      removedReason: row.removed_reason,
      createdAt: "",
      updatedAt: "",
      expoParticipationCount: toNumber(row.expo_participation_count),
      rfqGeneratedCount: toNumber(row.rfq_generated_count),
      tradeSignalCount: toNumber(row.trade_signal_count),
      dealContextStage: null,
      dealContextEvents: 0,
      quotaAllocatedQuantity: 0,
      quotaConsumedQuantity: 0
    }
  }
}

async function ensurePartnerDealContext(input: {
  organizationId: string
  enterpriseMemberId: string
  actorUserId: string
  toStage: PartnerDealContextStage
  note?: string
}) {
  const existingRows = (await sql`
    select id, stage
    from partner_deal_contexts
    where partner_org_id = ${input.organizationId}
      and enterprise_member_id = ${input.enterpriseMemberId}
    order by created_at desc
    limit 1
  `) as { id: string; stage: PartnerDealContextStage }[]

  const existing = existingRows[0]
  const dealContextId = existing?.id ?? `partner-deal-context-${randomUUID()}`

  if (existing) {
    await sql`
      update partner_deal_contexts
      set
        stage = ${input.toStage},
        owner_user_id = ${input.actorUserId},
        updated_at = now(),
        closed_at = case
          when ${input.toStage} in ('closed_won', 'closed_lost') then now()
          else null
        end
      where id = ${dealContextId}
    `
  } else {
    await sql`
      insert into partner_deal_contexts (
        id,
        partner_org_id,
        enterprise_member_id,
        stage,
        owner_user_id
      )
      values (
        ${dealContextId},
        ${input.organizationId},
        ${input.enterpriseMemberId},
        ${input.toStage},
        ${input.actorUserId}
      )
    `
  }

  if (existing?.stage !== input.toStage) {
    await sql`
      insert into partner_deal_context_events (
        id,
        deal_context_id,
        partner_org_id,
        enterprise_member_id,
        from_stage,
        to_stage,
        actor_user_id,
        note
      )
      values (
        ${`partner-deal-context-event-${randomUUID()}`},
        ${dealContextId},
        ${input.organizationId},
        ${input.enterpriseMemberId},
        ${existing?.stage ?? null},
        ${input.toStage},
        ${input.actorUserId},
        ${input.note ?? null}
      )
    `
  }
}

export type PartnerMiniSiteVersion = {
  id: string
  partnerOrgId: string
  versionLabel: string
  status: PartnerMiniSiteStatus
  content: Record<string, unknown>
  rejectReason: string | null
  submittedAt: string | null
  publishedAt: string | null
  updatedAt: string
}

export async function listPartnerMiniSiteVersions(
  userId: string
): Promise<PartnerMiniSiteVersion[]> {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    select
      id,
      partner_org_id,
      version_label,
      status,
      content_json,
      reject_reason,
      submitted_at,
      published_at,
      updated_at
    from partner_mini_sites
    where partner_org_id = ${organization.id}
    order by updated_at desc
  `) as {
    id: string
    partner_org_id: string
    version_label: string
    status: PartnerMiniSiteStatus
    content_json: Record<string, unknown>
    reject_reason: string | null
    submitted_at: string | Date | null
    published_at: string | Date | null
    updated_at: string | Date
  }[]

  return rows.map((row) => ({
    id: row.id,
    partnerOrgId: row.partner_org_id,
    versionLabel: row.version_label,
    status: row.status,
    content: row.content_json,
    rejectReason: row.reject_reason,
    submittedAt: row.submitted_at ? toIso(row.submitted_at) : null,
    publishedAt: row.published_at ? toIso(row.published_at) : null,
    updatedAt: toIso(row.updated_at)
  }))
}

export async function savePartnerMiniSiteDraft(
  userId: string,
  content: Record<string, unknown>
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  await sql`begin`
  try {
    const submittedRows = (await sql`
      select id
      from partner_mini_sites
      where partner_org_id = ${organization.id}
        and status = 'submitted'
      for update
      limit 1
    `) as { id: string }[]

    if (submittedRows.length > 0) {
      throw new Error("Mini-site version is under Admin review.")
    }

    const existingRows = (await sql`
      select id, status
      from partner_mini_sites
      where partner_org_id = ${organization.id}
        and status in ('draft', 'draft_update', 'rejected')
      order by updated_at desc
      for update
      limit 1
    `) as { id: string; status: PartnerMiniSiteStatus }[]

    const existing = existingRows[0]
    if (existing) {
      const nextStatus =
        existing.status === "rejected" ? "draft" : existing.status
      await sql`
        update partner_mini_sites
        set
          status = ${nextStatus},
          content_json = ${JSON.stringify(content)}::jsonb,
          updated_at = now()
        where id = ${existing.id}
      `
      await sql`commit`
      return { id: existing.id, status: nextStatus }
    }

    const publishedRows = (await sql`
      select id
      from partner_mini_sites
      where partner_org_id = ${organization.id}
        and status = 'published'
      for update
      limit 1
    `) as { id: string }[]

    const status: PartnerMiniSiteStatus = publishedRows[0]
      ? "draft_update"
      : "draft"
    const id = `partner-mini-site-${randomUUID()}`
    await sql`
      insert into partner_mini_sites (
        id,
        partner_org_id,
        version_label,
        status,
        content_json
      )
      values (
        ${id},
        ${organization.id},
        ${status === "draft_update" ? "Draft update" : "Initial draft"},
        ${status},
        ${JSON.stringify(content)}::jsonb
      )
    `
    await sql`commit`
    return { id, status }
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function submitPartnerMiniSiteDraft(
  userId: string,
  miniSiteId: string,
  submitNote?: string | null
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    select status, content_json
    from partner_mini_sites
    where id = ${miniSiteId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as {
    status: PartnerMiniSiteStatus
    content_json: Record<string, unknown>
  }[]

  const current = rows[0]
  if (!current) throw new Error("Mini-site version not found.")
  if (
    !canTransitionMiniSiteStatus({
      actorRole: normalizePartnerRole(organization.membershipRole),
      from: current.status,
      to: "submitted"
    })
  ) {
    throw new Error(
      "Mini-site version cannot be submitted from current status."
    )
  }

  const branding = current.content_json.branding as
    | { tenantName?: unknown; ctaOption?: unknown }
    | undefined
  if (typeof branding?.tenantName !== "string" || !branding.tenantName.trim()) {
    throw new Error("Public display name is required.")
  }
  const allowedCtaOptions = new Set([
    "contact_tenant",
    "view_member_companies",
    "view_assigned_expos",
    "contact_arobid"
  ])
  if (
    typeof branding.ctaOption !== "string" ||
    !allowedCtaOptions.has(branding.ctaOption)
  ) {
    throw new Error("CTA option is invalid.")
  }

  const updatedRows = (await sql`
    update partner_mini_sites
    set
      status = 'submitted',
      submitted_by_user_id = ${userId},
      submitted_at = now(),
      updated_at = now()
    where id = ${miniSiteId}
      and partner_org_id = ${organization.id}
      and status = ${current.status}
    returning id
  `) as { id: string }[]

  if (updatedRows.length === 0) {
    throw new Error(
      "Mini-site version cannot be submitted from current status."
    )
  }

  await sql`
    insert into partner_mini_site_review_events (
      id,
      mini_site_id,
      partner_org_id,
      from_status,
      to_status,
      actor_user_id,
      reason
    )
    values (
      ${`partner-mini-site-submit-${randomUUID()}`},
      ${miniSiteId},
      ${organization.id},
      ${current.status},
      'submitted',
      ${userId},
      ${submitNote?.trim() || null}
    )
  `
}

export async function getPartnerQuotaWorkspace(
  userId: string
): Promise<PartnerQuotaWorkspace> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) {
    return {
      organization: null,
      quotas: [],
      enterpriseMembers: [],
      inviteCampaigns: []
    }
  }

  const orgId = organization.id
  const [quotaRows, memberRows, campaignRows] = await Promise.all([
    sql`
        select
          id,
          quota_type,
          label,
          total_quantity,
          allocated_quantity,
          consumed_quantity,
          created_at
        from partner_quotas
        where partner_org_id = ${orgId}
        order by created_at desc
      `,
    sql`
        select
          pem.id,
          pem.enterprise_name,
          pem.contact_email,
          c.logo_url,
          pem.activation_status,
          pem.source,
          pem.relationship_type,
          pem.public_profile,
          pem.last_action,
          pem.accepted_at,
          pem.removed_at,
          pem.removed_reason,
          pem.created_at,
          pem.updated_at,
          pem.expo_participation_count,
          pem.rfq_generated_count,
          pem.trade_signal_count
        from partner_enterprise_members pem
        left join companies c on c.id = pem.enterprise_id
        where pem.partner_org_id = ${orgId}
        order by pem.created_at desc
      `,
    sql`
        select
          pic.id,
          pic.name,
          pic.invite_code,
          pic.quota_id,
          pq.label as quota_label,
          pic.status,
          pic.claimed_count,
          pic.created_at
        from partner_invite_campaigns pic
        left join partner_quotas pq on pq.id = pic.quota_id
        where pic.partner_org_id = ${orgId}
        order by pic.created_at desc
      `
  ])

  return {
    organization,
    quotas: (
      quotaRows as {
        id: string
        quota_type: PartnerQuota["quotaType"]
        label: string
        total_quantity: number | string
        allocated_quantity: number | string
        consumed_quantity: number | string
        created_at: string | Date
      }[]
    ).map((row) => {
      const totalQuantity = toNumber(row.total_quantity)
      const allocatedQuantity = toNumber(row.allocated_quantity)
      const consumedQuantity = toNumber(row.consumed_quantity)
      return {
        id: row.id,
        quotaType: row.quota_type,
        label: row.label,
        totalQuantity,
        allocatedQuantity,
        consumedQuantity,
        availableQuantity: Math.max(
          totalQuantity - allocatedQuantity - consumedQuantity,
          0
        ),
        createdAt: toIso(row.created_at)
      }
    }),
    enterpriseMembers: (
      memberRows as {
        id: string
        enterprise_name: string
        contact_email: string | null
        logo_url: string | null
        activation_status: PartnerEnterpriseMember["activationStatus"]
        source: string
        relationship_type: string
        public_profile: boolean
        last_action: string | null
        accepted_at: string | Date | null
        removed_at: string | Date | null
        removed_reason: string | null
        created_at: string | Date
        updated_at: string | Date
        expo_participation_count: number | string
        rfq_generated_count: number | string
        trade_signal_count: number | string
      }[]
    ).map((row) => ({
      id: row.id,
      enterpriseName: row.enterprise_name,
      contactEmail: row.contact_email,
      logoUrl: row.logo_url,
      activationStatus: row.activation_status,
      source: row.source,
      relationshipType: row.relationship_type,
      publicProfile: row.public_profile,
      lastAction: row.last_action,
      acceptedAt: row.accepted_at ? toIso(row.accepted_at) : null,
      removedAt: row.removed_at ? toIso(row.removed_at) : null,
      removedReason: row.removed_reason,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      expoParticipationCount: toNumber(row.expo_participation_count),
      rfqGeneratedCount: toNumber(row.rfq_generated_count),
      tradeSignalCount: toNumber(row.trade_signal_count)
    })),
    inviteCampaigns: (
      campaignRows as {
        id: string
        name: string
        invite_code: string
        quota_id: string | null
        quota_label: string | null
        status: PartnerInviteCampaign["status"]
        claimed_count: number | string
        created_at: string | Date
      }[]
    ).map((row) => ({
      id: row.id,
      name: row.name,
      inviteCode: row.invite_code,
      quotaId: row.quota_id,
      quotaLabel: row.quota_label,
      status: row.status,
      claimedCount: toNumber(row.claimed_count),
      createdAt: toIso(row.created_at)
    }))
  }
}

export async function getPartnerExpoProgramsWorkspace(
  userId: string
): Promise<PartnerExpoProgramsWorkspace> {
  const [assignedExpos, quotaWorkspace] = await Promise.all([
    listPartnerAssignedExpos(userId),
    getPartnerQuotaWorkspace(userId)
  ])

  return {
    assignedExpos,
    quotaWorkspace
  }
}

function mapPartnerServiceBundle(row: {
  id: string
  name: string
  description: string
  partner_service_price: number | string
  arobid_service_price: number | string
  discount_amount: number | string
  partner_share_percent: number | string
  status: PartnerServiceBundle["status"]
  created_at: string | Date
}): PartnerServiceBundle {
  const partnerServicePrice = toNumber(row.partner_service_price)
  const arobidServicePrice = toNumber(row.arobid_service_price)
  const discountAmount = toNumber(row.discount_amount)
  const totalPrice = Math.max(
    partnerServicePrice + arobidServicePrice - discountAmount,
    0
  )
  const partnerSharePercent = toNumber(row.partner_share_percent)
  const partnerShareAmount = Math.round(
    (totalPrice * partnerSharePercent) / 100
  )

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    partnerServicePrice,
    arobidServicePrice,
    discountAmount,
    totalPrice,
    partnerSharePercent,
    partnerShareAmount,
    arobidShareAmount: Math.max(totalPrice - partnerShareAmount, 0),
    status: row.status,
    createdAt: toIso(row.created_at)
  }
}

export async function getPartnerBundlesWorkspace(
  userId: string
): Promise<PartnerBundlesWorkspace> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) {
    return {
      organization: null,
      bundles: [],
      revenueEvents: [],
      serviceExecutions: [],
      totals: {
        published: 0,
        draft: 0,
        archived: 0,
        grossRevenue: 0,
        partnerRevenue: 0,
        arobidRevenue: 0
      }
    }
  }

  const [bundleRows, revenueRows, executionRows] = await Promise.all([
    sql`
      select
        id,
        name,
        description,
        partner_service_price,
        arobid_service_price,
        discount_amount,
        partner_share_percent,
        status,
        created_at
      from partner_service_bundles
      where partner_org_id = ${organization.id}
      order by created_at desc
    `,
    sql`
      select
        id,
        source_type,
        source_id,
        model_type,
        gross_amount,
        partner_amount,
        arobid_amount,
        status,
        created_at
      from partner_revenue_events
      where partner_org_id = ${organization.id}
      order by created_at desc
      limit 20
    `,
    sql`
      select
        pse.id,
        pse.bundle_id,
        psb.name as bundle_name,
        pse.status,
        pse.scheduled_at,
        pse.sla_due_at,
        coalesce(count(psee.id), 0)::int as event_count
      from partner_service_executions pse
      inner join partner_service_bundles psb on psb.id = pse.bundle_id
      left join partner_service_execution_events psee on psee.execution_id = pse.id
      where pse.partner_org_id = ${organization.id}
      group by pse.id, psb.name
      order by pse.updated_at desc
      limit 20
    `
  ])

  const bundles = (
    bundleRows as {
      id: string
      name: string
      description: string
      partner_service_price: number | string
      arobid_service_price: number | string
      discount_amount: number | string
      partner_share_percent: number | string
      status: PartnerServiceBundle["status"]
      created_at: string | Date
    }[]
  ).map(mapPartnerServiceBundle)

  const revenueEvents = (
    revenueRows as Parameters<typeof mapPartnerRevenueEvent>[0][]
  ).map(mapPartnerRevenueEvent)
  const serviceExecutions = (
    executionRows as {
      id: string
      bundle_id: string
      bundle_name: string
      status: PartnerServiceExecutionStatus
      scheduled_at: string | Date
      sla_due_at: string | Date | null
      event_count: number | string
    }[]
  ).map((row) => ({
    id: row.id,
    bundleId: row.bundle_id,
    bundleName: row.bundle_name,
    status: row.status,
    eventCount: toNumber(row.event_count),
    scheduledAt: toIso(row.scheduled_at),
    slaDueAt: row.sla_due_at ? toIso(row.sla_due_at) : null
  }))

  return {
    organization,
    bundles,
    revenueEvents,
    serviceExecutions,
    totals: {
      published: bundles.filter((bundle) => bundle.status === "published")
        .length,
      draft: bundles.filter((bundle) => bundle.status === "draft").length,
      archived: bundles.filter((bundle) => bundle.status === "archived").length,
      grossRevenue: revenueEvents.reduce(
        (sum, event) => sum + event.grossAmount,
        0
      ),
      partnerRevenue: revenueEvents.reduce(
        (sum, event) => sum + event.partnerAmount,
        0
      ),
      arobidRevenue: revenueEvents.reduce(
        (sum, event) => sum + event.arobidAmount,
        0
      )
    }
  }
}

export async function createPartnerServiceBundle(
  userId: string,
  input: {
    name: string
    description?: string | null
    partnerServicePrice: number
    arobidServicePrice: number
    discountAmount: number
    partnerSharePercent: number
  }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const name = input.name.trim()
  if (!name) throw new Error("Bundle name is required.")
  const partnerSharePercent = Math.min(
    Math.max(Number(input.partnerSharePercent) || 0, 0),
    100
  )
  const id = `partner-bundle-${randomUUID()}`

  await sql`
    insert into partner_service_bundles (
      id,
      partner_org_id,
      name,
      description,
      partner_service_price,
      arobid_service_price,
      discount_amount,
      partner_share_percent,
      status
    )
    values (
      ${id},
      ${organization.id},
      ${name},
      ${input.description?.trim() || ""},
      ${Math.max(Number(input.partnerServicePrice) || 0, 0)},
      ${Math.max(Number(input.arobidServicePrice) || 0, 0)},
      ${Math.max(Number(input.discountAmount) || 0, 0)},
      ${partnerSharePercent},
      'draft'
    )
  `

  return { id }
}

export async function updatePartnerServiceBundle(
  userId: string,
  bundleId: string,
  input: {
    name: string
    description?: string | null
    partnerServicePrice: number
    arobidServicePrice: number
    discountAmount: number
    partnerSharePercent: number
  }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const name = input.name.trim()
  if (!name) throw new Error("Bundle name is required.")

  const rows = (await sql`
    update partner_service_bundles
    set
      name = ${name},
      description = ${input.description?.trim() || ""},
      partner_service_price = ${Math.max(Number(input.partnerServicePrice) || 0, 0)},
      arobid_service_price = ${Math.max(Number(input.arobidServicePrice) || 0, 0)},
      discount_amount = ${Math.max(Number(input.discountAmount) || 0, 0)},
      partner_share_percent = ${Math.min(Math.max(Number(input.partnerSharePercent) || 0, 0), 100)},
      updated_at = now()
    where id = ${bundleId}
      and partner_org_id = ${organization.id}
    returning id
  `) as { id: string }[]

  if (rows.length === 0) throw new Error("Bundle not found.")
}

export async function updatePartnerServiceBundleStatus(
  userId: string,
  bundleId: string,
  status: PartnerServiceBundle["status"]
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    update partner_service_bundles
    set status = ${status}, updated_at = now()
    where id = ${bundleId}
      and partner_org_id = ${organization.id}
    returning id
  `) as { id: string }[]

  if (rows.length === 0) throw new Error("Bundle not found.")
}

export async function recordPartnerBundlePurchase(
  userId: string,
  bundleId: string
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    select
      id,
      name,
      description,
      partner_service_price,
      arobid_service_price,
      discount_amount,
      partner_share_percent,
      status,
      created_at
    from partner_service_bundles
    where id = ${bundleId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as {
    id: string
    name: string
    description: string
    partner_service_price: number | string
    arobid_service_price: number | string
    discount_amount: number | string
    partner_share_percent: number | string
    status: PartnerServiceBundle["status"]
    created_at: string | Date
  }[]

  const row = rows[0]
  if (!row) throw new Error("Bundle not found.")
  if (row.status !== "published") {
    throw new Error("Only published bundles can be purchased.")
  }

  const bundle = mapPartnerServiceBundle(row)
  const id = `partner-revenue-${randomUUID()}`
  await sql`
    insert into partner_revenue_events (
      id,
      partner_org_id,
      source_type,
      source_id,
      gross_amount,
      partner_amount,
      arobid_amount,
      status
    )
    values (
      ${id},
      ${organization.id},
      'bundle_purchase',
      ${bundle.id},
      ${bundle.totalPrice},
      ${bundle.partnerShareAmount},
      ${bundle.arobidShareAmount},
      'recorded'
    )
  `

  const executionId = `partner-service-execution-${randomUUID()}`
  await sql`
    insert into partner_service_executions (
      id,
      partner_org_id,
      bundle_id,
      revenue_event_id,
      owner_user_id,
      sla_due_at
    )
    values (
      ${executionId},
      ${organization.id},
      ${bundle.id},
      ${id},
      ${userId},
      now() + interval '14 days'
    )
  `
  await sql`
    insert into partner_service_execution_events (
      id,
      execution_id,
      partner_org_id,
      from_status,
      to_status,
      actor_user_id,
      note
    )
    values (
      ${`partner-service-execution-event-${randomUUID()}`},
      ${executionId},
      ${organization.id},
      null,
      'scheduled',
      ${userId},
      'Bundle purchase created service execution.'
    )
  `

  return { id, executionId }
}

export async function updatePartnerServiceExecutionStatus(
  userId: string,
  executionId: string,
  status: PartnerServiceExecutionStatus
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    select status
    from partner_service_executions
    where id = ${executionId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as { status: PartnerServiceExecutionStatus }[]

  const current = rows[0]
  if (!current) throw new Error("Service execution not found.")
  const allowed: Record<
    PartnerServiceExecutionStatus,
    PartnerServiceExecutionStatus[]
  > = {
    scheduled: ["in_progress", "canceled"],
    in_progress: ["delivered", "canceled"],
    delivered: ["closed"],
    closed: [],
    canceled: []
  }
  if (!allowed[current.status].includes(status)) {
    throw new Error("Invalid service execution transition.")
  }

  await sql`
    update partner_service_executions
    set
      status = ${status},
      started_at = case when ${status} = 'in_progress' then now() else started_at end,
      delivered_at = case when ${status} = 'delivered' then now() else delivered_at end,
      closed_at = case when ${status} in ('closed', 'canceled') then now() else closed_at end,
      updated_at = now()
    where id = ${executionId}
      and partner_org_id = ${organization.id}
  `
  await sql`
    insert into partner_service_execution_events (
      id,
      execution_id,
      partner_org_id,
      from_status,
      to_status,
      actor_user_id
    )
    values (
      ${`partner-service-execution-event-${randomUUID()}`},
      ${executionId},
      ${organization.id},
      ${current.status},
      ${status},
      ${userId}
    )
  `
}

function mapPartnerRevenueEvent(row: {
  id: string
  source_type: string
  source_id: string | null
  model_type: PartnerRevenueModelType
  gross_amount: number | string
  partner_amount: number | string
  arobid_amount: number | string
  status: string
  created_at: string | Date
}): PartnerRevenueEvent {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    modelType: row.model_type,
    grossAmount: toNumber(row.gross_amount),
    partnerAmount: toNumber(row.partner_amount),
    arobidAmount: toNumber(row.arobid_amount),
    status: row.status,
    createdAt: toIso(row.created_at)
  }
}

function mapPartnerSettlement(row: {
  id: string
  cycle_month: string
  gross_amount: number | string
  partner_amount: number | string
  arobid_amount: number | string
  status: PartnerSettlement["status"]
  created_at: string | Date
  settled_at: string | Date | null
}): PartnerSettlement {
  return {
    id: row.id,
    cycleMonth: row.cycle_month,
    grossAmount: toNumber(row.gross_amount),
    partnerAmount: toNumber(row.partner_amount),
    arobidAmount: toNumber(row.arobid_amount),
    status: row.status,
    auditEvents: [],
    createdAt: toIso(row.created_at),
    settledAt: row.settled_at ? toIso(row.settled_at) : null
  }
}

async function recordPartnerSettlementAudit(input: {
  organizationId: string
  settlementId: string
  eventType: string
  actorUserId: string
  payload?: Record<string, unknown>
}) {
  await sql`
    insert into partner_settlement_audit_log (
      id,
      partner_org_id,
      settlement_id,
      event_type,
      actor_user_id,
      payload_json
    )
    values (
      ${`partner-settlement-audit-${randomUUID()}`},
      ${input.organizationId},
      ${input.settlementId},
      ${input.eventType},
      ${input.actorUserId},
      ${JSON.stringify(input.payload ?? {})}::jsonb
    )
  `
}

export async function getPartnerFinanceWorkspace(
  userId: string
): Promise<PartnerFinanceWorkspace> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) {
    return {
      organization: null,
      revenueEvents: [],
      settlements: [],
      cycleOptions: [],
      totals: {
        recordedRevenue: 0,
        partnerShare: 0,
        arobidShare: 0,
        wholesaleRevenue: 0,
        platformBillingRevenue: 0,
        pendingSettlement: 0,
        settledSettlement: 0
      }
    }
  }

  const [revenueRows, settlementRows, auditRows, cycleRows] = await Promise.all(
    [
      sql`
      select
        id,
        source_type,
        source_id,
        model_type,
        gross_amount,
        partner_amount,
        arobid_amount,
        status,
        created_at
      from partner_revenue_events
      where partner_org_id = ${organization.id}
      order by created_at desc
      limit 50
    `,
      sql`
      select
        id,
        cycle_month,
        gross_amount,
        partner_amount,
        arobid_amount,
        status,
        created_at,
        settled_at
      from partner_settlements
      where partner_org_id = ${organization.id}
      order by cycle_month desc
    `,
      sql`
      select
        id,
        settlement_id,
        event_type,
        actor_user_id,
        payload_json,
        created_at
      from partner_settlement_audit_log
      where partner_org_id = ${organization.id}
      order by created_at asc
    `,
      sql`
      select distinct to_char(created_at, 'YYYY-MM') as cycle_month
      from partner_revenue_events
      where partner_org_id = ${organization.id}
      order by cycle_month desc
    `
    ]
  )

  const revenueEvents = (
    revenueRows as Parameters<typeof mapPartnerRevenueEvent>[0][]
  ).map(mapPartnerRevenueEvent)
  const auditEvents = (
    auditRows as {
      id: string
      settlement_id: string
      event_type: string
      actor_user_id: string | null
      payload_json: Record<string, unknown>
      created_at: string | Date
    }[]
  ).map((row) => ({
    id: row.id,
    settlementId: row.settlement_id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    payload: row.payload_json,
    createdAt: toIso(row.created_at)
  }))
  const settlements = (
    settlementRows as Parameters<typeof mapPartnerSettlement>[0][]
  )
    .map(mapPartnerSettlement)
    .map((settlement) => ({
      ...settlement,
      auditEvents: auditEvents.filter(
        (event) => event.settlementId === settlement.id
      )
    }))

  return {
    organization,
    revenueEvents,
    settlements,
    cycleOptions: (cycleRows as { cycle_month: string }[]).map(
      (row) => row.cycle_month
    ),
    totals: {
      recordedRevenue: revenueEvents.reduce(
        (sum, event) => sum + event.grossAmount,
        0
      ),
      partnerShare: revenueEvents.reduce(
        (sum, event) => sum + event.partnerAmount,
        0
      ),
      arobidShare: revenueEvents.reduce(
        (sum, event) => sum + event.arobidAmount,
        0
      ),
      wholesaleRevenue: revenueEvents
        .filter((event) => event.modelType === "wholesale_partner")
        .reduce((sum, event) => sum + event.grossAmount, 0),
      platformBillingRevenue: revenueEvents
        .filter((event) => event.modelType === "platform_billing")
        .reduce((sum, event) => sum + event.grossAmount, 0),
      pendingSettlement: settlements
        .filter((settlement) => settlement.status === "pending")
        .reduce((sum, settlement) => sum + settlement.partnerAmount, 0),
      settledSettlement: settlements
        .filter((settlement) => settlement.status === "settled")
        .reduce((sum, settlement) => sum + settlement.partnerAmount, 0)
    }
  }
}

export async function createPartnerMonthlySettlement(
  userId: string,
  cycleMonth: string
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  if (!/^\d{4}-\d{2}$/.test(cycleMonth)) {
    throw new Error("Cycle month must use YYYY-MM format.")
  }

  const rows = (await sql`
    select
      coalesce(sum(gross_amount), 0)::numeric as gross_amount,
      coalesce(sum(partner_amount), 0)::numeric as partner_amount,
      coalesce(sum(arobid_amount), 0)::numeric as arobid_amount
    from partner_revenue_events
    where partner_org_id = ${organization.id}
      and to_char(created_at, 'YYYY-MM') = ${cycleMonth}
  `) as {
    gross_amount: number | string
    partner_amount: number | string
    arobid_amount: number | string
  }[]

  const summary = rows[0]
  const grossAmount = toNumber(summary?.gross_amount)
  const partnerAmount = toNumber(summary?.partner_amount)
  const arobidAmount = toNumber(summary?.arobid_amount)
  if (grossAmount <= 0) {
    throw new Error("No revenue events found for this cycle.")
  }

  const id = `partner-settlement-${randomUUID()}`
  const idRows = (await sql`
    insert into partner_settlements (
      id,
      partner_org_id,
      cycle_month,
      gross_amount,
      partner_amount,
      arobid_amount,
      status
    )
    values (
      ${id},
      ${organization.id},
      ${cycleMonth},
      ${grossAmount},
      ${partnerAmount},
      ${arobidAmount},
      'pending'
    )
    on conflict (partner_org_id, cycle_month) do update
    set
      gross_amount = excluded.gross_amount,
      partner_amount = excluded.partner_amount,
      arobid_amount = excluded.arobid_amount,
      status = case
        when partner_settlements.status = 'settled' then partner_settlements.status
        else 'pending'
      end
    returning id
  `) as { id: string }[]

  await recordPartnerSettlementAudit({
    organizationId: organization.id,
    settlementId: idRows[0]?.id ?? id,
    eventType: "generated",
    actorUserId: userId,
    payload: { cycleMonth, grossAmount, partnerAmount, arobidAmount }
  })

  await sql`
    update partner_revenue_events
    set status = 'settlement_pending'
    where partner_org_id = ${organization.id}
      and to_char(created_at, 'YYYY-MM') = ${cycleMonth}
      and status <> 'settled'
  `
}

export async function settlePartnerMonthlySettlement(
  userId: string,
  settlementId: string
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    update partner_settlements
    set status = 'settled', settled_at = now()
    where id = ${settlementId}
      and partner_org_id = ${organization.id}
    returning cycle_month, gross_amount, partner_amount, arobid_amount
  `) as {
    cycle_month: string
    gross_amount: number | string
    partner_amount: number | string
    arobid_amount: number | string
  }[]

  const row = rows[0]
  if (!row) throw new Error("Settlement not found.")

  await recordPartnerSettlementAudit({
    organizationId: organization.id,
    settlementId,
    eventType: "settled",
    actorUserId: userId,
    payload: {
      cycleMonth: row.cycle_month,
      grossAmount: toNumber(row.gross_amount),
      partnerAmount: toNumber(row.partner_amount),
      arobidAmount: toNumber(row.arobid_amount)
    }
  })

  await sql`
    set status = 'settled'
    where partner_org_id = ${organization.id}
      and to_char(created_at, 'YYYY-MM') = ${row.cycle_month}
  `
}

async function validatePartnerMessageContext(input: {
  organizationId: string
  contextType: PartnerMessageContextType
  contextId: string
}): Promise<{ subject: string; participantLabel: string }> {
  if (input.contextType === "service_inquiry") {
    const rows = (await sql`
      select name
      from partner_service_bundles
      where id = ${input.contextId}
        and partner_org_id = ${input.organizationId}
        and status = 'published'
      limit 1
    `) as { name: string }[]
    const row = rows[0]
    if (!row) throw new Error("Published bundle not found.")
    return {
      subject: `Service inquiry: ${row.name}`,
      participantLabel: "Enterprise buyer"
    }
  }

  if (input.contextType === "bundle_purchase") {
    const rows = (await sql`
      select psb.name
      from partner_revenue_events pre
      left join partner_service_bundles psb on psb.id = pre.source_id
      where pre.id = ${input.contextId}
        and pre.partner_org_id = ${input.organizationId}
        and pre.source_type = 'bundle_purchase'
      limit 1
    `) as { name: string | null }[]
    const row = rows[0]
    if (!row) throw new Error("Bundle purchase not found.")
    return {
      subject: `Bundle purchase: ${row.name ?? "Service bundle"}`,
      participantLabel: "Purchasing enterprise"
    }
  }

  if (input.contextType === "deal_support") {
    const rows = (await sql`
      select enterprise_name
      from partner_enterprise_members
      where id = ${input.contextId}
        and partner_org_id = ${input.organizationId}
        and (activation_status = 'rfq_generated' or rfq_generated_count > 0)
      limit 1
    `) as { enterprise_name: string }[]
    const row = rows[0]
    if (!row) throw new Error("Deal support context not found.")
    return {
      subject: `Deal support: ${row.enterprise_name}`,
      participantLabel: row.enterprise_name
    }
  }

  const rows = (await sql`
    select e.name
    from partner_expo_assignments pea
    inner join expos e on e.id = pea.expo_id
    where pea.partner_org_id = ${input.organizationId}
      and e.id = ${input.contextId}
    limit 1
  `) as { name: string }[]
  const row = rows[0]
  if (!row) throw new Error("Expo participation context not found.")
  return {
    subject: `Expo support: ${row.name}`,
    participantLabel: "Expo participant"
  }
}

export async function getPartnerCommunicationsWorkspace(
  userId: string
): Promise<PartnerCommunicationsWorkspace> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) {
    return {
      organization: null,
      threads: [],
      messagesByThread: {},
      triggers: [],
      totals: {
        openThreads: 0,
        serviceInquiryTriggers: 0,
        bundlePurchaseTriggers: 0,
        dealSupportTriggers: 0,
        expoParticipationTriggers: 0
      }
    }
  }

  const [
    threadRows,
    messageRows,
    bundleRows,
    purchaseRows,
    dealRows,
    expoRows
  ] = await Promise.all([
    sql`
      select
        pmt.*,
        (
          select count(*)::int
          from partner_thread_messages ptm
          where ptm.thread_id = pmt.id
        ) as message_count,
        (
          select body
          from partner_thread_messages ptm
          where ptm.thread_id = pmt.id
          order by created_at desc
          limit 1
        ) as last_message
      from partner_message_threads pmt
      where pmt.partner_org_id = ${organization.id}
      order by pmt.updated_at desc
    `,
    sql`
      select ptm.*
      from partner_thread_messages ptm
      inner join partner_message_threads pmt on pmt.id = ptm.thread_id
      where pmt.partner_org_id = ${organization.id}
      order by ptm.created_at asc
    `,
    sql`
      select id, name
      from partner_service_bundles
      where partner_org_id = ${organization.id}
        and status = 'published'
      order by created_at desc
    `,
    sql`
      select pre.id, psb.name
      from partner_revenue_events pre
      left join partner_service_bundles psb on psb.id = pre.source_id
      where pre.partner_org_id = ${organization.id}
        and pre.source_type = 'bundle_purchase'
      order by pre.created_at desc
      limit 20
    `,
    sql`
      select id, enterprise_name
      from partner_enterprise_members
      where partner_org_id = ${organization.id}
        and (activation_status = 'rfq_generated' or rfq_generated_count > 0)
      order by updated_at desc
      limit 20
    `,
    sql`
      select e.id, e.name
      from partner_expo_assignments pea
      inner join expos e on e.id = pea.expo_id
      where pea.partner_org_id = ${organization.id}
      order by e.created_at desc
    `
  ])

  const threads = (
    threadRows as {
      id: string
      context_type: PartnerMessageContextType
      context_id: string
      subject: string
      participant_label: string
      status: "open" | "closed"
      message_count: number | string
      last_message: string | null
      updated_at: string | Date
    }[]
  ).map((row) => ({
    id: row.id,
    contextType: row.context_type,
    contextId: row.context_id,
    subject: row.subject,
    participantLabel: row.participant_label,
    status: row.status,
    messageCount: toNumber(row.message_count),
    lastMessage: row.last_message,
    updatedAt: toIso(row.updated_at)
  }))

  const messagesByThread: Record<string, PartnerThreadMessage[]> = {}
  for (const row of messageRows as {
    id: string
    thread_id: string
    sender_user_id: string | null
    sender_label: string
    body: string
    created_at: string | Date
  }[]) {
    const list = messagesByThread[row.thread_id] ?? []
    list.push({
      id: row.id,
      threadId: row.thread_id,
      senderUserId: row.sender_user_id,
      senderLabel: row.sender_label,
      body: row.body,
      createdAt: toIso(row.created_at)
    })
    messagesByThread[row.thread_id] = list
  }

  const triggers: PartnerMessageTrigger[] = [
    ...(bundleRows as { id: string; name: string }[]).map((row) => ({
      contextType: "service_inquiry" as const,
      contextId: row.id,
      label: `Service inquiry: ${row.name}`,
      participantLabel: "Enterprise buyer"
    })),
    ...(purchaseRows as { id: string; name: string | null }[]).map((row) => ({
      contextType: "bundle_purchase" as const,
      contextId: row.id,
      label: `Bundle purchase: ${row.name ?? "Service bundle"}`,
      participantLabel: "Purchasing enterprise"
    })),
    ...(dealRows as { id: string; enterprise_name: string }[]).map((row) => ({
      contextType: "deal_support" as const,
      contextId: row.id,
      label: `Deal support: ${row.enterprise_name}`,
      participantLabel: row.enterprise_name
    })),
    ...(expoRows as { id: string; name: string }[]).map((row) => ({
      contextType: "expo_participation" as const,
      contextId: row.id,
      label: `Expo support: ${row.name}`,
      participantLabel: "Expo participant"
    }))
  ]

  return {
    organization,
    threads,
    messagesByThread,
    triggers,
    totals: {
      openThreads: threads.filter((thread) => thread.status === "open").length,
      serviceInquiryTriggers: triggers.filter(
        (trigger) => trigger.contextType === "service_inquiry"
      ).length,
      bundlePurchaseTriggers: triggers.filter(
        (trigger) => trigger.contextType === "bundle_purchase"
      ).length,
      dealSupportTriggers: triggers.filter(
        (trigger) => trigger.contextType === "deal_support"
      ).length,
      expoParticipationTriggers: triggers.filter(
        (trigger) => trigger.contextType === "expo_participation"
      ).length
    }
  }
}

export async function createPartnerMessageThread(
  userId: string,
  input: { contextType: PartnerMessageContextType; contextId: string }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const context = await validatePartnerMessageContext({
    organizationId: organization.id,
    contextType: input.contextType,
    contextId: input.contextId
  })
  const id = `partner-thread-${randomUUID()}`

  await sql`
    insert into partner_message_threads (
      id,
      partner_org_id,
      context_type,
      context_id,
      subject,
      participant_label,
      status,
      created_by_user_id
    )
    values (
      ${id},
      ${organization.id},
      ${input.contextType},
      ${input.contextId},
      ${context.subject},
      ${context.participantLabel},
      'open',
      ${userId}
    )
  `
  await createPartnerThreadMessage(userId, {
    threadId: id,
    body: `Context opened: ${context.subject}`,
    isSystem: true
  })

  return { id }
}

export async function createPartnerThreadMessage(
  userId: string,
  input: { threadId: string; body: string; isSystem?: boolean }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const body = input.body.trim()
  if (!body) throw new Error("Message body is required.")
  const threadRows = (await sql`
    select id
    from partner_message_threads
    where id = ${input.threadId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as { id: string }[]

  if (threadRows.length === 0) throw new Error("Thread not found.")

  await sql`
    insert into partner_thread_messages (
      id,
      thread_id,
      sender_user_id,
      sender_label,
      body
    )
    values (
      ${`partner-thread-message-${randomUUID()}`},
      ${input.threadId},
      ${input.isSystem ? null : userId},
      ${input.isSystem ? "System" : organization.name},
      ${body}
    )
  `
  await sql`
    update partner_message_threads
    set updated_at = now()
    where id = ${input.threadId}
  `
}

export async function updatePartnerMessageThreadStatus(
  userId: string,
  input: { threadId: string; status: "open" | "closed" }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const rows = (await sql`
    update partner_message_threads
    set status = ${input.status}, updated_at = now()
    where id = ${input.threadId}
      and partner_org_id = ${organization.id}
    returning id
  `) as { id: string }[]

  if (rows.length === 0) throw new Error("Thread not found.")
}

export async function getPartnerEnterpriseWorkspace(
  userId: string
): Promise<PartnerEnterpriseWorkspace> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) {
    return {
      organization: null,
      members: [],
      funnel: {
        invited: 0,
        registered: 0,
        profileCompleted: 0,
        expoActivated: 0,
        rfqGenerated: 0
      }
    }
  }

  const rows = (await sql`
    with quota_totals as (
      select
        enterprise_member_id,
        coalesce(sum(allocated_quantity), 0)::int as quota_allocated_quantity,
        coalesce(sum(consumed_quantity), 0)::int as quota_consumed_quantity
      from partner_quota_allocations
      where partner_org_id = ${organization.id}
      group by enterprise_member_id
    ),
    deal_totals as (
      select
        pdc.enterprise_member_id,
        pdc.stage as deal_context_stage,
        count(pdce.id)::int as deal_context_events
      from partner_deal_contexts pdc
      left join partner_deal_context_events pdce on pdce.deal_context_id = pdc.id
      where pdc.partner_org_id = ${organization.id}
      group by pdc.enterprise_member_id, pdc.stage, pdc.updated_at
    )
    select
      pem.id,
      pem.enterprise_id,
      pem.enterprise_name,
      pem.contact_email,
      c.logo_url,
      pem.activation_status,
      pem.source,
      pem.relationship_type,
      pem.public_profile,
      pem.last_action,
      pem.accepted_at,
      pem.removed_at,
      pem.removed_reason,
      pem.created_at,
      pem.updated_at,
      pem.expo_participation_count,
      pem.rfq_generated_count,
      pem.trade_signal_count,
      coalesce(qt.quota_allocated_quantity, 0)::int as quota_allocated_quantity,
      coalesce(qt.quota_consumed_quantity, 0)::int as quota_consumed_quantity,
      dt.deal_context_stage,
      coalesce(dt.deal_context_events, 0)::int as deal_context_events
    from partner_enterprise_members pem
    left join companies c on c.id = pem.enterprise_id
    left join quota_totals qt on qt.enterprise_member_id = pem.id
    left join deal_totals dt on dt.enterprise_member_id = pem.id
    where pem.partner_org_id = ${organization.id}
    order by pem.created_at desc
  `) as {
    id: string
    enterprise_id: string | null
    enterprise_name: string
    contact_email: string | null
    logo_url: string | null
    activation_status: PartnerEnterpriseMember["activationStatus"]
    expo_participation_count: number | string
    rfq_generated_count: number | string
    trade_signal_count: number | string
    quota_allocated_quantity: number | string
    quota_consumed_quantity: number | string
    deal_context_stage: PartnerDealContextStage | null
    deal_context_events: number | string
    source: string
    relationship_type: string
    public_profile: boolean
    last_action: string | null
    accepted_at: string | Date | null
    removed_at: string | Date | null
    removed_reason: string | null
    created_at: string | Date
    updated_at: string | Date
  }[]

  const members = rows.map((row) => ({
    id: row.id,
    enterpriseId: row.enterprise_id,
    enterpriseName: row.enterprise_name,
    contactEmail: row.contact_email ?? "",
    logoUrl: row.logo_url,
    activationStatus: row.activation_status,
    source: row.source,
    relationshipType: row.relationship_type,
    publicProfile: row.public_profile,
    lastAction: row.last_action,
    acceptedAt: row.accepted_at ? toIso(row.accepted_at) : null,
    removedAt: row.removed_at ? toIso(row.removed_at) : null,
    removedReason: row.removed_reason,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    expoParticipationCount: toNumber(row.expo_participation_count),
    rfqGeneratedCount: toNumber(row.rfq_generated_count),
    tradeSignalCount: toNumber(row.trade_signal_count),
    dealContextStage: row.deal_context_stage,
    dealContextEvents: toNumber(row.deal_context_events),
    quotaAllocatedQuantity: toNumber(row.quota_allocated_quantity),
    quotaConsumedQuantity: toNumber(row.quota_consumed_quantity)
  }))

  return {
    organization,
    members,
    funnel: {
      invited: members.filter((member) => member.activationStatus === "invited")
        .length,
      registered: members.filter(
        (member) => member.activationStatus === "active"
      ).length,
      profileCompleted: members.filter(
        (member) => member.activationStatus === "active"
      ).length,
      expoActivated: members.filter(
        (member) => member.activationStatus === "active"
      ).length,
      rfqGenerated: members.filter(
        (member) => member.activationStatus === "removed"
      ).length
    }
  }
}

export async function getPartnerEnterpriseMemberDetail(
  userId: string,
  memberId: string
): Promise<PartnerEnterpriseMemberDetail | null> {
  const workspace = await getPartnerEnterpriseWorkspace(userId)
  if (!workspace.organization) return null
  const member = workspace.members.find((item) => item.id === memberId)
  if (!member) return null

  const [auditRows, dealRows] = await Promise.all([
    sql`
      select
        id,
        action,
        old_status,
        new_status,
        actor_label,
        reason,
        created_at
      from partner_enterprise_member_audit_events
      where partner_org_id = ${workspace.organization.id}
        and association_id = ${memberId}
      order by created_at desc
      limit 30
    `,
    sql`
      select
        pdce.id,
        pdce.from_stage,
        pdce.to_stage,
        pdce.note,
        u.name as actor_label,
        pdce.created_at
      from partner_deal_context_events pdce
      left join users u on u.id = pdce.actor_user_id
      where pdce.partner_org_id = ${workspace.organization.id}
        and pdce.enterprise_member_id = ${memberId}
      order by pdce.created_at desc
      limit 30
    `
  ])

  const activities: PartnerEnterpriseActivity[] = [
    ...(
      auditRows as {
        id: string
        action: string
        old_status: string | null
        new_status: string | null
        actor_label: string | null
        reason: string | null
        created_at: string | Date
      }[]
    ).map((row) => ({
      id: row.id,
      type: "association" as const,
      title: row.new_status
        ? `${row.action}: ${row.old_status ?? "none"} → ${row.new_status}`
        : row.action,
      description: row.reason,
      actorLabel: row.actor_label,
      createdAt: toIso(row.created_at)
    })),
    ...(
      dealRows as {
        id: string
        from_stage: PartnerDealContextStage | null
        to_stage: PartnerDealContextStage
        note: string | null
        actor_label: string | null
        created_at: string | Date
      }[]
    ).map((row) => ({
      id: row.id,
      type: "deal_context" as const,
      title: `Deal context: ${row.from_stage ?? "none"} → ${row.to_stage}`,
      description: row.note,
      actorLabel: row.actor_label,
      createdAt: toIso(row.created_at)
    }))
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    organization: workspace.organization,
    member,
    activities
  }
}

export async function getPartnerGovernmentProgramWorkspace(
  userId: string
): Promise<PartnerGovernmentProgramWorkspace> {
  const quotaWorkspace = await getPartnerQuotaWorkspace(userId)
  const supportedSmes = quotaWorkspace.enterpriseMembers.filter(
    (member) => member.activationStatus !== "invited"
  ).length
  const activeCampaigns = quotaWorkspace.inviteCampaigns.filter(
    (campaign) => campaign.status === "active"
  ).length
  const quotaTotal = quotaWorkspace.quotas.reduce(
    (sum, quota) => sum + quota.totalQuantity,
    0
  )
  const quotaConsumed = quotaWorkspace.quotas.reduce(
    (sum, quota) => sum + quota.consumedQuantity,
    0
  )

  return {
    organization: quotaWorkspace.organization,
    quotaWorkspace,
    supportedSmes,
    activeCampaigns,
    quotaUtilization:
      quotaTotal > 0 ? Math.round((quotaConsumed / quotaTotal) * 100) : 0
  }
}

export async function getPartnerAnalyticsWorkspace(
  userId: string
): Promise<PartnerAnalyticsWorkspace> {
  const [
    summary,
    dashboard,
    enterpriseWorkspace,
    financeWorkspace,
    communicationsWorkspace
  ] = await Promise.all([
    getPartnerPortalSummary(userId),
    getPartnerDashboardMetrics(userId),
    getPartnerEnterpriseWorkspace(userId),
    getPartnerFinanceWorkspace(userId),
    getPartnerCommunicationsWorkspace(userId)
  ])

  const topExpos = dashboard.expoMetrics
    .map((expo) => ({
      expoId: expo.expoId,
      expoName: expo.expoName,
      status: expo.status,
      boothUtilization: expo.boothUtilization,
      soldBooths: expo.soldBooths,
      rfqCount: Math.round(expo.soldBooths * 1.5),
      meetings: expo.liveSessions,
      revenue: expo.revenue
    }))
    .sort(
      (a, b) =>
        b.rfqCount - a.rfqCount ||
        b.revenue - a.revenue ||
        b.soldBooths - a.soldBooths
    )
    .slice(0, 8)

  const tradeSignals = enterpriseWorkspace.members.reduce(
    (total, member) => total + member.tradeSignalCount,
    0
  )
  const openThreads = communicationsWorkspace.totals.openThreads

  return {
    organization: summary.organization,
    summary,
    reports: [
      {
        key: "expo_overview",
        title: "Expo overview",
        description:
          "Assigned expos, booth inventory, booth utilization, and GoLIVE activity.",
        source: "TradeXpo Engine",
        status: summary.reports.expoOverviewReady ? "ready" : "pending",
        metrics: [
          { label: "Assigned expos", value: dashboard.totals.assignedExpos },
          {
            label: "Booth utilization",
            value: dashboard.totals.boothUtilization
          },
          {
            label: "Published booths",
            value: dashboard.totals.publishedBooths
          },
          { label: "GoLIVE events", value: dashboard.totals.goLiveEvents }
        ]
      },
      {
        key: "trade_activity",
        title: "Trade activity",
        description:
          "RFQ generation, deal context proxy, meetings, and partner-supported activity.",
        source: "DealContext + Partner Members",
        status: summary.reports.tradeActivityReady ? "ready" : "pending",
        metrics: [
          { label: "RFQ generated", value: summary.overview.rfqGenerated },
          { label: "Deal contexts", value: summary.overview.dealContexts },
          { label: "Meetings", value: dashboard.totals.liveSessions },
          { label: "Enterprises supported", value: summary.enterprises.total }
        ]
      },
      {
        key: "industry_insight",
        title: "Industry insight",
        description:
          "Trade signals, buyer geography, booth-tier demand, and activity mix.",
        source: "Partner Members + Expo Operations",
        status: summary.reports.industryInsightReady ? "ready" : "pending",
        metrics: [
          { label: "Trade signals", value: tradeSignals },
          {
            label: "Country segments",
            value: dashboard.countryBreakdown.length
          },
          {
            label: "Booth-tier segments",
            value: dashboard.boothTierBreakdown.length
          },
          { label: "Comments", value: dashboard.totals.comments }
        ]
      },
      {
        key: "buyer_leads",
        title: "Buyer leads",
        description:
          "Buyer demand signals from RFQ activity and context-bound support threads.",
        source: "RFQ + Communications",
        status: summary.reports.buyerLeadsReady ? "ready" : "pending",
        metrics: [
          { label: "RFQ generated", value: summary.overview.rfqGenerated },
          {
            label: "Deal support triggers",
            value: communicationsWorkspace.totals.dealSupportTriggers
          },
          { label: "Open support threads", value: openThreads },
          { label: "Bundle purchases", value: summary.overview.bundleSales }
        ]
      }
    ],
    topExpos,
    funnel: enterpriseWorkspace.funnel,
    sourceMetrics: {
      meetings: dashboard.totals.liveSessions,
      countrySegments: dashboard.countryBreakdown.length,
      boothTierSegments: dashboard.boothTierBreakdown.length,
      openThreads,
      settlementCycles: financeWorkspace.settlements.length
    }
  }
}

export async function updatePartnerEnterpriseMember(
  userId: string,
  input: {
    memberId: string
    enterpriseName: string
    contactEmail?: string | null
    relationshipType?: string | null
  }
) {
  const { organization } = await requirePartnerEnterpriseMember(
    userId,
    input.memberId
  )
  const enterpriseName = input.enterpriseName.trim()
  if (!enterpriseName) throw new Error("Enterprise name is required.")

  await sql`
    update partner_enterprise_members
    set
      enterprise_name = ${enterpriseName},
      contact_email = ${input.contactEmail?.trim() || null},
      relationship_type = ${input.relationshipType?.trim() || "member"},
      last_action = 'update',
      updated_at = now()
    where id = ${input.memberId}
      and partner_org_id = ${organization.id}
  `
}

export async function acceptPartnerEnterpriseAssociation(
  userId: string,
  memberId: string
) {
  const { organization, member } = await requirePartnerEnterpriseMember(
    userId,
    memberId
  )
  if (member.activationStatus === "blocked") {
    throw new Error("Blocked association cannot be accepted.")
  }
  if (member.activationStatus === "removed") {
    throw new Error("Removed association cannot be accepted.")
  }

  await sql`
    update partner_enterprise_members
    set
      activation_status = 'active',
      accepted_by_user_id = ${userId},
      accepted_at = now(),
      last_action = 'accept',
      updated_at = now()
    where id = ${memberId}
      and partner_org_id = ${organization.id}
  `
  await recordPartnerEnterpriseAssociationAudit({
    associationId: memberId,
    partnerOrgId: organization.id,
    partnerOrgName: organization.name,
    enterpriseId: member.enterpriseId,
    enterpriseName: member.enterpriseName,
    action: "accept",
    oldStatus: member.activationStatus,
    newStatus: "active",
    source: member.source,
    actorType: "company_user",
    actorId: userId
  })
  await notifyPartnerCompanyAccepted({
    partnerOrgId: organization.id,
    associationId: memberId,
    enterpriseId: member.enterpriseId,
    enterpriseName: member.enterpriseName,
    acceptedByUserId: userId
  })
}

export async function removePartnerEnterpriseAssociation(
  userId: string,
  input: { memberId: string; reason: string }
) {
  const { organization, member } = await requirePartnerEnterpriseMember(
    userId,
    input.memberId
  )
  const reason = input.reason.trim()
  if (!reason) throw new Error("Removal reason is required.")
  if (member.activationStatus === "blocked") {
    throw new Error("Blocked association cannot be removed by Tenant users.")
  }
  if (member.activationStatus === "removed") {
    throw new Error("Association is already removed.")
  }

  await sql`
    update partner_enterprise_members
    set
      activation_status = 'removed',
      removed_at = now(),
      removed_reason = ${reason},
      invite_token = null,
      invite_expires_at = null,
      last_action = 'remove',
      updated_at = now()
    where id = ${input.memberId}
      and partner_org_id = ${organization.id}
  `
  await recordPartnerEnterpriseAssociationAudit({
    associationId: input.memberId,
    partnerOrgId: organization.id,
    partnerOrgName: organization.name,
    enterpriseId: member.enterpriseId,
    enterpriseName: member.enterpriseName,
    action: "remove",
    oldStatus: member.activationStatus,
    newStatus: "removed",
    source: member.source,
    actorType: "partner_user",
    actorId: userId,
    reason
  })
}

export async function advancePartnerEnterpriseActivation(
  userId: string,
  memberId: string
) {
  const { organization, member } = await requirePartnerEnterpriseMember(
    userId,
    memberId
  )
  if (member.activationStatus !== "active") {
    throw new Error("Only active associations can record RFQ activity.")
  }

  await sql`
    update partner_enterprise_members
    set
      rfq_generated_count = rfq_generated_count + 1,
      trade_signal_count = trade_signal_count + 1,
      last_action = 'rfq_generated',
      updated_at = now()
    where id = ${memberId}
      and partner_org_id = ${organization.id}
  `

  await ensurePartnerDealContext({
    organizationId: organization.id,
    enterpriseMemberId: memberId,
    actorUserId: userId,
    toStage: "rfq_generated",
    note: "Active company association generated RFQ activity."
  })
}

export async function createPartnerQuota(
  userId: string,
  input: {
    quotaType: PartnerQuota["quotaType"]
    label: string
    totalQuantity: number
  }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const label = input.label.trim()
  if (!label) throw new Error("Quota label is required.")
  if (!Number.isInteger(input.totalQuantity) || input.totalQuantity <= 0) {
    throw new Error("Total quantity must be greater than 0.")
  }

  const id = `partner-quota-${randomUUID()}`
  await sql`
    insert into partner_quotas (
      id,
      partner_org_id,
      quota_type,
      label,
      total_quantity,
      allocated_quantity,
      consumed_quantity
    )
    values (
      ${id},
      ${organization.id},
      ${input.quotaType},
      ${label},
      ${input.totalQuantity},
      0,
      0
    )
  `
  return { id }
}

export async function searchPartnerCompanies(
  userId: string,
  query: string
): Promise<PartnerCompanySearchResult[]> {
  await requirePrimaryPartnerOrganization(userId)
  const q = query.trim()
  if (q.length < 2) return []

  const rows = (await sql`
    select id, name, tax_id, website, address, is_active
    from companies
    where is_active = true
      and (
        name ilike ${`%${q}%`}
        or coalesce(tax_id, '') ilike ${`%${q}%`}
        or coalesce(website, '') ilike ${`%${q}%`}
      )
    order by name asc
    limit 10
  `) as {
    id: string
    name: string
    tax_id: string | null
    website: string | null
    address: string | null
    is_active: boolean
  }[]

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    taxId: row.tax_id,
    website: row.website,
    address: row.address,
    isActive: row.is_active
  }))
}

export async function listPartnerEnterpriseAssociationAuditEvents(
  filters: PartnerEnterpriseAssociationAuditFilters = {}
): Promise<PartnerEnterpriseAssociationAuditEvent[]> {
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100)
  const rows = (await sql`
    select
      id,
      association_id,
      partner_org_id,
      partner_org_name,
      enterprise_id,
      enterprise_name,
      action,
      old_status,
      new_status,
      source,
      actor_type,
      actor_id,
      actor_label,
      reason,
      created_at
    from partner_enterprise_member_audit_events
    where (${filters.partnerOrgId ?? null}::text is null or partner_org_id = ${filters.partnerOrgId ?? null})
      and (${filters.enterpriseId ?? null}::text is null or enterprise_id = ${filters.enterpriseId ?? null})
      and (${filters.action ?? null}::text is null or action = ${filters.action ?? null})
      and (${filters.source ?? null}::text is null or source = ${filters.source ?? null})
      and (${filters.actorType ?? null}::text is null or actor_type = ${filters.actorType ?? null})
      and (
        ${filters.q?.trim() || null}::text is null
        or partner_org_name ilike ${`%${filters.q?.trim() || ""}%`}
        or enterprise_name ilike ${`%${filters.q?.trim() || ""}%`}
        or association_id ilike ${`%${filters.q?.trim() || ""}%`}
        or coalesce(enterprise_id, '') ilike ${`%${filters.q?.trim() || ""}%`}
      )
    order by created_at desc, id desc
    limit ${limit}
  `) as {
    id: string
    association_id: string
    partner_org_id: string
    partner_org_name: string
    enterprise_id: string | null
    enterprise_name: string
    action: PartnerEnterpriseAssociationAuditAction
    old_status: PartnerEnterpriseMember["activationStatus"] | null
    new_status: PartnerEnterpriseMember["activationStatus"]
    source: string
    actor_type: PartnerEnterpriseAssociationAuditActor
    actor_id: string | null
    actor_label: string | null
    reason: string | null
    created_at: string | Date
  }[]

  return rows.map((row) => ({
    id: row.id,
    associationId: row.association_id,
    partnerOrgId: row.partner_org_id,
    partnerOrgName: row.partner_org_name,
    enterpriseId: row.enterprise_id,
    enterpriseName: row.enterprise_name,
    action: row.action,
    oldStatus: row.old_status,
    newStatus: row.new_status,
    source: row.source,
    actorType: row.actor_type,
    actorId: row.actor_id,
    actorLabel: row.actor_label,
    reason: row.reason,
    createdAt: toIso(row.created_at)
  }))
}

export async function createPartnerEnterpriseMember(
  userId: string,
  input: {
    companyIds?: string[]
    relationshipType?: string | null
  }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const relationshipType = input.relationshipType?.trim() || "member"
  const companyIds = Array.from(new Set(input.companyIds ?? [])).filter(Boolean)
  if (companyIds.length === 0) {
    return {
      created: [],
      skipped: [],
      shareUrl: `/register/company?tenant=${organization.id}`
    }
  }

  const companyRows = (await sql`
    select id, name
    from companies
    where id = any(${companyIds}::text[])
      and is_active = true
  `) as { id: string; name: string }[]
  const companiesById = new Map(
    companyRows.map((company) => [company.id, company])
  )
  const created: { id: string; companyId: string; inviteToken: string }[] = []
  const skipped: { companyId: string; reason: string }[] = []

  for (const companyId of companyIds) {
    const company = companiesById.get(companyId)
    if (!company) {
      skipped.push({ companyId, reason: "Arobid company not found." })
      continue
    }

    const duplicateRows = (await sql`
      select id, activation_status
      from partner_enterprise_members
      where partner_org_id = ${organization.id}
        and enterprise_id = ${company.id}
        and activation_status in ('invited', 'pending_acceptance', 'active', 'blocked')
      limit 1
    `) as { id: string; activation_status: string }[]
    const duplicate = duplicateRows[0]
    if (duplicate?.activation_status === "blocked") {
      skipped.push({ companyId, reason: "Blocked association." })
      continue
    }
    if (duplicate?.activation_status === "active") {
      skipped.push({ companyId, reason: "Already active." })
      continue
    }

    const inviteToken = randomUUID()
    if (duplicate) {
      await sql`
        update partner_enterprise_members
        set
          activation_status = 'pending_acceptance',
          invite_token = ${inviteToken},
          invite_expires_at = now() + interval '30 days',
          last_action = 'resend_invite',
          updated_at = now()
        where id = ${duplicate.id}
      `
      await recordPartnerEnterpriseAssociationAudit({
        associationId: duplicate.id,
        partnerOrgId: organization.id,
        partnerOrgName: organization.name,
        enterpriseId: company.id,
        enterpriseName: company.name,
        action: "resend_invite",
        oldStatus:
          duplicate.activation_status as PartnerEnterpriseMember["activationStatus"],
        newStatus: "pending_acceptance",
        source: "tenant_invite",
        actorType: "partner_user",
        actorId: userId
      })
      created.push({ id: duplicate.id, companyId, inviteToken })
      continue
    }

    const id = `partner-member-${randomUUID()}`
    await sql`
      insert into partner_enterprise_members (
        id,
        partner_org_id,
        enterprise_id,
        enterprise_name,
        contact_email,
        activation_status,
        source,
        relationship_type,
        invite_token,
        invite_expires_at,
        last_action
      )
      values (
        ${id},
        ${organization.id},
        ${company.id},
        ${company.name},
        null,
        'pending_acceptance',
        'tenant_invite',
        ${relationshipType},
        ${inviteToken},
        now() + interval '30 days',
        'invite'
      )
    `
    await recordPartnerEnterpriseAssociationAudit({
      associationId: id,
      partnerOrgId: organization.id,
      partnerOrgName: organization.name,
      enterpriseId: company.id,
      enterpriseName: company.name,
      action: "invite",
      newStatus: "pending_acceptance",
      source: "tenant_invite",
      actorType: "partner_user",
      actorId: userId
    })
    created.push({ id, companyId, inviteToken })
  }

  return {
    created,
    skipped,
    shareUrl: `/register/company?tenant=${organization.id}`
  }
}

export async function createPartnerSiteInvitations(
  userId: string,
  input: {
    invitationType: PartnerSiteInvitationType
    recipients: string[]
  }
): Promise<PartnerSiteInvitationSendResult> {
  const organization = await requirePrimaryPartnerOrganization(userId)
  if (
    input.invitationType !== "site_visit" &&
    input.invitationType !== "join_partner_site"
  ) {
    throw new Error("Invalid invitation type.")
  }

  const recipients = Array.from(
    new Set(input.recipients.map((email) => email.trim().toLowerCase()))
  ).filter(Boolean)
  if (recipients.length === 0) {
    throw new Error("At least one recipient email is required.")
  }

  const skipped: { email: string; reason: string }[] = []
  let createdCount = 0
  let resentCount = 0

  for (const email of recipients) {
    await sql`select pg_advisory_xact_lock(hashtext(${`${organization.id}|tenant_invite|${email}`}))`
    const duplicateRows = (await sql`
      select id, activation_status, accepted_at
      from partner_enterprise_members
      where partner_org_id = ${organization.id}
        and lower(contact_email) = ${email}
        and source = 'tenant_invite'
        and activation_status in ('invited', 'pending_acceptance', 'active', 'blocked')
      limit 1
    `) as {
      id: string
      activation_status: PartnerEnterpriseMember["activationStatus"]
      accepted_at: string | Date | null
    }[]
    const duplicate = duplicateRows[0]
    if (duplicate?.activation_status === "blocked") {
      skipped.push({ email, reason: "Blocked association." })
      continue
    }
    if (duplicate?.activation_status === "active" || duplicate?.accepted_at) {
      skipped.push({ email, reason: "Already accepted." })
      continue
    }

    const inviteToken = randomUUID()
    if (duplicate) {
      await sql`
        update partner_enterprise_members
        set
          activation_status = 'pending_acceptance',
          relationship_type = ${getRelationshipTypeForInvitation(input.invitationType)},
          invite_token = ${inviteToken},
          invite_expires_at = now() + interval '30 days',
          last_action = 'resend_invite',
          updated_at = now()
        where id = ${duplicate.id}
          and partner_org_id = ${organization.id}
      `
      await recordPartnerEnterpriseAssociationAudit({
        associationId: duplicate.id,
        partnerOrgId: organization.id,
        partnerOrgName: organization.name,
        enterpriseId: null,
        enterpriseName: email,
        action: "resend_invite",
        oldStatus: duplicate.activation_status,
        newStatus: "pending_acceptance",
        source: "tenant_invite",
        actorType: "partner_user",
        actorId: userId
      })
      resentCount += 1
      continue
    }

    const id = `partner-member-${randomUUID()}`
    await sql`
      insert into partner_enterprise_members (
        id,
        partner_org_id,
        enterprise_id,
        enterprise_name,
        contact_email,
        activation_status,
        source,
        relationship_type,
        invite_token,
        invite_expires_at,
        last_action
      )
      values (
        ${id},
        ${organization.id},
        null,
        ${email},
        ${email},
        'pending_acceptance',
        'tenant_invite',
        ${getRelationshipTypeForInvitation(input.invitationType)},
        ${inviteToken},
        now() + interval '30 days',
        'invite'
      )
    `
    await recordPartnerEnterpriseAssociationAudit({
      associationId: id,
      partnerOrgId: organization.id,
      partnerOrgName: organization.name,
      enterpriseId: null,
      enterpriseName: email,
      action: "invite",
      newStatus: "pending_acceptance",
      source: "tenant_invite",
      actorType: "partner_user",
      actorId: userId
    })
    createdCount += 1
  }

  return {
    sentCount: createdCount + resentCount,
    createdCount,
    resentCount,
    skipped
  }
}

export async function resendPartnerEnterpriseInvitation(
  userId: string,
  memberId: string
) {
  const { organization, member } = await requirePartnerEnterpriseMember(
    userId,
    memberId
  )
  if (member.source !== "tenant_invite") {
    throw new Error("Only Partner Site invitations can be resent.")
  }
  if (member.acceptedAt) {
    throw new Error("Only pending invitations can be resent.")
  }
  if (
    member.activationStatus !== "invited" &&
    member.activationStatus !== "pending_acceptance"
  ) {
    throw new Error("Only pending invitations can be resent.")
  }

  const inviteToken = randomUUID()
  await sql`
    update partner_enterprise_members
    set
      activation_status = 'pending_acceptance',
      invite_token = ${inviteToken},
      invite_expires_at = now() + interval '30 days',
      last_action = 'resend_invite',
      updated_at = now()
    where id = ${memberId}
      and partner_org_id = ${organization.id}
  `
  await recordPartnerEnterpriseAssociationAudit({
    associationId: memberId,
    partnerOrgId: organization.id,
    partnerOrgName: organization.name,
    enterpriseId: member.enterpriseId,
    enterpriseName: member.enterpriseName,
    action: "resend_invite",
    oldStatus: member.activationStatus,
    newStatus: "pending_acceptance",
    source: member.source,
    actorType: "partner_user",
    actorId: userId
  })

  return { id: memberId }
}

function getRelationshipTypeForInvitation(type: PartnerSiteInvitationType) {
  return type === "site_visit" ? "site_visit" : "member"
}

export async function createPartnerInviteCampaign(
  userId: string,
  input: {
    name: string
    inviteCode: string
    quotaId?: string | null
    status?: PartnerInviteCampaign["status"]
  }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const name = input.name.trim()
  const inviteCode = input.inviteCode.trim().toUpperCase()
  if (!name) throw new Error("Campaign name is required.")
  if (!/^[A-Z0-9_-]{4,32}$/.test(inviteCode)) {
    throw new Error("Invite code must be 4-32 letters, numbers, _, or -.")
  }
  if (input.quotaId) {
    await requirePartnerQuota(userId, input.quotaId)
  }

  const id = `partner-campaign-${randomUUID()}`
  await sql`
    insert into partner_invite_campaigns (
      id,
      partner_org_id,
      name,
      invite_code,
      quota_id,
      status
    )
    values (
      ${id},
      ${organization.id},
      ${name},
      ${inviteCode},
      ${input.quotaId || null},
      ${input.status ?? "active"}
    )
  `
  return { id }
}

export async function allocatePartnerQuota(
  userId: string,
  input: { quotaId: string; enterpriseMemberId: string; quantity: number }
) {
  const { organization, quota } = await requirePartnerQuota(
    userId,
    input.quotaId
  )
  await requirePartnerEnterpriseMember(userId, input.enterpriseMemberId)
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantity must be greater than 0.")
  }
  if (input.quantity > quota.availableQuantity) {
    throw new Error("Not enough available quota.")
  }

  const rows = (await sql`
    update partner_quotas
    set
      allocated_quantity = allocated_quantity + ${input.quantity},
      updated_at = now()
    where id = ${input.quotaId}
      and partner_org_id = ${organization.id}
      and (total_quantity - allocated_quantity - consumed_quantity) >= ${input.quantity}
    returning id
  `) as { id: string }[]

  if (rows.length === 0) throw new Error("Not enough available quota.")
  await sql`
    update partner_enterprise_members
    set updated_at = now()
    where id = ${input.enterpriseMemberId}
  `
  await sql`
    insert into partner_quota_allocations (
      id,
      partner_org_id,
      quota_id,
      enterprise_member_id,
      allocated_quantity,
      consumed_quantity
    )
    values (
      ${`partner-quota-allocation-${randomUUID()}`},
      ${organization.id},
      ${input.quotaId},
      ${input.enterpriseMemberId},
      ${input.quantity},
      0
    )
    on conflict (quota_id, enterprise_member_id) do update
    set
      allocated_quantity = partner_quota_allocations.allocated_quantity + excluded.allocated_quantity,
      updated_at = now()
  `
}

export async function consumePartnerQuota(
  userId: string,
  input: {
    quotaId: string
    quantity: number
    enterpriseMemberId?: string | null
  }
) {
  const { organization, quota } = await requirePartnerQuota(
    userId,
    input.quotaId
  )
  if (input.enterpriseMemberId) {
    await requirePartnerEnterpriseMember(userId, input.enterpriseMemberId)
    const allocationRows = (await sql`
      select allocated_quantity
      from partner_quota_allocations
      where quota_id = ${input.quotaId}
        and partner_org_id = ${organization.id}
        and enterprise_member_id = ${input.enterpriseMemberId}
      limit 1
    `) as { allocated_quantity: number | string }[]
    if (toNumber(allocationRows[0]?.allocated_quantity) < input.quantity) {
      throw new Error("Not enough allocated quota for this enterprise.")
    }
  }
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantity must be greater than 0.")
  }
  if (input.quantity > quota.allocatedQuantity) {
    throw new Error("Not enough allocated quota.")
  }

  const rows = (await sql`
    update partner_quotas
    set
      allocated_quantity = allocated_quantity - ${input.quantity},
      consumed_quantity = consumed_quantity + ${input.quantity},
      updated_at = now()
    where id = ${input.quotaId}
      and partner_org_id = ${organization.id}
      and allocated_quantity >= ${input.quantity}
    returning id
  `) as { id: string }[]

  if (rows.length === 0) throw new Error("Not enough allocated quota.")

  if (input.enterpriseMemberId) {
    const allocationRows = (await sql`
      update partner_quota_allocations
      set
        allocated_quantity = allocated_quantity - ${input.quantity},
        consumed_quantity = consumed_quantity + ${input.quantity},
        updated_at = now()
      where quota_id = ${input.quotaId}
        and partner_org_id = ${organization.id}
        and enterprise_member_id = ${input.enterpriseMemberId}
        and allocated_quantity >= ${input.quantity}
      returning id
    `) as { id: string }[]
    if (allocationRows.length === 0) {
      throw new Error("Not enough allocated quota for this enterprise.")
    }
  }
}

export async function claimPartnerInviteCampaign(
  userId: string,
  input: { campaignId: string; enterpriseMemberId?: string | null }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  if (input.enterpriseMemberId) {
    await requirePartnerEnterpriseMember(userId, input.enterpriseMemberId)
  }
  const rows = (await sql`
    select id, quota_id, status
    from partner_invite_campaigns
    where id = ${input.campaignId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as {
    id: string
    quota_id: string | null
    status: PartnerInviteCampaign["status"]
  }[]

  const campaign = rows[0]
  if (!campaign) throw new Error("Invite campaign not found.")
  if (campaign.status !== "active") {
    throw new Error("Only active invite campaigns can be claimed.")
  }

  if (campaign.quota_id) {
    await consumePartnerQuota(userId, {
      quotaId: campaign.quota_id,
      quantity: 1,
      enterpriseMemberId: input.enterpriseMemberId || null
    })
  }

  await sql`
    update partner_invite_campaigns
    set claimed_count = claimed_count + 1, updated_at = now()
    where id = ${campaign.id}
      and partner_org_id = ${organization.id}
  `

  if (input.enterpriseMemberId) {
    await sql`
      update partner_enterprise_members
      set
        activation_status = 'active',
        expo_participation_count = expo_participation_count + 1,
        updated_at = now()
      where id = ${input.enterpriseMemberId}
        and partner_org_id = ${organization.id}
    `
  }
}

function toNumber(value: unknown): number {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0

  return Number.isFinite(numberValue) ? numberValue : 0
}

export async function listPartnerAssignedExpos(
  userId: string
): Promise<PartnerAssignedExpo[]> {
  const rows = (await sql`
    select
      e.*,
      po.id as partner_org_id,
      po.name as partner_org_name,
      po.model as partner_org_model,
      po.partner_type,
      po.status as partner_org_status,
      po.primary_user_id as partner_org_primary_user_id,
      pm.role as membership_role,
      pea.partnership_model,
      (
        select count(*)::int
        from go_live_events gle
        where gle.expo_id = e.id
          and gle.status <> 'Canceled'
      ) as go_live_count,
      (
        select coalesce(sum(basic_qty + professional_qty + premium_qty), 0)::int
        from expo_halls eh
        where eh.expo_id = e.id
      ) as total_booths,
      (
        select count(*)::int
        from seller_booth_registrations sbr
        where sbr.expo_id = e.id
      ) as sold_booths,
      (
        select count(distinct customer_id)::int
        from orders o
        where o.expo_name = e.name
      ) as visitors,
      (
        select count(*)::int
        from orders o
        where o.expo_name = e.name and o.order_type = 'booth_registration'
      ) * 1.5::int as rfq_count,
      (
        select count(*)::int
        from live_comments lc
        inner join go_live_events gle on gle.stream_session_id = lc.stream_session_id
        where gle.expo_id = e.id
      ) as chat_count
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and pm.status = 'active'
      and po.status = 'active'
    order by e.created_at desc
  `) as (PartnerExpoRow & {
    go_live_count: number
    total_booths: number
    sold_booths: number
    visitors: number
    rfq_count: number
    chat_count: number
  })[]

  return rows.map((row) => ({
    ...rowToAssignedExpo(row),
    goLiveCount: row.go_live_count,
    totalBooths: row.total_booths,
    soldBooths: row.sold_booths,
    visitors: row.visitors,
    rfqCount: row.rfq_count || Math.floor(row.visitors * 0.4),
    chatCount: row.chat_count || Math.floor(row.visitors * 0.8)
  }))
}

export async function getPartnerAssignedExpo(
  userId: string,
  expoId: string
): Promise<PartnerAssignedExpo | null> {
  const rows = (await sql`
    select
      e.*,
      po.id as partner_org_id,
      po.name as partner_org_name,
      po.model as partner_org_model,
      po.partner_type,
      po.status as partner_org_status,
      po.primary_user_id as partner_org_primary_user_id,
      pm.role as membership_role,
      pea.partnership_model,
      (
        select count(*)::int
        from go_live_events gle
        where gle.expo_id = e.id
          and gle.status <> 'Canceled'
      ) as go_live_count,
      (
        select coalesce(sum(basic_qty + professional_qty + premium_qty), 0)::int
        from expo_halls eh
        where eh.expo_id = e.id
      ) as total_booths,
      (
        select count(*)::int
        from seller_booth_registrations sbr
        where sbr.expo_id = e.id
      ) as sold_booths,
      (
        select count(distinct customer_id)::int
        from orders o
        where o.expo_name = e.name
      ) as visitors,
      (
        select count(*)::int
        from orders o
        where o.expo_name = e.name and o.order_type = 'booth_registration'
      ) * 1.5::int as rfq_count,
      (
        select count(*)::int
        from live_comments lc
        inner join go_live_events gle on gle.stream_session_id = lc.stream_session_id
        where gle.expo_id = e.id
      ) as chat_count
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and e.id = ${expoId}
      and pm.status = 'active'
      and po.status = 'active'
    limit 1
  `) as (PartnerExpoRow & {
    go_live_count: number
    total_booths: number
    sold_booths: number
    visitors: number
    rfq_count: number
    chat_count: number
  })[]

  const row = rows[0]
  return row
    ? {
        ...rowToAssignedExpo(row),
        goLiveCount: row.go_live_count,
        totalBooths: row.total_booths,
        soldBooths: row.sold_booths,
        visitors: row.visitors,
        rfqCount: row.rfq_count || Math.floor(row.visitors * 0.4),
        chatCount: row.chat_count || Math.floor(row.visitors * 0.8)
      }
    : null
}

async function getAssignedPartnerExpoName(userId: string, expoId: string) {
  const rows = (await sql`
    select e.id, e.name
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    inner join partner_expo_assignments pea on pea.partner_org_id = po.id
    inner join expos e on e.id = pea.expo_id
    where pm.user_id = ${userId}
      and e.id = ${expoId}
      and pm.status = 'active'
      and po.status = 'active'
    limit 1
  `) as { id: string; name: string }[]

  return rows[0] ?? null
}

function normalizePartnerBoothTier(
  tier: string | null
): keyof PartnerExpoExhibitorTierMix {
  if (tier && ["pro", "professional"].includes(tier.toLowerCase())) {
    return "Professional"
  }
  if (tier?.toLowerCase() === "premium") return "Premium"
  return "Basic"
}

function resolvePartnerPaymentStatus(input: {
  paidOrderCount: number
  orderCount: number
}): PartnerExpoExhibitorPaymentStatus {
  if (input.paidOrderCount > 0) return "Paid"
  if (input.orderCount > 0) return "Pending"
  return "No order"
}

export async function getPartnerExpoExhibitors(
  userId: string,
  expoId: string
): Promise<PartnerExpoExhibitorsWorkspace | null> {
  const assigned = await getAssignedPartnerExpoName(userId, expoId)
  if (!assigned) return null

  const rows = (await sql`
    with registration_rows as (
      select
        sbr.id,
        sbr.user_id,
        sbr.booth_ref,
        sbr.booth_tier,
        sbr.status,
        sbr.purchased_at,
        u.name as user_name,
        u.email as user_email,
        u.phone,
        u.website as user_website,
        u.location,
        u.company_id,
        null::text as industry,
        c.name as company_name,
        c.tax_id,
        c.logo_url,
        c.website as company_website,
        c.address as company_address,
        bc.publish_status,
        coalesce(jsonb_array_length(coalesce(bc.products, '[]'::jsonb)), 0)::int as product_count
      from seller_booth_registrations sbr
      inner join users u on u.id = sbr.user_id
      left join companies c on c.id = u.company_id
      left join booth_customizations bc on bc.registration_id = sbr.id
      where sbr.expo_id = ${expoId}
    ),
    matched_order_candidates as (
      select
        rr.id as registration_id,
        o.id,
        o.status,
        o.amount,
        row_number() over (
          partition by o.id
          order by
            case when o.reference_id = rr.id then 0 else 1 end,
            rr.purchased_at desc,
            rr.id asc
        ) as match_rank
      from registration_rows rr
      inner join orders o on
        o.reference_id = rr.id
        or (
          o.reference_id not in (select id from registration_rows)
          and o.expo_name = ${assigned.name}
          and o.booth_ref = rr.booth_ref
        )
      where o.order_type = 'booth_registration'
    ),
    matched_orders as (
      select registration_id, id, status, amount
      from matched_order_candidates
      where match_rank = 1
    )
    select
      coalesce(rr.company_id, rr.user_id) as exhibitor_id,
      coalesce(max(rr.company_name), max(rr.user_name), max(rr.user_email)) as display_name,
      min(rr.user_name) as contact_name,
      min(rr.user_email) as contact_email,
      min(rr.phone) as phone,
      coalesce(max(rr.company_website), max(rr.user_website)) as website,
      coalesce(max(rr.company_address), max(rr.location)) as address,
      max(rr.industry) as industry,
      max(rr.tax_id) as tax_id,
      max(rr.logo_url) as logo_url,
      count(distinct rr.id)::int as booth_count,
      array_agg(distinct rr.booth_ref order by rr.booth_ref) as booth_refs,
      count(distinct rr.id) filter (where lower(rr.booth_tier) not in ('pro', 'professional', 'premium'))::int as basic_count,
      count(distinct rr.id) filter (where lower(rr.booth_tier) in ('pro', 'professional'))::int as professional_count,
      count(distinct rr.id) filter (where lower(rr.booth_tier) = 'premium')::int as premium_count,
      array_agg(distinct rr.status order by rr.status) as registration_statuses,
      count(distinct rr.id) filter (where rr.publish_status = 'Published')::int as published_booth_count,
      coalesce(sum(rr.product_count), 0)::int as product_count,
      coalesce(sum(mo.amount) filter (where mo.status = 'Paid'), 0)::numeric as paid_amount,
      count(distinct mo.id)::int as order_count,
      count(distinct mo.id) filter (where mo.status = 'Paid')::int as paid_order_count,
      max(rr.purchased_at) as latest_purchased_at
    from registration_rows rr
    left join matched_orders mo on mo.registration_id = rr.id
    group by coalesce(rr.company_id, rr.user_id)
    order by booth_count desc, paid_amount desc, display_name asc
  `) as {
    exhibitor_id: string
    display_name: string
    contact_name: string | null
    contact_email: string | null
    phone: string | null
    website: string | null
    address: string | null
    industry: string | null
    tax_id: string | null
    logo_url: string | null
    booth_count: number | string
    booth_refs: string[]
    basic_count: number | string
    professional_count: number | string
    premium_count: number | string
    registration_statuses: string[]
    published_booth_count: number | string
    product_count: number | string
    paid_amount: number | string
    order_count: number | string
    paid_order_count: number | string
    latest_purchased_at: string | Date | null
  }[]

  const exhibitors = rows.map((row) => ({
    id: row.exhibitor_id,
    displayName: row.display_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    industry: row.industry,
    taxId: row.tax_id,
    logoUrl: row.logo_url,
    boothCount: toNumber(row.booth_count),
    boothRefs: row.booth_refs,
    tierMix: {
      Basic: toNumber(row.basic_count),
      Professional: toNumber(row.professional_count),
      Premium: toNumber(row.premium_count)
    },
    registrationStatuses: row.registration_statuses,
    publishedBoothCount: toNumber(row.published_booth_count),
    productCount: toNumber(row.product_count),
    paidAmount: toNumber(row.paid_amount),
    paymentStatus: resolvePartnerPaymentStatus({
      paidOrderCount: toNumber(row.paid_order_count),
      orderCount: toNumber(row.order_count)
    }),
    latestPurchasedAt: row.latest_purchased_at
      ? toIso(row.latest_purchased_at)
      : null
  }))

  return {
    summary: {
      exhibitorCount: exhibitors.length,
      boothCount: exhibitors.reduce((sum, item) => sum + item.boothCount, 0),
      publishedBoothCount: exhibitors.reduce(
        (sum, item) => sum + item.publishedBoothCount,
        0
      ),
      paidAmount: exhibitors.reduce((sum, item) => sum + item.paidAmount, 0)
    },
    exhibitors,
    topExhibitors: exhibitors.slice(0, 5)
  }
}

export async function getPartnerExpoExhibitorDetail(
  userId: string,
  expoId: string,
  exhibitorId: string
): Promise<PartnerExpoExhibitorDetail | null> {
  const workspace = await getPartnerExpoExhibitors(userId, expoId)
  if (!workspace) return null

  const exhibitor = workspace.exhibitors.find((item) => item.id === exhibitorId)
  if (!exhibitor) return null

  const assigned = await getAssignedPartnerExpoName(userId, expoId)
  if (!assigned) return null

  const registrationRows = (await sql`
    select
      sbr.id,
      sbr.booth_ref,
      sbr.booth_tier,
      sbr.status,
      sbr.purchased_at,
      bc.publish_status,
      coalesce(jsonb_array_length(coalesce(bc.products, '[]'::jsonb)), 0)::int as product_count
    from seller_booth_registrations sbr
    inner join users u on u.id = sbr.user_id
    left join booth_customizations bc on bc.registration_id = sbr.id
    where sbr.expo_id = ${expoId}
      and coalesce(u.company_id, u.id) = ${exhibitorId}
    order by sbr.purchased_at desc
  `) as {
    id: string
    booth_ref: string
    booth_tier: string
    status: string
    purchased_at: string | Date
    publish_status: string | null
    product_count: number | string
  }[]

  const orderRows = (await sql`
    with selected_registrations as (
      select sbr.id, sbr.booth_ref, sbr.purchased_at
      from seller_booth_registrations sbr
      inner join users u on u.id = sbr.user_id
      where sbr.expo_id = ${expoId}
        and coalesce(u.company_id, u.id) = ${exhibitorId}
    ),
    matched_order_candidates as (
      select
        o.id,
        sr.id as registration_id,
        o.booth_ref,
        o.booth_tier,
        o.payment_method,
        o.status,
        o.original_amount,
        o.discount_amount,
        o.amount,
        o.created_at,
        o.updated_at,
        row_number() over (
          partition by o.id
          order by
            case when o.reference_id = sr.id then 0 else 1 end,
            sr.purchased_at desc,
            sr.id asc
        ) as match_rank
      from selected_registrations sr
      inner join orders o on
        o.reference_id = sr.id
        or (
          o.reference_id not in (select id from selected_registrations)
          and o.expo_name = ${assigned.name}
          and o.booth_ref = sr.booth_ref
        )
      where o.order_type = 'booth_registration'
    )
    select
      id,
      registration_id,
      booth_ref,
      booth_tier,
      payment_method,
      status,
      original_amount,
      discount_amount,
      amount,
      created_at,
      updated_at
    from matched_order_candidates
    where match_rank = 1
    order by created_at desc
  `) as {
    id: string
    registration_id: string | null
    booth_ref: string | null
    booth_tier: string | null
    payment_method: string
    status: string
    original_amount: number | string
    discount_amount: number | string
    amount: number | string
    created_at: string | Date
    updated_at: string | Date
  }[]

  const performanceRows = (await sql`
    with expo_window as (
      select
        coalesce(start_at, start_date::timestamptz) as starts_at,
        coalesce(end_at, (end_date::date + interval '1 day')::timestamptz) as ends_at
      from expos
      where id = ${expoId}
    ),
    profile_stats as (
      select count(*)::int as eprofile_visits
      from expo_exhibitor_profile_visits event
      cross join expo_window ew
      where event.expo_id = ${expoId}
        and event.exhibitor_id = ${exhibitorId}
        and event.created_at >= ew.starts_at
        and event.created_at < ew.ends_at
    ),
    rfq_stats as (
      select count(*)::int as rfq_count
      from expo_exhibitor_rfq_events event
      cross join expo_window ew
      where event.expo_id = ${expoId}
        and event.exhibitor_id = ${exhibitorId}
        and event.created_at >= ew.starts_at
        and event.created_at < ew.ends_at
    ),
    chat_stats as (
      select count(*)::int as chat_count
      from expo_exhibitor_product_chat_events event
      cross join expo_window ew
      where event.expo_id = ${expoId}
        and event.exhibitor_id = ${exhibitorId}
        and event.created_at >= ew.starts_at
        and event.created_at < ew.ends_at
    )
    select
      coalesce((select eprofile_visits from profile_stats), 0)::int as eprofile_visits,
      coalesce((select rfq_count from rfq_stats), 0)::int as rfq_count,
      coalesce((select chat_count from chat_stats), 0)::int as chat_count
  `) as {
    eprofile_visits: number | string
    rfq_count: number | string
    chat_count: number | string
  }[]

  const topViewedRows = (await sql`
    with expo_window as (
      select
        coalesce(start_at, start_date::timestamptz) as starts_at,
        coalesce(end_at, (end_date::date + interval '1 day')::timestamptz) as ends_at
      from expos
      where id = ${expoId}
    )
    select
      event.product_id,
      coalesce(nullif(cp.name, ''), event.product_id) as product_name,
      count(*)::int as value
    from expo_exhibitor_product_views event
    cross join expo_window ew
    left join company_products cp on cp.id = event.product_id
    where event.expo_id = ${expoId}
      and event.exhibitor_id = ${exhibitorId}
      and event.created_at >= ew.starts_at
      and event.created_at < ew.ends_at
    group by event.product_id, cp.name
    order by value desc, product_name asc
    limit 1
  `) as { product_id: string; product_name: string; value: number | string }[]

  const topChattedRows = (await sql`
    with expo_window as (
      select
        coalesce(start_at, start_date::timestamptz) as starts_at,
        coalesce(end_at, (end_date::date + interval '1 day')::timestamptz) as ends_at
      from expos
      where id = ${expoId}
    )
    select
      event.product_id,
      coalesce(nullif(cp.name, ''), event.product_id) as product_name,
      count(*)::int as value
    from expo_exhibitor_product_chat_events event
    cross join expo_window ew
    left join company_products cp on cp.id = event.product_id
    where event.expo_id = ${expoId}
      and event.exhibitor_id = ${exhibitorId}
      and event.product_id is not null
      and event.created_at >= ew.starts_at
      and event.created_at < ew.ends_at
    group by event.product_id, cp.name
    order by value desc, product_name asc
    limit 1
  `) as { product_id: string; product_name: string; value: number | string }[]

  const topWishlistedRows = (await sql`
    with expo_window as (
      select
        coalesce(start_at, start_date::timestamptz) as starts_at,
        coalesce(end_at, (end_date::date + interval '1 day')::timestamptz) as ends_at
      from expos
      where id = ${expoId}
    ),
    selected_products as (
      select distinct product_id
      from (
        select jsonb_array_elements(coalesce(bc.products, '[]'::jsonb))->>'id' as product_id
        from seller_booth_registrations sbr
        inner join users u on u.id = sbr.user_id
        left join booth_customizations bc on bc.registration_id = sbr.id
        where sbr.expo_id = ${expoId}
          and coalesce(u.company_id, u.id) = ${exhibitorId}
      ) products
      where product_id is not null and product_id <> ''
    )
    select
      wi.target_id as product_id,
      coalesce(nullif(cp.name, ''), wi.target_id) as product_name,
      count(*)::int as value
    from user_wishlist_items wi
    inner join selected_products sp on sp.product_id = wi.target_id
    cross join expo_window ew
    left join company_products cp on cp.id = wi.target_id
    where wi.target_type = 'product'
      and wi.created_at >= ew.starts_at
      and wi.created_at < ew.ends_at
    group by wi.target_id, cp.name
    order by value desc, product_name asc
    limit 1
  `) as { product_id: string; product_name: string; value: number | string }[]

  const toPerformanceProduct = (row?: {
    product_id: string
    product_name: string
    value: number | string
  }): PartnerExpoExhibitorPerformanceProduct | null =>
    row
      ? {
          productId: row.product_id,
          productName: row.product_name,
          count: toNumber(row.value)
        }
      : null

  return {
    exhibitor,
    registrations: registrationRows.map((row) => ({
      id: row.id,
      boothRef: row.booth_ref,
      boothTier: normalizePartnerBoothTier(row.booth_tier),
      status: row.status,
      publishStatus: row.publish_status,
      productCount: toNumber(row.product_count),
      purchasedAt: toIso(row.purchased_at)
    })),
    orders: orderRows.map((row) => ({
      id: row.id,
      registrationId: row.registration_id,
      boothRef: row.booth_ref,
      boothTier: row.booth_tier,
      paymentMethod: row.payment_method,
      status: row.status,
      originalAmount: toNumber(row.original_amount),
      discountAmount: toNumber(row.discount_amount),
      amount: toNumber(row.amount),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at)
    })),
    performance: {
      rfqCount: toNumber(performanceRows[0]?.rfq_count),
      chatCount: toNumber(performanceRows[0]?.chat_count),
      eProfileVisits: toNumber(performanceRows[0]?.eprofile_visits),
      topViewedProduct: toPerformanceProduct(topViewedRows[0]),
      topChattedProduct: toPerformanceProduct(topChattedRows[0]),
      topWishlistedProduct: toPerformanceProduct(topWishlistedRows[0])
    }
  }
}

export async function getPartnerExpoOperationsDetail(
  userId: string,
  expoId: string
): Promise<PartnerExpoOperationsDetail | null> {
  const assigned = await getAssignedPartnerExpoName(userId, expoId)
  if (!assigned) return null

  const summaryRows = (await sql`
    with hall_capacity as (
      select
        coalesce(sum(basic_qty + professional_qty + premium_qty), 0)::int as total_booths
      from expo_halls
      where expo_id = ${expoId}
    ),
    booth_stats as (
      select
        count(*)::int as sold_booths,
        count(*) filter (where bc.publish_status = 'Published')::int as published_booths,
        coalesce(sum(jsonb_array_length(coalesce(bc.products, '[]'::jsonb))), 0)::int as products
      from seller_booth_registrations sbr
      left join booth_customizations bc on bc.registration_id = sbr.id
      where sbr.expo_id = ${expoId}
    ),
    golive_stats as (
      select
        count(*) filter (where gle.status <> 'Canceled')::int as go_live_events,
        count(*) filter (where ss.status = 'Live')::int as live_sessions,
        coalesce(sum(ss.peak_viewer_count), 0)::int as peak_viewers
      from go_live_events gle
      left join stream_sessions ss on ss.stream_session_id = gle.stream_session_id
      where gle.expo_id = ${expoId}
    ),
    comment_stats as (
      select count(lc.live_comment_id)::int as comments
      from go_live_events gle
      inner join live_comments lc on lc.stream_session_id = gle.stream_session_id
      where gle.expo_id = ${expoId}
        and lc.is_deleted = false
    ),
    order_stats as (
      select
        count(distinct customer_id)::int as visitors,
        coalesce(sum(amount) filter (where status = 'Paid'), 0)::numeric as revenue
      from orders
      where expo_name = ${assigned.name}
    )
    select
      coalesce(hc.total_booths, 0)::int as total_booths,
      coalesce(bs.sold_booths, 0)::int as sold_booths,
      greatest(coalesce(hc.total_booths, bs.sold_booths, 0) - coalesce(bs.sold_booths, 0), 0)::int as unsold_booths,
      coalesce(bs.published_booths, 0)::int as published_booths,
      coalesce(bs.products, 0)::int as products,
      coalesce(gs.go_live_events, 0)::int as go_live_events,
      coalesce(gs.live_sessions, 0)::int as live_sessions,
      coalesce(gs.peak_viewers, 0)::int as peak_viewers,
      coalesce(cs.comments, 0)::int as comments,
      coalesce(os.visitors, 0)::int as visitors,
      coalesce(os.revenue, 0)::numeric as revenue
    from hall_capacity hc
    cross join booth_stats bs
    cross join golive_stats gs
    cross join comment_stats cs
    cross join order_stats os
  `) as {
    total_booths: number | string
    sold_booths: number | string
    unsold_booths: number | string
    published_booths: number | string
    products: number | string
    go_live_events: number | string
    live_sessions: number | string
    peak_viewers: number | string
    comments: number | string
    visitors: number | string
    revenue: number | string
  }[]

  const tierRows = (await sql`
    with capacity as (
      select 'Basic' as tier, coalesce(sum(basic_qty), 0)::int as capacity
      from expo_halls
      where expo_id = ${expoId}
      union all
      select 'Professional' as tier, coalesce(sum(professional_qty), 0)::int as capacity
      from expo_halls
      where expo_id = ${expoId}
      union all
      select 'Premium' as tier, coalesce(sum(premium_qty), 0)::int as capacity
      from expo_halls
      where expo_id = ${expoId}
    ),
    sold as (
      select
        case
          when lower(booth_tier) in ('pro', 'professional') then 'Professional'
          when lower(booth_tier) = 'premium' then 'Premium'
          else 'Basic'
        end as tier,
        count(*)::int as sold,
        count(*) filter (where bc.publish_status = 'Published')::int as published
      from seller_booth_registrations sbr
      left join booth_customizations bc on bc.registration_id = sbr.id
      where sbr.expo_id = ${expoId}
      group by 1
    )
    select
      c.tier,
      c.capacity,
      coalesce(s.sold, 0)::int as sold,
      coalesce(s.published, 0)::int as published
    from capacity c
    left join sold s on s.tier = c.tier
    order by case c.tier when 'Basic' then 1 when 'Professional' then 2 else 3 end
  `) as {
    tier: string
    capacity: number | string
    sold: number | string
    published: number | string
  }[]

  const hallRows = (await sql`
    select
      id,
      hall_name,
      basic_qty,
      professional_qty,
      premium_qty,
      (basic_qty + professional_qty + premium_qty)::int as capacity
    from expo_halls
    where expo_id = ${expoId}
    order by sort_order asc
  `) as {
    id: string
    hall_name: string
    basic_qty: number | string
    professional_qty: number | string
    premium_qty: number | string
    capacity: number | string
  }[]

  const statusRows = (await sql`
    select status, count(*)::int as value
    from seller_booth_registrations
    where expo_id = ${expoId}
    group by status
    order by value desc, status asc
  `) as { status: string; value: number | string }[]

  const summaryRow = summaryRows[0]
  const totalBooths = toNumber(summaryRow?.total_booths)
  const soldBooths = toNumber(summaryRow?.sold_booths)

  return {
    summary: {
      totalBooths,
      soldBooths,
      unsoldBooths: toNumber(summaryRow?.unsold_booths),
      boothUtilization:
        totalBooths > 0 ? Math.round((soldBooths / totalBooths) * 100) : 0,
      publishedBooths: toNumber(summaryRow?.published_booths),
      goLiveEvents: toNumber(summaryRow?.go_live_events),
      liveSessions: toNumber(summaryRow?.live_sessions),
      peakViewers: toNumber(summaryRow?.peak_viewers),
      comments: toNumber(summaryRow?.comments),
      revenue: toNumber(summaryRow?.revenue),
      visitors: toNumber(summaryRow?.visitors),
      products: toNumber(summaryRow?.products)
    },
    tierBreakdown: tierRows.map((row) => ({
      tier: row.tier,
      capacity: toNumber(row.capacity),
      sold: toNumber(row.sold),
      published: toNumber(row.published)
    })),
    hallBreakdown: hallRows.map((row) => ({
      id: row.id,
      name: row.hall_name,
      capacity: toNumber(row.capacity),
      basicQty: toNumber(row.basic_qty),
      professionalQty: toNumber(row.professional_qty),
      premiumQty: toNumber(row.premium_qty)
    })),
    registrationStatusBreakdown: statusRows.map((row) => ({
      status: row.status,
      value: toNumber(row.value)
    }))
  }
}

export async function getPartnerDashboardMetrics(
  userId: string
): Promise<PartnerDashboardMetrics> {
  const expoRows = (await sql`
    with assigned as (
      select distinct e.id, e.name, e.status, e.start_date, e.end_date
      from partner_memberships pm
      inner join partner_organizations po on po.id = pm.partner_org_id
      inner join partner_expo_assignments pea on pea.partner_org_id = po.id
      inner join expos e on e.id = pea.expo_id
      where pm.user_id = ${userId}
        and pm.status = 'active'
        and po.status = 'active'
    ),
    hall_capacity as (
      select
        eh.expo_id,
        sum(eh.basic_qty + eh.professional_qty + eh.premium_qty)::int as total_booths
      from expo_halls eh
      inner join assigned a on a.id = eh.expo_id
      group by eh.expo_id
    ),
    booth_stats as (
      select
        sbr.expo_id,
        count(*)::int as sold_booths,
        count(*) filter (where bc.publish_status = 'Published')::int as published_booths
      from seller_booth_registrations sbr
      inner join assigned a on a.id = sbr.expo_id
      left join booth_customizations bc on bc.registration_id = sbr.id
      group by sbr.expo_id
    ),
    golive_stats as (
      select
        gle.expo_id,
        count(*) filter (where gle.status <> 'Canceled')::int as go_live_events,
        count(*) filter (where ss.status = 'Live')::int as live_sessions,
        coalesce(sum(ss.peak_viewer_count), 0)::int as peak_viewers
      from go_live_events gle
      inner join assigned a on a.id = gle.expo_id
      left join stream_sessions ss on ss.stream_session_id = gle.stream_session_id
      group by gle.expo_id
    ),
    comment_stats as (
      select
        gle.expo_id,
        count(lc.live_comment_id)::int as comments
      from go_live_events gle
      inner join assigned a on a.id = gle.expo_id
      inner join live_comments lc on lc.stream_session_id = gle.stream_session_id
      where lc.is_deleted = false
      group by gle.expo_id
    ),
    revenue_stats as (
      select
        a.id as expo_id,
        coalesce(sum(o.amount) filter (where o.status = 'Paid'), 0)::numeric as revenue
      from assigned a
      left join orders o on o.order_type = 'booth_registration'
        and o.expo_name = a.name
      group by a.id
    )
    select
      a.id,
      a.name,
      a.status,
      a.start_date,
      a.end_date,
      coalesce(hc.total_booths, bs.sold_booths, 0)::int as total_booths,
      coalesce(bs.sold_booths, 0)::int as sold_booths,
      greatest(coalesce(hc.total_booths, bs.sold_booths, 0) - coalesce(bs.sold_booths, 0), 0)::int as unsold_booths,
      coalesce(bs.published_booths, 0)::int as published_booths,
      coalesce(gs.go_live_events, 0)::int as go_live_events,
      coalesce(gs.live_sessions, 0)::int as live_sessions,
      coalesce(gs.peak_viewers, 0)::int as peak_viewers,
      coalesce(cs.comments, 0)::int as comments,
      coalesce(rs.revenue, 0)::numeric as revenue
    from assigned a
    left join hall_capacity hc on hc.expo_id = a.id
    left join booth_stats bs on bs.expo_id = a.id
    left join golive_stats gs on gs.expo_id = a.id
    left join comment_stats cs on cs.expo_id = a.id
    left join revenue_stats rs on rs.expo_id = a.id
    order by a.start_date asc, a.name asc
  `) as {
    id: string
    name: string
    status: string
    start_date: string | Date
    end_date: string | Date
    total_booths: number | string
    sold_booths: number | string
    unsold_booths: number | string
    published_booths: number | string
    go_live_events: number | string
    live_sessions: number | string
    peak_viewers: number | string
    comments: number | string
    revenue: number | string
  }[]

  const countryRows = (await sql`
    with assigned as (
      select distinct e.id
      from partner_memberships pm
      inner join partner_organizations po on po.id = pm.partner_org_id
      inner join partner_expo_assignments pea on pea.partner_org_id = po.id
      inner join expos e on e.id = pea.expo_id
      where pm.user_id = ${userId}
        and pm.status = 'active'
        and po.status = 'active'
    )
    select
      coalesce(nullif(trim(u.location), ''), 'Unknown') as name,
      count(*)::int as value
    from seller_booth_registrations sbr
    inner join assigned a on a.id = sbr.expo_id
    inner join users u on u.id = sbr.user_id
    group by coalesce(nullif(trim(u.location), ''), 'Unknown')
    order by value desc, name asc
    limit 6
  `) as { name: string; value: number | string }[]

  const boothTierRows = (await sql`
    with assigned as (
      select distinct e.id
      from partner_memberships pm
      inner join partner_organizations po on po.id = pm.partner_org_id
      inner join partner_expo_assignments pea on pea.partner_org_id = po.id
      inner join expos e on e.id = pea.expo_id
      where pm.user_id = ${userId}
        and pm.status = 'active'
        and po.status = 'active'
    )
    select
      sbr.booth_tier as name,
      count(*)::int as value
    from seller_booth_registrations sbr
    inner join assigned a on a.id = sbr.expo_id
    group by sbr.booth_tier
    order by value desc, name asc
  `) as { name: string; value: number | string }[]

  const operationRows = (await sql`
    with
      durations(label, days) as (
        values ('3D', 3), ('7D', 7), ('15D', 15), ('30D', 30)
      ),
      assigned_orgs as (
        select distinct po.id
        from partner_memberships pm
        inner join partner_organizations po on po.id = pm.partner_org_id
        where pm.user_id = ${userId}
          and pm.status = 'active'
          and po.status = 'active'
      ),
      assigned as (
        select distinct e.id
        from assigned_orgs ao
        inner join partner_expo_assignments pea on pea.partner_org_id = ao.id
        inner join expos e on e.id = pea.expo_id
      ),
      visit_events as (
        select
          case
            when epv.visitor_user_id is not null then 'user:' || epv.visitor_user_id
            when epv.visitor_key is not null then 'key:' || epv.visitor_key
            else 'event:' || epv.id
          end as visitor_id,
          epv.created_at
        from expo_exhibitor_profile_visits epv
        inner join assigned a on a.id = epv.expo_id
        where epv.created_at >= now() - interval '30 days'
        union all
        select
          case
            when epv.visitor_user_id is not null then 'user:' || epv.visitor_user_id
            when epv.visitor_key is not null then 'key:' || epv.visitor_key
            else 'event:' || epv.id
          end as visitor_id,
          epv.created_at
        from expo_exhibitor_product_views epv
        inner join assigned a on a.id = epv.expo_id
        where epv.created_at >= now() - interval '30 days'
      )
    select
      d.label,
      coalesce((
        select count(distinct ve.visitor_id)::int
        from visit_events ve
        where ve.created_at >= now() - d.days * interval '1 day'
      ), 0)::int as views,
      coalesce((
        select count(distinct coalesce(pem.enterprise_id, pem.id))::int
        from partner_enterprise_members pem
        inner join assigned_orgs ao on ao.id = pem.partner_org_id
        where pem.activation_status = 'active'
          and coalesce(pem.accepted_at, pem.updated_at, pem.created_at) >= now() - d.days * interval '1 day'
      ), 0)::int as activated_enterprises,
      coalesce((
        select count(*)::int
        from seller_booth_registrations sbr
        inner join assigned a on a.id = sbr.expo_id
        where sbr.purchased_at >= now() - d.days * interval '1 day'
      ), 0)::int as sold_booths,
      coalesce((
        select count(*)::int
        from expo_exhibitor_rfq_events rfq
        inner join assigned a on a.id = rfq.expo_id
        where rfq.created_at >= now() - d.days * interval '1 day'
      ), 0)::int as rfqs
    from durations d
    order by d.days asc
  `) as {
    label: PartnerDashboardDuration
    views: number | string
    activated_enterprises: number | string
    sold_booths: number | string
    rfqs: number | string
  }[]

  const expoMetrics = expoRows.map((row) => {
    const totalBooths = toNumber(row.total_booths)
    const soldBooths = toNumber(row.sold_booths)

    return {
      expoId: row.id,
      expoName: row.name,
      status: normalizePartnerExpoStatus(row.status),
      startDate: toDateOnly(row.start_date),
      endDate: toDateOnly(row.end_date),
      totalBooths,
      soldBooths,
      unsoldBooths: toNumber(row.unsold_booths),
      boothUtilization:
        totalBooths > 0 ? Math.round((soldBooths / totalBooths) * 100) : 0,
      publishedBooths: toNumber(row.published_booths),
      goLiveEvents: toNumber(row.go_live_events),
      liveSessions: toNumber(row.live_sessions),
      peakViewers: toNumber(row.peak_viewers),
      comments: toNumber(row.comments),
      revenue: toNumber(row.revenue)
    }
  })

  const totals = expoMetrics.reduce(
    (acc, item) => {
      acc.assignedExpos += 1
      if (item.status === "Live") acc.liveExpos += 1
      acc.soldBooths += item.soldBooths
      acc.totalBooths += item.totalBooths
      acc.publishedBooths += item.publishedBooths
      acc.goLiveEvents += item.goLiveEvents
      acc.liveSessions += item.liveSessions
      acc.peakViewers += item.peakViewers
      acc.comments += item.comments
      acc.revenue += item.revenue
      return acc
    },
    {
      assignedExpos: 0,
      liveExpos: 0,
      soldBooths: 0,
      totalBooths: 0,
      boothUtilization: 0,
      publishedBooths: 0,
      goLiveEvents: 0,
      liveSessions: 0,
      peakViewers: 0,
      comments: 0,
      revenue: 0
    }
  )
  totals.boothUtilization =
    totals.totalBooths > 0
      ? Math.round((totals.soldBooths / totals.totalBooths) * 100)
      : 0

  const operationsByDuration = operationRows.reduce(
    (acc, row) => {
      acc[row.label] = {
        views: toNumber(row.views),
        activatedEnterprises: toNumber(row.activated_enterprises),
        soldBooths: toNumber(row.sold_booths),
        rfqs: toNumber(row.rfqs)
      }
      return acc
    },
    {
      "3D": { views: 0, activatedEnterprises: 0, soldBooths: 0, rfqs: 0 },
      "7D": { views: 0, activatedEnterprises: 0, soldBooths: 0, rfqs: 0 },
      "15D": { views: 0, activatedEnterprises: 0, soldBooths: 0, rfqs: 0 },
      "30D": { views: 0, activatedEnterprises: 0, soldBooths: 0, rfqs: 0 }
    } satisfies Record<
      PartnerDashboardDuration,
      PartnerDashboardOperationsSummary
    >
  )

  const statusMap = new Map<string, number>()
  for (const item of expoMetrics) {
    statusMap.set(item.status, (statusMap.get(item.status) ?? 0) + 1)
  }

  return {
    totals,
    operationsByDuration,
    expoMetrics,
    statusBreakdown: Array.from(statusMap, ([name, value]) => ({
      name,
      value
    })),
    countryBreakdown: countryRows.map((row) => ({
      name: row.name,
      value: toNumber(row.value)
    })),
    boothTierBreakdown: boothTierRows.map((row) => ({
      name: row.name,
      value: toNumber(row.value)
    }))
  }
}

export async function ensureCoHostPartnerAssignment(input: {
  userId: string
  userEmail: string
  expoId: string
  replaceExisting?: boolean
}) {
  const existingOrgRows = (await sql`
    select po.id, po.name
    from partner_memberships pm
    inner join partner_organizations po on po.id = pm.partner_org_id
    where pm.user_id = ${input.userId}
      and pm.status = 'active'
      and po.status = 'active'
      and po.partner_type = 'expo_partner'
    order by
      case pm.role
        when 'partner_owner' then 1
        when 'primary_representative' then 2
        when 'partner_admin' then 3
        when 'admin' then 4
        else 5
      end,
      po.created_at asc
    limit 1
  `) as { id: string; name: string }[]
  const existingOrg = existingOrgRows[0]
  const orgId =
    existingOrg?.id ??
    `partner-org-${createHash("sha256").update(input.userId).digest("hex")}`

  const userRows = (await sql`
    select name
    from users
    where id = ${input.userId}
    limit 1
  `) as { name: string }[]
  const userName = existingOrg?.name ?? userRows[0]?.name ?? input.userEmail

  await sql`
    insert into partner_organizations (
      id,
      name,
      model,
      partner_type,
      status,
      primary_user_id,
      created_at,
      updated_at
    )
    values (
      ${orgId},
      ${userName},
      'co_host',
      'expo_partner',
      'active',
      ${input.userId},
      now(),
      now()
    )
    on conflict (id) do update
    set
      name = excluded.name,
      partner_type = excluded.partner_type,
      primary_user_id = excluded.primary_user_id,
      updated_at = now()
  `

  await sql`
    insert into partner_memberships (partner_org_id, user_id, role, status)
    values (${orgId}, ${input.userId}, 'primary_representative', 'active')
    on conflict (partner_org_id, user_id) do update
    set
      role = excluded.role,
      status = excluded.status
  `

  if (input.replaceExisting) {
    await sql`
      delete from partner_expo_assignments
      where expo_id = ${input.expoId}
        and partner_org_id <> ${orgId}
    `
  }

  await sql`
    insert into partner_expo_assignments (
      partner_org_id,
      expo_id,
      partnership_model,
      capabilities
    )
    values (${orgId}, ${input.expoId}, 'co_host', '{}'::jsonb)
    on conflict (partner_org_id, expo_id) do update
    set partnership_model = excluded.partnership_model
  `
}
