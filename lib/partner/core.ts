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
  | "superseded"
  | "draft_update"

export type PartnerMembershipStatus = "active" | "disabled" | "removed"

export type PartnerMembershipStatusAction = "disable" | "remove" | "reactivate"

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

  if (
    role === "partner_owner" ||
    role === "partner_admin" ||
    role === "viewer"
  ) {
    return role
  }

  return "viewer"
}

export function isPartnerRoleReadOnly(role: PartnerMvpRole): boolean {
  return role === "viewer"
}

export function canInvitePartnerRole(
  inviterRole: PartnerMvpRole,
  targetRole: PartnerMvpRole
): boolean {
  if (inviterRole === "partner_owner") return true
  if (inviterRole === "partner_admin") return targetRole !== "partner_owner"
  return false
}

type CanAssignPartnerRoleArgs = {
  actorRole: PartnerMvpRole
  targetCurrentRole: PartnerMvpRole
  targetNextRole: PartnerMvpRole
  isSelf: boolean
}

export function canAssignPartnerRole({
  actorRole,
  targetCurrentRole,
  targetNextRole,
  isSelf
}: CanAssignPartnerRoleArgs): boolean {
  if (actorRole === "viewer") return false
  if (actorRole === "partner_owner") return true
  if (isSelf) return false
  if (targetCurrentRole === "partner_owner") return false
  return targetNextRole !== "partner_owner"
}

type CanChangePartnerMembershipStatusArgs = {
  actorRole: PartnerMvpRole
  targetRole: PartnerMvpRole
  action: PartnerMembershipStatusAction
  isSelf: boolean
}

export function canChangePartnerMembershipStatus({
  actorRole,
  targetRole,
  isSelf
}: CanChangePartnerMembershipStatusArgs): boolean {
  if (actorRole === "viewer") return false
  if (actorRole === "partner_owner") return true
  if (isSelf) return false
  return targetRole !== "partner_owner"
}

type GetPartnerMemberActionVisibilityArgs = {
  actorRole: PartnerMvpRole
  targetRole: PartnerMvpRole
  targetStatus: PartnerMembershipStatus | "inactive"
  isSelf: boolean
}

export function getPartnerMemberActionVisibility({
  actorRole,
  targetRole,
  targetStatus,
  isSelf
}: GetPartnerMemberActionVisibilityArgs) {
  const canInvite = actorRole !== "viewer"
  const canChangeRole =
    targetStatus === "active" &&
    canAssignPartnerRole({
      actorRole,
      targetCurrentRole: targetRole,
      targetNextRole: targetRole,
      isSelf
    })
  const canDisable =
    targetStatus === "active" &&
    canChangePartnerMembershipStatus({
      actorRole,
      targetRole,
      action: "disable",
      isSelf
    })
  const canRemove =
    targetStatus !== "removed" &&
    canChangePartnerMembershipStatus({
      actorRole,
      targetRole,
      action: "remove",
      isSelf
    })
  const canReactivate =
    targetStatus === "disabled" &&
    canChangePartnerMembershipStatus({
      actorRole,
      targetRole,
      action: "reactivate",
      isSelf
    })

  return {
    canInvite,
    canChangeRole,
    canDisable,
    canRemove,
    canReactivate
  }
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
    enterprises: model === "tenant" && hasCapability("enterprise_association"),
    expo_programs: hasCapability("expo_programs"),
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
