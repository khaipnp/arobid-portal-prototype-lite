import { createHash, randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
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

export type PartnerPortalSummary = {
  organization: PartnerPortalOrganization | null
  overview: {
    enterprisesActivated: number
    expoBoothsUsed: number
    tradeCreditsAllocated: number
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
    walletBalance: number
    walletAllocated: number
    walletConsumed: number
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

export type PartnerEnterpriseMember = {
  id: string
  enterpriseName: string
  contactEmail: string | null
  activationStatus:
    | "invited"
    | "registered"
    | "profile_completed"
    | "expo_activated"
    | "rfq_generated"
  expoParticipationCount: number
  rfqGeneratedCount: number
  tradeSignalCount: number
  quotaAllocatedQuantity?: number
  quotaConsumedQuantity?: number
  tradeCreditsAllocated?: number
  tradeCreditsConsumed?: number
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

export type PartnerTradeCreditLedgerEntry = {
  id: string
  entryType: "purchase" | "allocate" | "consume" | "release"
  amount: number
  enterpriseMemberId: string | null
  enterpriseName: string | null
  note: string | null
  createdAt: string
}

export type PartnerQuotaWorkspace = {
  organization: PartnerPortalOrganization | null
  quotas: PartnerQuota[]
  enterpriseMembers: PartnerEnterpriseMember[]
  inviteCampaigns: PartnerInviteCampaign[]
  wallet: {
    balance: number
    allocated: number
    consumed: number
  }
  ledger: PartnerTradeCreditLedgerEntry[]
}

export type PartnerTurnkeyExpoRequest = {
  id: string
  title: string
  industry: string
  targetStartDate: string | null
  expectedEnterprises: number
  requestedBooths: number
  status:
    | "draft"
    | "submitted"
    | "in_review"
    | "approved"
    | "rejected"
    | "converted"
  notes: string
  createdAt: string
}

export type PartnerExpoProgramsWorkspace = {
  assignedExpos: PartnerAssignedExpo[]
  quotaWorkspace: PartnerQuotaWorkspace
  turnkeyRequests: PartnerTurnkeyExpoRequest[]
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

export type PartnerRevenueEvent = {
  id: string
  sourceType: string
  sourceId: string | null
  grossAmount: number
  partnerAmount: number
  arobidAmount: number
  status: string
  createdAt: string
}

export type PartnerSettlement = {
  id: string
  cycleMonth: string
  grossAmount: number
  partnerAmount: number
  arobidAmount: number
  status: "pending" | "settled" | "canceled"
  createdAt: string
  settledAt: string | null
}

export type PartnerBundlesWorkspace = {
  organization: PartnerPortalOrganization | null
  bundles: PartnerServiceBundle[]
  revenueEvents: PartnerRevenueEvent[]
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

async function getPrimaryPartnerOrganization(
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

export async function getPartnerPortalSummary(
  userId: string
): Promise<PartnerPortalSummary> {
  const organization = await getPrimaryPartnerOrganization(userId)

  const empty: PartnerPortalSummary = {
    organization,
    overview: {
      enterprisesActivated: 0,
      expoBoothsUsed: 0,
      tradeCreditsAllocated: 0,
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
      activeInviteCampaigns: 0,
      walletBalance: 0,
      walletAllocated: 0,
      walletConsumed: 0
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
    quotaRows,
    walletRows,
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
        count(*)::int as total,
        count(*) filter (where activation_status = 'invited')::int as invited,
        count(*) filter (where activation_status = 'registered')::int as registered,
        count(*) filter (where activation_status = 'profile_completed')::int as profile_completed,
        count(*) filter (where activation_status = 'expo_activated')::int as expo_activated,
        count(*) filter (where activation_status = 'rfq_generated')::int as rfq_generated,
        coalesce(sum(rfq_generated_count), 0)::int as rfq_generated_count,
        coalesce(sum(trade_signal_count), 0)::int as trade_signal_count
      from partner_enterprise_members
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
        coalesce(balance, 0)::numeric as balance,
        coalesce(allocated, 0)::numeric as allocated,
        coalesce(consumed, 0)::numeric as consumed
      from partner_trade_credit_wallets
      where partner_org_id = ${orgId}
      limit 1
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
  const quota = (
    quotaRows as {
      total_quantity: number | string
      allocated_quantity: number | string
      consumed_quantity: number | string
      active_invite_campaigns: number | string
    }[]
  )[0]
  const wallet = (
    walletRows as {
      balance: number | string
      allocated: number | string
      consumed: number | string
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
    toNumber(enterprise?.rfq_generated_count) ||
    toNumber(enterprise?.rfq_generated)
  const assignedExpos = toNumber(expo?.assigned_expos)
  const bundleSales = toNumber(revenue?.bundle_sales)

  return {
    ...empty,
    overview: {
      enterprisesActivated: toNumber(enterprise?.expo_activated),
      expoBoothsUsed: toNumber(expo?.expo_booths_used),
      tradeCreditsAllocated: toNumber(wallet?.allocated),
      rfqGenerated,
      dealContexts: rfqGenerated,
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
      activeInviteCampaigns: toNumber(quota?.active_invite_campaigns),
      walletBalance: toNumber(wallet?.balance),
      walletAllocated: toNumber(wallet?.allocated),
      walletConsumed: toNumber(wallet?.consumed)
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
      enterprise_name,
      contact_email,
      activation_status,
      expo_participation_count,
      rfq_generated_count,
      trade_signal_count
    from partner_enterprise_members
    where id = ${memberId}
      and partner_org_id = ${organization.id}
    limit 1
  `) as {
    id: string
    enterprise_name: string
    contact_email: string | null
    activation_status: PartnerEnterpriseMember["activationStatus"]
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
      enterpriseName: row.enterprise_name,
      contactEmail: row.contact_email,
      activationStatus: row.activation_status,
      expoParticipationCount: toNumber(row.expo_participation_count),
      rfqGeneratedCount: toNumber(row.rfq_generated_count),
      tradeSignalCount: toNumber(row.trade_signal_count),
      quotaAllocatedQuantity: 0,
      quotaConsumedQuantity: 0,
      tradeCreditsAllocated: 0,
      tradeCreditsConsumed: 0
    }
  }
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
      inviteCampaigns: [],
      wallet: { balance: 0, allocated: 0, consumed: 0 },
      ledger: []
    }
  }

  const orgId = organization.id
  const [quotaRows, memberRows, campaignRows, walletRows, ledgerRows] =
    await Promise.all([
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
          id,
          enterprise_name,
          contact_email,
          activation_status,
          expo_participation_count,
          rfq_generated_count,
          trade_signal_count
        from partner_enterprise_members
        where partner_org_id = ${orgId}
        order by created_at desc
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
      `,
      sql`
        select balance, allocated, consumed
        from partner_trade_credit_wallets
        where partner_org_id = ${orgId}
        limit 1
      `,
      sql`
        select
          l.id,
          l.entry_type,
          l.amount,
          l.enterprise_member_id,
          pem.enterprise_name,
          l.note,
          l.created_at
        from partner_trade_credit_ledger l
        left join partner_enterprise_members pem on pem.id = l.enterprise_member_id
        where l.partner_org_id = ${orgId}
        order by l.created_at desc
        limit 20
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
        activation_status: PartnerEnterpriseMember["activationStatus"]
        expo_participation_count: number | string
        rfq_generated_count: number | string
        trade_signal_count: number | string
      }[]
    ).map((row) => ({
      id: row.id,
      enterpriseName: row.enterprise_name,
      contactEmail: row.contact_email,
      activationStatus: row.activation_status,
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
    })),
    wallet: {
      balance: toNumber(
        (walletRows as { balance: number | string }[])[0]?.balance
      ),
      allocated: toNumber(
        (walletRows as { allocated: number | string }[])[0]?.allocated
      ),
      consumed: toNumber(
        (walletRows as { consumed: number | string }[])[0]?.consumed
      )
    },
    ledger: (
      ledgerRows as {
        id: string
        entry_type: PartnerTradeCreditLedgerEntry["entryType"]
        amount: number | string
        enterprise_member_id: string | null
        enterprise_name: string | null
        note: string | null
        created_at: string | Date
      }[]
    ).map((row) => ({
      id: row.id,
      entryType: row.entry_type,
      amount: toNumber(row.amount),
      enterpriseMemberId: row.enterprise_member_id,
      enterpriseName: row.enterprise_name,
      note: row.note,
      createdAt: toIso(row.created_at)
    }))
  }
}

export async function getPartnerTurnkeyExpoRequests(
  userId: string
): Promise<PartnerTurnkeyExpoRequest[]> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) return []

  const rows = (await sql`
    select
      id,
      title,
      industry,
      target_start_date,
      expected_enterprises,
      requested_booths,
      status,
      notes,
      created_at
    from partner_turnkey_expo_requests
    where partner_org_id = ${organization.id}
    order by created_at desc
  `) as {
    id: string
    title: string
    industry: string
    target_start_date: string | Date | null
    expected_enterprises: number | string
    requested_booths: number | string
    status: PartnerTurnkeyExpoRequest["status"]
    notes: string
    created_at: string | Date
  }[]

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    industry: row.industry,
    targetStartDate: row.target_start_date
      ? toDateOnly(row.target_start_date)
      : null,
    expectedEnterprises: toNumber(row.expected_enterprises),
    requestedBooths: toNumber(row.requested_booths),
    status: row.status,
    notes: row.notes,
    createdAt: toIso(row.created_at)
  }))
}

export async function getPartnerExpoProgramsWorkspace(
  userId: string
): Promise<PartnerExpoProgramsWorkspace> {
  const [assignedExpos, quotaWorkspace, turnkeyRequests] = await Promise.all([
    listPartnerAssignedExpos(userId),
    getPartnerQuotaWorkspace(userId),
    getPartnerTurnkeyExpoRequests(userId)
  ])

  return {
    assignedExpos,
    quotaWorkspace,
    turnkeyRequests
  }
}

export async function createPartnerTurnkeyExpoRequest(
  userId: string,
  input: {
    title: string
    industry?: string | null
    targetStartDate?: string | null
    expectedEnterprises?: number
    requestedBooths?: number
    notes?: string | null
  }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const title = input.title.trim()
  if (!title) throw new Error("Expo request title is required.")
  const expectedEnterprises = Math.max(
    0,
    Math.floor(Number(input.expectedEnterprises) || 0)
  )
  const requestedBooths = Math.max(
    0,
    Math.floor(Number(input.requestedBooths) || 0)
  )
  const id = `partner-turnkey-request-${randomUUID()}`

  await sql`
    insert into partner_turnkey_expo_requests (
      id,
      partner_org_id,
      title,
      industry,
      target_start_date,
      expected_enterprises,
      requested_booths,
      status,
      notes
    )
    values (
      ${id},
      ${organization.id},
      ${title},
      ${input.industry?.trim() || ""},
      ${input.targetStartDate || null},
      ${expectedEnterprises},
      ${requestedBooths},
      'submitted',
      ${input.notes?.trim() || ""}
    )
  `

  return { id }
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

  const [bundleRows, revenueRows] = await Promise.all([
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
        gross_amount,
        partner_amount,
        arobid_amount,
        status,
        created_at
      from partner_revenue_events
      where partner_org_id = ${organization.id}
      order by created_at desc
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
    revenueRows as {
      id: string
      source_type: string
      source_id: string | null
      gross_amount: number | string
      partner_amount: number | string
      arobid_amount: number | string
      status: string
      created_at: string | Date
    }[]
  ).map((row) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    grossAmount: toNumber(row.gross_amount),
    partnerAmount: toNumber(row.partner_amount),
    arobidAmount: toNumber(row.arobid_amount),
    status: row.status,
    createdAt: toIso(row.created_at)
  }))

  return {
    organization,
    bundles,
    revenueEvents,
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

  return { id }
}

function mapPartnerRevenueEvent(row: {
  id: string
  source_type: string
  source_id: string | null
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
    createdAt: toIso(row.created_at),
    settledAt: row.settled_at ? toIso(row.settled_at) : null
  }
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
        pendingSettlement: 0,
        settledSettlement: 0
      }
    }
  }

  const [revenueRows, settlementRows, cycleRows] = await Promise.all([
    sql`
      select
        id,
        source_type,
        source_id,
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
      select distinct to_char(created_at, 'YYYY-MM') as cycle_month
      from partner_revenue_events
      where partner_org_id = ${organization.id}
      order by cycle_month desc
    `
  ])

  const revenueEvents = (
    revenueRows as Parameters<typeof mapPartnerRevenueEvent>[0][]
  ).map(mapPartnerRevenueEvent)
  const settlements = (
    settlementRows as Parameters<typeof mapPartnerSettlement>[0][]
  ).map(mapPartnerSettlement)

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
  await sql`
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
  `

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
    returning cycle_month
  `) as { cycle_month: string }[]

  const row = rows[0]
  if (!row) throw new Error("Settlement not found.")

  await sql`
    update partner_revenue_events
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
    credit_totals as (
      select
        enterprise_member_id,
        coalesce(sum(amount) filter (where entry_type = 'allocate'), 0)::numeric as trade_credits_allocated,
        coalesce(sum(amount) filter (where entry_type = 'consume'), 0)::numeric as trade_credits_consumed
      from partner_trade_credit_ledger
      where partner_org_id = ${organization.id}
        and enterprise_member_id is not null
      group by enterprise_member_id
    )
    select
      pem.id,
      pem.enterprise_name,
      pem.contact_email,
      pem.activation_status,
      pem.expo_participation_count,
      pem.rfq_generated_count,
      pem.trade_signal_count,
      coalesce(qt.quota_allocated_quantity, 0)::int as quota_allocated_quantity,
      coalesce(qt.quota_consumed_quantity, 0)::int as quota_consumed_quantity,
      coalesce(ct.trade_credits_allocated, 0)::numeric as trade_credits_allocated,
      coalesce(ct.trade_credits_consumed, 0)::numeric as trade_credits_consumed
    from partner_enterprise_members pem
    left join quota_totals qt on qt.enterprise_member_id = pem.id
    left join credit_totals ct on ct.enterprise_member_id = pem.id
    where pem.partner_org_id = ${organization.id}
    order by pem.created_at desc
  `) as {
    id: string
    enterprise_name: string
    contact_email: string | null
    activation_status: PartnerEnterpriseMember["activationStatus"]
    expo_participation_count: number | string
    rfq_generated_count: number | string
    trade_signal_count: number | string
    quota_allocated_quantity: number | string
    quota_consumed_quantity: number | string
    trade_credits_allocated: number | string
    trade_credits_consumed: number | string
  }[]

  const members = rows.map((row) => ({
    id: row.id,
    enterpriseName: row.enterprise_name,
    contactEmail: row.contact_email ?? "",
    activationStatus: row.activation_status,
    expoParticipationCount: toNumber(row.expo_participation_count),
    rfqGeneratedCount: toNumber(row.rfq_generated_count),
    tradeSignalCount: toNumber(row.trade_signal_count),
    quotaAllocatedQuantity: toNumber(row.quota_allocated_quantity),
    quotaConsumedQuantity: toNumber(row.quota_consumed_quantity),
    tradeCreditsAllocated: toNumber(row.trade_credits_allocated),
    tradeCreditsConsumed: toNumber(row.trade_credits_consumed)
  }))

  return {
    organization,
    members,
    funnel: {
      invited: members.filter((member) => member.activationStatus === "invited")
        .length,
      registered: members.filter(
        (member) => member.activationStatus === "registered"
      ).length,
      profileCompleted: members.filter(
        (member) => member.activationStatus === "profile_completed"
      ).length,
      expoActivated: members.filter(
        (member) => member.activationStatus === "expo_activated"
      ).length,
      rfqGenerated: members.filter(
        (member) => member.activationStatus === "rfq_generated"
      ).length
    }
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
      updated_at = now()
    where id = ${input.memberId}
      and partner_org_id = ${organization.id}
  `
}

export async function advancePartnerEnterpriseActivation(
  userId: string,
  memberId: string
) {
  const { organization, member } = await requirePartnerEnterpriseMember(
    userId,
    memberId
  )
  const nextStatus: Record<
    PartnerEnterpriseMember["activationStatus"],
    PartnerEnterpriseMember["activationStatus"]
  > = {
    invited: "registered",
    registered: "profile_completed",
    profile_completed: "expo_activated",
    expo_activated: "rfq_generated",
    rfq_generated: "rfq_generated"
  }
  const next = nextStatus[member.activationStatus]

  await sql`
    update partner_enterprise_members
    set
      activation_status = ${next},
      expo_participation_count = case
        when ${next} = 'expo_activated' and activation_status <> 'expo_activated'
        then expo_participation_count + 1
        else expo_participation_count
      end,
      rfq_generated_count = case
        when ${next} = 'rfq_generated' and activation_status <> 'rfq_generated'
        then rfq_generated_count + 1
        else rfq_generated_count
      end,
      trade_signal_count = case
        when ${next} = 'rfq_generated' and activation_status <> 'rfq_generated'
        then trade_signal_count + 1
        else trade_signal_count
      end,
      updated_at = now()
    where id = ${memberId}
      and partner_org_id = ${organization.id}
  `
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

export async function createPartnerEnterpriseMember(
  userId: string,
  input: { enterpriseName: string; contactEmail?: string | null }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  const enterpriseName = input.enterpriseName.trim()
  if (!enterpriseName) throw new Error("Enterprise name is required.")
  const id = `partner-member-${randomUUID()}`

  await sql`
    insert into partner_enterprise_members (
      id,
      partner_org_id,
      enterprise_name,
      contact_email,
      activation_status
    )
    values (
      ${id},
      ${organization.id},
      ${enterpriseName},
      ${input.contactEmail?.trim() || null},
      'invited'
    )
  `
  return { id }
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
        activation_status = 'expo_activated',
        expo_participation_count = expo_participation_count + 1,
        updated_at = now()
      where id = ${input.enterpriseMemberId}
        and partner_org_id = ${organization.id}
    `
  }
}

export async function recordPartnerTradeCreditEntry(
  userId: string,
  input: {
    entryType: PartnerTradeCreditLedgerEntry["entryType"]
    amount: number
    enterpriseMemberId?: string | null
    note?: string | null
  }
) {
  const organization = await requirePrimaryPartnerOrganization(userId)
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Amount must be greater than 0.")
  }
  if (input.enterpriseMemberId) {
    await requirePartnerEnterpriseMember(userId, input.enterpriseMemberId)
  }

  const walletRows = (await sql`
    insert into partner_trade_credit_wallets (
      partner_org_id,
      balance,
      allocated,
      consumed,
      updated_at
    )
    values (${organization.id}, 0, 0, 0, now())
    on conflict (partner_org_id) do update
    set updated_at = now()
    returning balance, allocated, consumed
  `) as {
    balance: number | string
    allocated: number | string
    consumed: number | string
  }[]

  const wallet = walletRows[0]
  const balance = toNumber(wallet?.balance)
  const allocated = toNumber(wallet?.allocated)
  const amount = input.amount

  if (input.entryType === "allocate" && amount > balance) {
    throw new Error("Not enough TradeCredit balance.")
  }
  if (input.entryType === "consume" && amount > allocated) {
    throw new Error("Not enough allocated TradeCredits.")
  }

  if (input.entryType === "purchase") {
    await sql`
      update partner_trade_credit_wallets
      set balance = balance + ${amount}, updated_at = now()
      where partner_org_id = ${organization.id}
    `
  } else if (input.entryType === "allocate") {
    await sql`
      update partner_trade_credit_wallets
      set
        balance = balance - ${amount},
        allocated = allocated + ${amount},
        updated_at = now()
      where partner_org_id = ${organization.id}
    `
  } else if (input.entryType === "consume") {
    await sql`
      update partner_trade_credit_wallets
      set
        allocated = allocated - ${amount},
        consumed = consumed + ${amount},
        updated_at = now()
      where partner_org_id = ${organization.id}
    `
  } else {
    await sql`
      update partner_trade_credit_wallets
      set
        balance = balance + ${amount},
        allocated = greatest(allocated - ${amount}, 0),
        updated_at = now()
      where partner_org_id = ${organization.id}
    `
  }

  const id = `partner-credit-${randomUUID()}`
  await sql`
    insert into partner_trade_credit_ledger (
      id,
      partner_org_id,
      entry_type,
      amount,
      enterprise_member_id,
      note
    )
    values (
      ${id},
      ${organization.id},
      ${input.entryType},
      ${amount},
      ${input.enterpriseMemberId || null},
      ${input.note?.trim() || null}
    )
  `
  return { id }
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

export async function getPartnerExpoOperationsDetail(
  userId: string,
  expoId: string
): Promise<PartnerExpoOperationsDetail | null> {
  const assignedRows = (await sql`
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

  const assigned = assignedRows[0]
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

  const statusMap = new Map<string, number>()
  for (const item of expoMetrics) {
    statusMap.set(item.status, (statusMap.get(item.status) ?? 0) + 1)
  }

  return {
    totals,
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
  const orgId = `partner-org-${createHash("sha256").update(input.userId).digest("hex")}`

  const userRows = (await sql`
    select name
    from users
    where id = ${input.userId}
    limit 1
  `) as { name: string }[]
  const userName = userRows[0]?.name ?? input.userEmail

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
