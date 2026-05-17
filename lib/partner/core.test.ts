import { describe, expect, test } from "bun:test"
import {
  canTransitionMiniSiteStatus,
  getPartnerModuleVisibility,
  isPartnerRoleReadOnly,
  normalizePartnerRole,
  partnerMvpCapabilities
} from "@/lib/partner/core"

describe("normalizePartnerRole", () => {
  test("maps primary_representative to partner_owner", () => {
    expect(normalizePartnerRole("primary_representative")).toBe(
      "partner_owner"
    )
  })

  test("maps admin to partner_admin", () => {
    expect(normalizePartnerRole("admin")).toBe("partner_admin")
  })

  test("maps operator to viewer", () => {
    expect(normalizePartnerRole("operator")).toBe("viewer")
  })
})

describe("isPartnerRoleReadOnly", () => {
  test("returns true for viewer", () => {
    expect(isPartnerRoleReadOnly("viewer")).toBe(true)
  })

  test("returns false for partner_owner and partner_admin", () => {
    expect(isPartnerRoleReadOnly("partner_owner")).toBe(false)
    expect(isPartnerRoleReadOnly("partner_admin")).toBe(false)
  })
})

describe("getPartnerModuleVisibility", () => {
  test("returns MVP module visibility for tenant admin with all capabilities and assigned scopes", () => {
    const visibility = getPartnerModuleVisibility({
      model: "tenant",
      capabilities: [...partnerMvpCapabilities],
      scope: {
        expoIds: ["expo-1"],
        programIds: ["program-1"],
        companyIds: ["company-1"]
      }
    })

    expect(visibility.overview).toBe(true)
    expect(visibility.mini_site).toBe(true)
    expect(visibility.enterprises).toBe(true)
    expect(visibility.expo_programs).toBe(true)
    expect(visibility.tradecredit_reports).toBe(true)
    expect(visibility.analytics_reports).toBe(true)

    expect(visibility.bundles).toBe(false)
    expect(visibility.communications).toBe(false)
    expect(visibility.finance).toBe(false)
    expect(visibility.government).toBe(false)
  })

  test("mini_site is false for non-tenant even with capability", () => {
    const visibility = getPartnerModuleVisibility({
      model: "co_host",
      capabilities: ["mini_site"],
      scope: {
        expoIds: ["expo-1"],
        programIds: ["program-1"],
        companyIds: ["company-1"]
      }
    })

    expect(visibility.mini_site).toBe(false)
  })

  test("expo_programs is false without assigned scope", () => {
    const visibility = getPartnerModuleVisibility({
      model: "tenant",
      capabilities: ["expo_programs"],
      scope: {
        expoIds: [],
        programIds: [],
        companyIds: []
      }
    })

    expect(visibility.expo_programs).toBe(false)
  })

  test("expo_programs is true with company-only assigned scope", () => {
    const visibility = getPartnerModuleVisibility({
      model: "tenant",
      capabilities: ["expo_programs"],
      scope: {
        expoIds: [],
        programIds: [],
        companyIds: ["company-1"]
      }
    })

    expect(visibility.expo_programs).toBe(true)
  })
})

describe("canTransitionMiniSiteStatus", () => {
  test("allows partner_admin draft to submitted", () => {
    expect(
      canTransitionMiniSiteStatus({
        actorRole: "partner_admin",
        from: "draft",
        to: "submitted"
      })
    ).toBe(true)
  })

  test("disallows partner_admin submitted to published", () => {
    expect(
      canTransitionMiniSiteStatus({
        actorRole: "partner_admin",
        from: "submitted",
        to: "published"
      })
    ).toBe(false)
  })

  test("allows sys_admin submitted to published", () => {
    expect(
      canTransitionMiniSiteStatus({
        actorRole: "sys_admin",
        from: "submitted",
        to: "published"
      })
    ).toBe(true)
  })

  test("allows sys_admin submitted to rejected", () => {
    expect(
      canTransitionMiniSiteStatus({
        actorRole: "sys_admin",
        from: "submitted",
        to: "rejected"
      })
    ).toBe(true)
  })

  test("allows partner_owner rejected to draft", () => {
    expect(
      canTransitionMiniSiteStatus({
        actorRole: "partner_owner",
        from: "rejected",
        to: "draft"
      })
    ).toBe(true)
  })

  test("allows partner_admin published to draft_update", () => {
    expect(
      canTransitionMiniSiteStatus({
        actorRole: "partner_admin",
        from: "published",
        to: "draft_update"
      })
    ).toBe(true)
  })

  test("allows partner_admin draft_update to submitted", () => {
    expect(
      canTransitionMiniSiteStatus({
        actorRole: "partner_admin",
        from: "draft_update",
        to: "submitted"
      })
    ).toBe(true)
  })
})
