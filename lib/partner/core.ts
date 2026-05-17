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

export type PartnerMvpRole = "partner_owner" | "partner_admin" | "viewer"

export type MiniSiteActorRole = PartnerMvpRole | "sys_admin"

export type PartnerCapability =
  | "overview"
  | "mini_site"
  | "enterprise_association"
  | "expo_programs"
  | "tradecredit_reporting"
  | "analytics_reporting"

export type PartnerModule =
  | "overview"
  | "mini_site"
  | "enterprises"
  | "expo_programs"
  | "tradecredit_reports"
  | "analytics_reports"
  | "bundles"
  | "communications"
  | "finance"
  | "government"

export type PartnerMiniSiteStatus =
  | "draft"
  | "submitted"
  | "rejected"
  | "published"
  | "draft_update"

export type PartnerScopeSummary = {
  expoIds: string[]
  programIds: string[]
  companyIds: string[]
}

export const partnerMvpCapabilities: PartnerCapability[] = [
  "overview",
  "mini_site",
  "enterprise_association",
  "expo_programs",
  "tradecredit_reporting",
  "analytics_reporting"
]

export const partnerModules: PartnerModule[] = [
  "overview",
  "mini_site",
  "enterprises",
  "expo_programs",
  "tradecredit_reports",
  "analytics_reports",
  "bundles",
  "communications",
  "finance",
  "government"
]

export function normalizePartnerRole(
  role: PartnerMembershipRole
): PartnerMvpRole {
  if (role === "primary_representative") {
    return "partner_owner"
  }

  if (role === "admin") {
    return "partner_admin"
  }

  if (role === "partner_owner" || role === "partner_admin" || role === "viewer") {
    return role
  }

  return "viewer"
}

export function isPartnerRoleReadOnly(role: PartnerMvpRole): boolean {
  return role === "viewer"
}

type GetPartnerModuleVisibilityArgs = {
  model: PartnerModel
  capabilities: PartnerCapability[]
  scope: PartnerScopeSummary
}

export function getPartnerModuleVisibility({
  model,
  capabilities,
  scope
}: GetPartnerModuleVisibilityArgs): Record<PartnerModule, boolean> {
  const hasCapability = (capability: PartnerCapability) =>
    capabilities.includes(capability)

  return {
    overview: hasCapability("overview"),
    mini_site: model === "tenant" && hasCapability("mini_site"),
    enterprises: hasCapability("enterprise_association"),
    expo_programs:
      hasCapability("expo_programs") &&
      (scope.expoIds.length > 0 ||
        scope.programIds.length > 0 ||
        scope.companyIds.length > 0),
    tradecredit_reports: hasCapability("tradecredit_reporting"),
    analytics_reports: hasCapability("analytics_reporting"),
    bundles: false,
    communications: false,
    finance: false,
    government: false
  }
}

type TransitionArgs = {
  actorRole: MiniSiteActorRole
  from: PartnerMiniSiteStatus
  to: PartnerMiniSiteStatus
}

export function canTransitionMiniSiteStatus({
  actorRole,
  from,
  to
}: TransitionArgs): boolean {
  if (actorRole === "sys_admin") {
    return (
      (from === "submitted" && to === "published") ||
      (from === "submitted" && to === "rejected")
    )
  }

  return (
    (from === "draft" && to === "submitted") ||
    (from === "rejected" && to === "draft") ||
    (from === "published" && to === "draft_update") ||
    (from === "draft_update" && to === "submitted")
  )
}
