import type { ExpoTenantOption } from "@/lib/tradexpo/types"

export const AROBID_DISPLAY_TARGET_ID = "arobid"
export const AROBID_DISPLAY_TARGET_LABEL = "Arobid"

type ExpoTenantConfigInput = {
  tenantPartnerOrgId?: string | null
  displayTargetIds?: unknown
}

type ExpoTenantConfigResult =
  | {
      ok: true
      tenantPartnerOrgId: string
      displayTargetIds: string[]
    }
  | { ok: false; error: string }

export function normalizeDisplayTargetIds(value: unknown) {
  const ids = Array.isArray(value)
    ? value
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    : []

  return Array.from(new Set(ids))
}

export function validateExpoTenantConfig(
  input: ExpoTenantConfigInput,
  tenantOptions: ExpoTenantOption[]
): ExpoTenantConfigResult {
  const tenantPartnerOrgId = input.tenantPartnerOrgId?.trim() ?? ""
  if (!tenantPartnerOrgId) {
    return { ok: false, error: "Select a tenant for this expo." }
  }

  const tenantIds = new Set(tenantOptions.map((tenant) => tenant.id))
  if (!tenantIds.has(tenantPartnerOrgId)) {
    return { ok: false, error: "Selected tenant is not active or invalid." }
  }

  const displayTargetIds = normalizeDisplayTargetIds(input.displayTargetIds)
  if (displayTargetIds.length === 0) {
    return { ok: false, error: "Select at least one display position." }
  }

  const invalidTarget = displayTargetIds.find(
    (targetId) =>
      targetId !== AROBID_DISPLAY_TARGET_ID && !tenantIds.has(targetId)
  )
  if (invalidTarget) {
    return { ok: false, error: "Selected display position is invalid." }
  }

  return {
    ok: true,
    tenantPartnerOrgId,
    displayTargetIds
  }
}
