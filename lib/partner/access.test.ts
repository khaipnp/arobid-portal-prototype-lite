import { describe, expect, test } from "bun:test"
import { buildPartnerAccess } from "./access"

describe("partner access", () => {
  test("builds MVP module visibility from membership, capabilities, and scopes", () => {
    const access = buildPartnerAccess({
      organization: {
        id: "partner-1",
        name: "Tenant Partner",
        model: "tenant",
        partnerType: "expo_partner",
        status: "active",
        primaryUserId: "user-1",
        membershipRole: "partner_admin"
      },
      capabilities: [
        "overview",
        "mini_site",
        "enterprise_association",
        "expo_programs",
        "tradecredit_reporting",
        "analytics_reporting"
      ],
      scopes: { expoIds: ["expo-1"], programIds: [], companyIds: [] }
    })

    expect(access.role).toBe("partner_admin")
    expect(access.readOnly).toBe(false)
    expect(access.modules.mini_site).toBe(true)
    expect(access.modules.expo_programs).toBe(true)
    expect(access.modules.bundles).toBe(false)
    expect(access.tabs.expo).toBe(true)
    expect(access.tabs.quota).toBe(true)
    expect(access.tabs.site_management).toBe(true)
    expect(access.tabs.analytics).toBe(true)
    expect(access.actions["mini_site.write"]).toBe(true)
    expect(access.actions["expo.edit"]).toBe(true)
    expect(access.actions["bundle.manage"]).toBe(false)
  })

  test("viewer access is read-only", () => {
    const access = buildPartnerAccess({
      organization: {
        id: "partner-1",
        name: "Tenant Partner",
        model: "tenant",
        partnerType: "expo_partner",
        status: "active",
        primaryUserId: "user-1",
        membershipRole: "viewer"
      },
      capabilities: ["overview", "mini_site"],
      scopes: { expoIds: [], programIds: [], companyIds: [] }
    })

    expect(access.role).toBe("viewer")
    expect(access.readOnly).toBe(true)
    expect(access.actions["mini_site.write"]).toBe(false)
    expect(access.actions["mini_site.submit"]).toBe(false)
    expect(access.actions["expo.edit"]).toBe(false)
    expect(access.actions["turnkey.create"]).toBe(false)
    expect(access.actions["analytics.view"]).toBe(false)
  })

  test("viewer can access analytics reporting when capability is granted", () => {
    const access = buildPartnerAccess({
      organization: {
        id: "partner-analytics-viewer",
        name: "Analytics Partner",
        model: "tenant",
        partnerType: "expo_partner",
        status: "active",
        primaryUserId: "user-1",
        membershipRole: "viewer"
      },
      capabilities: ["overview", "analytics_reporting"],
      scopes: { expoIds: [], programIds: [], companyIds: [] }
    })

    expect(access.readOnly).toBe(true)
    expect(access.actions["analytics.view"]).toBe(true)
  })

  test("downgrades non-MVP legacy roles to viewer", () => {
    for (const membershipRole of ["operator", "analyst", "finance"] as const) {
      const access = buildPartnerAccess({
        organization: {
          id: `partner-${membershipRole}`,
          name: "Legacy Partner",
          model: "tenant",
          partnerType: "expo_partner",
          status: "active",
          primaryUserId: "user-1",
          membershipRole
        },
        capabilities: ["overview", "mini_site", "analytics_reporting"],
        scopes: { expoIds: [], programIds: [], companyIds: [] }
      })

      expect(access.role).toBe("viewer")
      expect(access.readOnly).toBe(true)
      expect(access.actions["mini_site.write"]).toBe(false)
    }
  })
})
