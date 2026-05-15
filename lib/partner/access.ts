import { userHasRole } from "@/lib/auth/rbac"
import {
  getPrimaryPartnerOrganization,
  type PartnerMembershipRole,
  type PartnerPortalOrganization
} from "@/lib/partner/db"

export type PartnerPortalTab =
  | "overview"
  | "expo"
  | "enterprises"
  | "quota"
  | "bundles"
  | "communications"
  | "finance"
  | "analytics"
  | "government"

export type PartnerPortalAction =
  | "expo.edit"
  | "turnkey.create"
  | "enterprise.manage"
  | "enterprise.advance"
  | "quota.manage"
  | "invite.manage"
  | "tradeCredits.manage"
  | "bundle.manage"
  | "bundle.purchase"
  | "communications.manage"
  | "chat.use"
  | "finance.manage"
  | "settlement.manage"
  | "analytics.view"
  | "government.manage"

export type PartnerAccess = {
  organization: PartnerPortalOrganization | null
  role: PartnerMembershipRole | null
  tabs: Record<PartnerPortalTab, boolean>
  actions: Record<PartnerPortalAction, boolean>
  readOnly: boolean
}

const allTabs: PartnerPortalTab[] = [
  "overview",
  "expo",
  "enterprises",
  "quota",
  "bundles",
  "communications",
  "finance",
  "analytics",
  "government"
]

const allActions: PartnerPortalAction[] = [
  "expo.edit",
  "turnkey.create",
  "enterprise.manage",
  "enterprise.advance",
  "quota.manage",
  "invite.manage",
  "tradeCredits.manage",
  "bundle.manage",
  "bundle.purchase",
  "communications.manage",
  "chat.use",
  "finance.manage",
  "settlement.manage",
  "analytics.view",
  "government.manage"
]

const emptyTabs = Object.fromEntries(
  allTabs.map((tab) => [tab, false])
) as Record<PartnerPortalTab, boolean>

const emptyActions = Object.fromEntries(
  allActions.map((action) => [action, false])
) as Record<PartnerPortalAction, boolean>

const ownerActions = allActions
const programManagerActions = allActions.filter(
  (action) => action !== "finance.manage" && action !== "settlement.manage"
)
const governmentActions: PartnerPortalAction[] = [
  "quota.manage",
  "invite.manage",
  "tradeCredits.manage",
  "enterprise.manage",
  "enterprise.advance",
  "analytics.view",
  "government.manage"
]
const businessManagerActions: PartnerPortalAction[] = [
  "enterprise.manage",
  "enterprise.advance",
  "bundle.manage",
  "bundle.purchase",
  "communications.manage",
  "chat.use",
  "analytics.view"
]
const operationsActions: PartnerPortalAction[] = [
  "expo.edit",
  "turnkey.create",
  "enterprise.manage",
  "enterprise.advance",
  "communications.manage",
  "chat.use",
  "analytics.view"
]
const financeActions: PartnerPortalAction[] = [
  "finance.manage",
  "settlement.manage",
  "analytics.view"
]

const roleTabs: Record<PartnerMembershipRole, PartnerPortalTab[]> = {
  primary_representative: allTabs,
  admin: allTabs,
  operator: ["overview", "expo", "enterprises", "communications", "analytics"],
  analyst: [
    "overview",
    "expo",
    "enterprises",
    "quota",
    "bundles",
    "finance",
    "analytics"
  ],
  partner_owner: allTabs,
  partner_admin: allTabs,
  program_manager: allTabs.filter((tab) => tab !== "finance"),
  business_manager: [
    "overview",
    "enterprises",
    "bundles",
    "communications",
    "analytics"
  ],
  operations: [
    "overview",
    "expo",
    "enterprises",
    "communications",
    "analytics"
  ],
  finance: ["finance", "analytics"],
  viewer: [
    "overview",
    "expo",
    "enterprises",
    "quota",
    "bundles",
    "finance",
    "analytics"
  ]
}

const roleActions: Record<PartnerMembershipRole, PartnerPortalAction[]> = {
  primary_representative: ownerActions,
  admin: ownerActions,
  operator: operationsActions,
  analyst: ["analytics.view"],
  partner_owner: ownerActions,
  partner_admin: ownerActions,
  program_manager: programManagerActions,
  business_manager: businessManagerActions,
  operations: operationsActions,
  finance: financeActions,
  viewer: ["analytics.view"]
}

function makeRecord<T extends string>(
  keys: readonly T[],
  allowed: readonly T[]
) {
  const allowedSet = new Set(allowed)
  return Object.fromEntries(
    keys.map((key) => [key, allowedSet.has(key)])
  ) as Record<T, boolean>
}

export async function getPartnerAccess(userId: string): Promise<PartnerAccess> {
  const hasPartnerRole = await userHasRole(userId, "partner")
  if (!hasPartnerRole) {
    return {
      organization: null,
      role: null,
      tabs: emptyTabs,
      actions: emptyActions,
      readOnly: true
    }
  }

  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) {
    return {
      organization: null,
      role: null,
      tabs: emptyTabs,
      actions: emptyActions,
      readOnly: true
    }
  }

  const baseTabs = roleTabs[organization.membershipRole] ?? []
  const baseActions = roleActions[organization.membershipRole] ?? []
  const actions =
    organization.partnerType === "government_program_partner"
      ? Array.from(new Set([...baseActions, ...governmentActions]))
      : baseActions
  const tabs =
    organization.partnerType === "government_program_partner"
      ? Array.from(new Set([...baseTabs, "government" as const]))
      : baseTabs

  return {
    organization,
    role: organization.membershipRole,
    tabs: makeRecord(allTabs, tabs),
    actions: makeRecord(allActions, actions),
    readOnly: actions.every((action) => action === "analytics.view")
  }
}

export async function requirePartnerTab(userId: string, tab: PartnerPortalTab) {
  const access = await getPartnerAccess(userId)
  if (!access.tabs[tab]) throw new Error("Forbidden.")
  return access
}

export async function requirePartnerAction(
  userId: string,
  action: PartnerPortalAction
) {
  const access = await getPartnerAccess(userId)
  if (!access.actions[action]) throw new Error("Forbidden.")
  return access
}

export async function requirePartnerApiAction(action: PartnerPortalAction) {
  const { getCurrentUserIdFromRequest } = await import("@/lib/auth/rbac")
  const userId = await getCurrentUserIdFromRequest()
  await requirePartnerAction(userId, action)
  return userId
}
