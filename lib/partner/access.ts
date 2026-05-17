import { userHasRole } from "@/lib/auth/rbac"
import {
  getPartnerModuleVisibility,
  isPartnerRoleReadOnly,
  normalizePartnerRole,
  type PartnerCapability,
  type PartnerModule,
  type PartnerMvpRole,
  type PartnerScopeSummary
} from "@/lib/partner/core"
import {
  getPartnerCapabilities,
  getPartnerScopes,
  getPrimaryPartnerOrganization,
  type PartnerMembershipRole,
  type PartnerPortalOrganization
} from "@/lib/partner/db"

export type PartnerPortalTab =
  | PartnerModule
  | "expo"
  | "quota"
  | "site_management"
  | "analytics"

export type PartnerPortalAction =
  | "mini_site.write"
  | "mini_site.submit"
  | "enterprise.view"
  | "expo.view"
  | "tradecredit.view"
  | "analytics.view"
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
  | "government.manage"

export type PartnerAccess = {
  organization: PartnerPortalOrganization | null
  role: PartnerMvpRole | null
  capabilities: PartnerCapability[]
  scopes: PartnerScopeSummary
  modules: Record<PartnerModule, boolean>
  tabs: Record<PartnerPortalTab, boolean>
  actions: Record<PartnerPortalAction, boolean>
  readOnly: boolean
}

const emptyScopes: PartnerScopeSummary = {
  expoIds: [],
  programIds: [],
  companyIds: []
}

const actionKeys: PartnerPortalAction[] = [
  "mini_site.write",
  "mini_site.submit",
  "enterprise.view",
  "expo.view",
  "tradecredit.view",
  "analytics.view",
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
  "government.manage"
]

function getEmptyModules() {
  return getPartnerModuleVisibility({
    model: "co_host",
    capabilities: [],
    scope: emptyScopes
  })
}

function makeTabs(modules: Record<PartnerModule, boolean>) {
  return {
    ...modules,
    expo: modules.expo_programs,
    quota: modules.tradecredit_reports,
    site_management: modules.mini_site,
    analytics: modules.analytics_reports
  } satisfies Record<PartnerPortalTab, boolean>
}

function makeEmptyActions() {
  return Object.fromEntries(
    actionKeys.map((action) => [action, false])
  ) as Record<PartnerPortalAction, boolean>
}

export function buildPartnerAccess(input: {
  organization: PartnerPortalOrganization
  capabilities: PartnerCapability[]
  scopes: PartnerScopeSummary
}): PartnerAccess {
  const role = normalizePartnerRole(input.organization.membershipRole)
  const readOnly = isPartnerRoleReadOnly(role)
  const modules = getPartnerModuleVisibility({
    model: input.organization.model,
    capabilities: input.capabilities,
    scope: input.scopes
  })
  const canWriteMiniSite = modules.mini_site && !readOnly
  const canWriteEnterprise = modules.enterprises && !readOnly
  const canWriteExpo = modules.expo_programs && !readOnly
  const canWriteTradeCredit = modules.tradecredit_reports && !readOnly

  return {
    organization: input.organization,
    role,
    capabilities: input.capabilities,
    scopes: input.scopes,
    modules,
    tabs: makeTabs(modules),
    actions: {
      "mini_site.write": canWriteMiniSite,
      "mini_site.submit": canWriteMiniSite,
      "enterprise.view": modules.enterprises,
      "expo.view": modules.expo_programs,
      "tradecredit.view": modules.tradecredit_reports,
      "analytics.view": modules.analytics_reports,
      "expo.edit": canWriteExpo,
      "turnkey.create": canWriteExpo,
      "enterprise.manage": canWriteEnterprise,
      "enterprise.advance": canWriteEnterprise,
      "quota.manage": canWriteTradeCredit,
      "invite.manage": canWriteEnterprise,
      "tradeCredits.manage": canWriteTradeCredit,
      "bundle.manage": false,
      "bundle.purchase": false,
      "communications.manage": false,
      "chat.use": false,
      "finance.manage": false,
      "settlement.manage": false,
      "government.manage": false
    },
    readOnly
  }
}

export function emptyPartnerAccess(): PartnerAccess {
  const modules = getEmptyModules()

  return {
    organization: null,
    role: null,
    capabilities: [],
    scopes: emptyScopes,
    modules,
    tabs: makeTabs(modules),
    actions: makeEmptyActions(),
    readOnly: true
  }
}

export async function getPartnerAccess(userId: string): Promise<PartnerAccess> {
  const hasPartnerRole = await userHasRole(userId, "partner")
  if (!hasPartnerRole) return emptyPartnerAccess()

  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) return emptyPartnerAccess()

  const [capabilities, scopes] = await Promise.all([
    getPartnerCapabilities(organization.id),
    getPartnerScopes(organization.id)
  ])

  return buildPartnerAccess({ organization, capabilities, scopes })
}

export async function requirePartnerModule(
  userId: string,
  module: PartnerModule
) {
  const access = await getPartnerAccess(userId)
  if (!access.modules[module]) throw new Error("Forbidden.")
  return access
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

export type { PartnerMembershipRole }
