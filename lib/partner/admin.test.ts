import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  assertAdminMiniSiteDecision,
  normalizePartnerOrganizationInput,
  normalizePartnerUserInviteInput
} from "@/lib/partner/admin"

describe("normalizePartnerOrganizationInput", () => {
  test("returns trimmed values", () => {
    expect(
      normalizePartnerOrganizationInput({
        name: "  ASEAN Export Hub  ",
        model: "tenant",
        partnerType: "expo_partner"
      })
    ).toEqual({
      name: "ASEAN Export Hub",
      model: "tenant",
      partnerType: "expo_partner"
    })
  })

  test("throws when name is empty", () => {
    expect(() =>
      normalizePartnerOrganizationInput({
        name: "   ",
        model: "tenant",
        partnerType: "expo_partner"
      })
    ).toThrow("Partner organization name is required.")
  })
})

describe("normalizePartnerUserInviteInput", () => {
  test("returns lowercased and trimmed email", () => {
    expect(
      normalizePartnerUserInviteInput({
        email: " OWNER@EXAMPLE.COM ",
        role: "partner_owner"
      })
    ).toEqual({
      email: "owner@example.com",
      role: "partner_owner"
    })
  })
})

describe("assertAdminMiniSiteDecision", () => {
  test("throws for rejected with blank reason", () => {
    expect(() => assertAdminMiniSiteDecision("rejected", " ")).toThrow(
      "Reject reason is required."
    )
  })

  test("does not throw for published with blank reason", () => {
    expect(() => assertAdminMiniSiteDecision("published", " ")).not.toThrow()
  })
})

describe("admin mutation SQL", () => {
  const source = readFileSync(
    resolve(process.cwd(), "lib/partner/admin.ts"),
    "utf8"
  ).toLowerCase()

  test("replaces capability assignments transactionally", () => {
    expect(source).toContain("delete from partner_capability_assignments")
    expect(source).toContain("insert into partner_capability_assignments")
    expect(source).toContain("await sql`begin`")
    expect(source).toContain("await sql`rollback`")
  })

  test("reactivates existing scopes when scope assignment is reapplied", () => {
    expect(source).toContain("update partner_scope_assignments")
    expect(source).toContain("partnerscopeassignmentid")
    expect(source).toContain("on conflict (id)")
    expect(source).toContain("do update set")
    expect(source).toContain("status = 'active'")
  })

  test("wraps mini-site review decision in a transaction", () => {
    expect(source).toContain("for update")
    expect(source).toContain("await sql`begin`")
    expect(source).toContain("await sql`commit`")
    expect(source).toContain("await sql`rollback`")
  })

  test("clears stale opposite mini-site decision metadata", () => {
    expect(source).toContain(
      "published_by_user_id = case when $" +
        "{input.decision} = 'published' then $" +
        "{input.actoruserid} else null end"
    )
    expect(source).toContain(
      "rejected_by_user_id = case when $" +
        "{input.decision} = 'rejected' then $" +
        "{input.actoruserid} else null end"
    )
  })
})
