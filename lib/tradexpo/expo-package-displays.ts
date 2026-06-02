import type { ExpoPackageInput } from "@/lib/tradexpo/types"

export const MAX_EXPO_PACKAGES = 6
export const MAX_EXPO_PACKAGE_BENEFITS = 10

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function cleanBenefits(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map(cleanText)
    .filter(Boolean)
    .slice(0, MAX_EXPO_PACKAGE_BENEFITS)
}

function cleanMode(value: unknown): ExpoPackageInput["mode"] {
  return value === "create_new" ? "create_new" : "link_existing"
}

function cleanPrice(value: unknown) {
  const price = Number(value ?? 0)
  return Number.isFinite(price) ? price : Number.NaN
}

export function normalizeExpoPackageInputs(input: unknown): ExpoPackageInput[] {
  if (!Array.isArray(input)) return []
  const normalized = input.slice(0, MAX_EXPO_PACKAGES).map((raw, index) => {
    const row = asRecord(raw)
    const advanced = asRecord(row.advanced)
    return {
      id: cleanText(row.id) || undefined,
      mode: cleanMode(row.mode),
      packageDefinitionId: cleanText(row.packageDefinitionId) || undefined,
      name: cleanText(row.name),
      description: cleanText(row.description),
      price: cleanPrice(row.price),
      priceUnit: cleanText(row.priceUnit).toUpperCase() || "VND",
      benefits: cleanBenefits(row.benefits),
      isFeatured: row.isFeatured === true,
      isPublic: row.isPublic !== false,
      sortOrder: index,
      advanced:
        cleanText(advanced.planId) || cleanText(advanced.roleCode)
          ? {
              planId: cleanText(advanced.planId) || undefined,
              roleCode: cleanText(advanced.roleCode) || undefined
            }
          : undefined
    } satisfies ExpoPackageInput
  })

  const featuredIndex = normalized.findIndex((row) => row.isFeatured)
  return normalized.map((row, index) => ({
    ...row,
    isFeatured: featuredIndex >= 0 ? index === featuredIndex : false,
    sortOrder: index
  }))
}

export type ExpoPackageValidationResult =
  | { ok: true; packages: ExpoPackageInput[] }
  | { ok: false; error: string }

export function validateExpoPackageInputs(
  input: unknown
): ExpoPackageValidationResult {
  if (Array.isArray(input) && input.length > MAX_EXPO_PACKAGES) {
    return { ok: false, error: "Add at most 6 packages." }
  }

  const packages = normalizeExpoPackageInputs(input)

  const featuredCount = packages.filter((pkg) => pkg.isFeatured).length
  if (featuredCount > 1) {
    return { ok: false, error: "Only one package can be featured." }
  }

  for (const pkg of packages) {
    if (!pkg.name) {
      return { ok: false, error: "Package name is required." }
    }
    if (!Number.isFinite(pkg.price) || pkg.price < 0) {
      return { ok: false, error: "Package price must be zero or greater." }
    }
    if (!pkg.priceUnit) {
      return { ok: false, error: "Package currency is required." }
    }
    if (pkg.benefits.length === 0) {
      return { ok: false, error: "Add at least one package benefit." }
    }
    if (pkg.mode === "link_existing" && !pkg.packageDefinitionId) {
      return { ok: false, error: "Select an existing package." }
    }
  }

  return { ok: true, packages }
}
