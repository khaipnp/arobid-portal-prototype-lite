# Partner Membership Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Partner Portal S2 membership management so Partner Owner/Admin can invite, role-change, disable/remove/reactivate users within MVP role rules.

**Architecture:** Keep permission rules in `lib/partner/core.ts` for cheap unit tests. Keep database mutations in `lib/partner/db.ts` scoped to the current user's primary active Partner Organization. Extend `ensurePlatformSchema` with invitation and audit tables plus membership statuses used by S2.

**Tech Stack:** Next.js App Router route handlers, Bun tests, TypeScript, Neon SQL helpers.

---

## File Structure

- Modify `lib/partner/core.ts`: add pure S2 role/status guard helpers and action/status types.
- Modify `lib/partner/core.test.ts`: add table tests for S2 rule matrix.
- Modify `lib/platform/ensure-schema.ts`: extend `partner_memberships.status`, add `partner_user_invitations`, add `partner_membership_audit_events`.
- Modify `lib/partner/db.ts`: add invite/member list and mutation functions.
- Create `app/api/partner/users/route.ts`: list members/invites; create invite.
- Create `app/api/partner/users/[userId]/role/route.ts`: update member role.
- Create `app/api/partner/users/[userId]/status/route.ts`: disable/remove/reactivate member.
- Create `app/api/partner/invitations/[invitationId]/route.ts`: cancel invitation.
- Create `app/api/partner/invitations/[invitationId]/accept/route.ts`: accept invitation for current user.
- Run `bun test lib/partner/core.test.ts lib/partner/access.test.ts lib/partner/admin.test.ts` and `bun typecheck`.

---

### Task 1: Add pure S2 permission rules

**Files:**
- Modify: `lib/partner/core.ts`
- Test: `lib/partner/core.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `lib/partner/core.test.ts` imports:

```ts
import {
  canAssignPartnerRole,
  canChangePartnerMembershipStatus,
  canInvitePartnerRole,
  type PartnerMembershipStatusAction
} from "@/lib/partner/core"
```

Add tests:

```ts
describe("partner membership rule helpers", () => {
  test("partner owner can invite all MVP roles", () => {
    expect(canInvitePartnerRole("partner_owner", "partner_owner")).toBe(true)
    expect(canInvitePartnerRole("partner_owner", "partner_admin")).toBe(true)
    expect(canInvitePartnerRole("partner_owner", "viewer")).toBe(true)
  })

  test("partner admin cannot invite or assign partner owner", () => {
    expect(canInvitePartnerRole("partner_admin", "partner_owner")).toBe(false)
    expect(canInvitePartnerRole("partner_admin", "partner_admin")).toBe(true)
    expect(
      canAssignPartnerRole({
        actorRole: "partner_admin",
        targetCurrentRole: "viewer",
        targetNextRole: "partner_owner",
        isSelf: false
      })
    ).toBe(false)
  })

  test("partner admin cannot change self or partner owner", () => {
    expect(
      canAssignPartnerRole({
        actorRole: "partner_admin",
        targetCurrentRole: "viewer",
        targetNextRole: "partner_admin",
        isSelf: true
      })
    ).toBe(false)
    expect(
      canAssignPartnerRole({
        actorRole: "partner_admin",
        targetCurrentRole: "partner_owner",
        targetNextRole: "viewer",
        isSelf: false
      })
    ).toBe(false)
  })

  test("partner owner can change any role before last-owner guard", () => {
    expect(
      canAssignPartnerRole({
        actorRole: "partner_owner",
        targetCurrentRole: "partner_admin",
        targetNextRole: "viewer",
        isSelf: false
      })
    ).toBe(true)
  })

  test("membership status changes follow S2 role matrix", () => {
    const actions: PartnerMembershipStatusAction[] = [
      "disable",
      "remove",
      "reactivate"
    ]
    for (const action of actions) {
      expect(
        canChangePartnerMembershipStatus({
          actorRole: "partner_owner",
          targetRole: "partner_admin",
          action,
          isSelf: false
        })
      ).toBe(true)
      expect(
        canChangePartnerMembershipStatus({
          actorRole: "partner_admin",
          targetRole: "partner_owner",
          action,
          isSelf: false
        })
      ).toBe(false)
      expect(
        canChangePartnerMembershipStatus({
          actorRole: "partner_admin",
          targetRole: "viewer",
          action,
          isSelf: true
        })
      ).toBe(false)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `bun test lib/partner/core.test.ts`

Expected: FAIL with missing exports `canAssignPartnerRole`, `canChangePartnerMembershipStatus`, `canInvitePartnerRole`.

- [ ] **Step 3: Add minimal implementation**

Add to `lib/partner/core.ts`:

```ts
export type PartnerMembershipStatus = "active" | "disabled" | "removed"

export type PartnerMembershipStatusAction =
  | "disable"
  | "remove"
  | "reactivate"

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
```

- [ ] **Step 4: Run tests to verify pass**

Run: `bun test lib/partner/core.test.ts`

Expected: PASS.

---

### Task 2: Extend schema for S2 data

**Files:**
- Modify: `lib/platform/ensure-schema.ts`

- [ ] **Step 1: Update membership status constraint**

Replace the status constraint block with:

```ts
  await sql`
    do $$
    begin
      alter table partner_memberships drop constraint if exists partner_memberships_status_ck;
      alter table partner_memberships
      add constraint partner_memberships_status_ck
      check (status in ('active', 'inactive', 'disabled', 'removed'));
    end $$;
  `
```

- [ ] **Step 2: Add invitations table after `partner_memberships` indexes**

Add:

```ts
  await sql`
    create table if not exists partner_user_invitations (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      email text not null,
      display_name text,
      message text,
      role text not null,
      status text not null default 'pending',
      invited_by_user_id text not null references users(id) on delete cascade,
      accepted_by_user_id text references users(id) on delete set null,
      expires_at timestamptz not null,
      accepted_at timestamptz,
      cancelled_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table partner_user_invitations
      add constraint partner_user_invitations_role_ck
      check (role in ('partner_owner', 'partner_admin', 'viewer'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    do $$
    begin
      alter table partner_user_invitations
      add constraint partner_user_invitations_status_ck
      check (status in ('pending', 'accepted', 'cancelled', 'expired'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create unique index if not exists idx_partner_user_invitations_pending_email
    on partner_user_invitations (partner_org_id, lower(email))
    where status = 'pending'
  `
```

- [ ] **Step 3: Add audit table**

Add after invitations table:

```ts
  await sql`
    create table if not exists partner_membership_audit_events (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      actor_user_id text references users(id) on delete set null,
      target_user_id text references users(id) on delete set null,
      invitation_id text references partner_user_invitations(id) on delete set null,
      action text not null,
      old_role text,
      new_role text,
      old_status text,
      new_status text,
      reason text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_partner_membership_audit_events_org
    on partner_membership_audit_events (partner_org_id, created_at desc)
  `
```

- [ ] **Step 4: Run typecheck**

Run: `bun typecheck`

Expected: PASS or unrelated existing type errors only. No syntax errors in `ensure-schema.ts`.

---

### Task 3: Add Partner membership DB functions

**Files:**
- Modify: `lib/partner/db.ts`

- [ ] **Step 1: Add types/imports**

Extend imports from `lib/partner/core`:

```ts
import type {
  PartnerMembershipStatus,
  PartnerMembershipStatusAction
} from "@/lib/partner/core"
import {
  canAssignPartnerRole,
  canChangePartnerMembershipStatus,
  canInvitePartnerRole,
  canTransitionMiniSiteStatus,
  normalizePartnerRole
} from "@/lib/partner/core"
```

Add types near `PartnerPortalOrganization`:

```ts
export type PartnerUserInvitationStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired"

export type PartnerUserInvitation = {
  id: string
  partnerOrgId: string
  email: string
  displayName: string | null
  message: string | null
  role: "partner_owner" | "partner_admin" | "viewer"
  status: PartnerUserInvitationStatus
  invitedByUserId: string
  acceptedByUserId: string | null
  expiresAt: string
  acceptedAt: string | null
  cancelledAt: string | null
  createdAt: string
}

export type PartnerOrganizationMember = {
  userId: string
  name: string | null
  email: string
  role: PartnerMvpRole
  rawRole: PartnerMembershipRole
  status: PartnerMembershipStatus | "inactive"
  createdAt: string
}

export type PartnerUserManagementWorkspace = {
  organization: PartnerPortalOrganization | null
  members: PartnerOrganizationMember[]
  invitations: PartnerUserInvitation[]
}
```

- [ ] **Step 2: Add audit helper**

Add near helper functions:

```ts
async function recordPartnerMembershipAudit(input: {
  partnerOrgId: string
  actorUserId: string | null
  targetUserId?: string | null
  invitationId?: string | null
  action: string
  oldRole?: string | null
  newRole?: string | null
  oldStatus?: string | null
  newStatus?: string | null
  reason?: string | null
}) {
  await sql`
    insert into partner_membership_audit_events (
      id,
      partner_org_id,
      actor_user_id,
      target_user_id,
      invitation_id,
      action,
      old_role,
      new_role,
      old_status,
      new_status,
      reason
    )
    values (
      ${`partner-membership-audit-${randomUUID()}`},
      ${input.partnerOrgId},
      ${input.actorUserId},
      ${input.targetUserId ?? null},
      ${input.invitationId ?? null},
      ${input.action},
      ${input.oldRole ?? null},
      ${input.newRole ?? null},
      ${input.oldStatus ?? null},
      ${input.newStatus ?? null},
      ${input.reason?.trim() || null}
    )
  `
}
```

- [ ] **Step 3: Add list workspace function**

Add after `getPartnerScopes`:

```ts
export async function getPartnerUserManagementWorkspace(
  userId: string
): Promise<PartnerUserManagementWorkspace> {
  const organization = await getPrimaryPartnerOrganization(userId)
  if (!organization) return { organization: null, members: [], invitations: [] }

  const [memberRows, invitationRows] = await Promise.all([
    sql`
      select
        u.id,
        u.name,
        u.email,
        pm.role,
        pm.status,
        pm.created_at
      from partner_memberships pm
      inner join users u on u.id = pm.user_id
      where pm.partner_org_id = ${organization.id}
      order by pm.created_at asc
    `,
    sql`
      select
        id,
        partner_org_id,
        email,
        display_name,
        message,
        role,
        status,
        invited_by_user_id,
        accepted_by_user_id,
        expires_at,
        accepted_at,
        cancelled_at,
        created_at
      from partner_user_invitations
      where partner_org_id = ${organization.id}
      order by created_at desc
    `
  ])

  return {
    organization,
    members: (
      memberRows as {
        id: string
        name: string | null
        email: string
        role: PartnerMembershipRole
        status: PartnerMembershipStatus | "inactive"
        created_at: string | Date
      }[]
    ).map((row) => ({
      userId: row.id,
      name: row.name,
      email: row.email,
      rawRole: row.role,
      role: normalizePartnerRole(row.role),
      status: row.status,
      createdAt: toIso(row.created_at)
    })),
    invitations: (
      invitationRows as {
        id: string
        partner_org_id: string
        email: string
        display_name: string | null
        message: string | null
        role: PartnerUserInvitation["role"]
        status: PartnerUserInvitationStatus
        invited_by_user_id: string
        accepted_by_user_id: string | null
        expires_at: string | Date
        accepted_at: string | Date | null
        cancelled_at: string | Date | null
        created_at: string | Date
      }[]
    ).map((row) => ({
      id: row.id,
      partnerOrgId: row.partner_org_id,
      email: row.email,
      displayName: row.display_name,
      message: row.message,
      role: row.role,
      status: row.status,
      invitedByUserId: row.invited_by_user_id,
      acceptedByUserId: row.accepted_by_user_id,
      expiresAt: toIso(row.expires_at),
      acceptedAt: row.accepted_at ? toIso(row.accepted_at) : null,
      cancelledAt: row.cancelled_at ? toIso(row.cancelled_at) : null,
      createdAt: toIso(row.created_at)
    }))
  }
}
```

- [ ] **Step 4: Add invite/create/cancel/accept functions**

Add:

```ts
export async function createPartnerUserInvitation(
  actorUserId: string,
  input: {
    email: string
    role: PartnerMvpRole
    displayName?: string | null
    message?: string | null
  }
) {
  const organization = await requirePrimaryPartnerOrganization(actorUserId)
  const actorRole = normalizePartnerRole(organization.membershipRole)
  if (!canInvitePartnerRole(actorRole, input.role)) throw new Error("Forbidden.")

  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes("@")) throw new Error("Valid email is required.")

  const activeRows = (await sql`
    select 1
    from partner_memberships pm
    inner join users u on u.id = pm.user_id
    where pm.partner_org_id = ${organization.id}
      and lower(u.email) = ${email}
      and pm.status = 'active'
    limit 1
  `) as { "?column?": number }[]
  if (activeRows.length > 0) throw new Error("User is already an active member.")

  const id = `partner-user-invite-${randomUUID()}`
  const rows = (await sql`
    insert into partner_user_invitations (
      id,
      partner_org_id,
      email,
      display_name,
      message,
      role,
      invited_by_user_id,
      expires_at
    )
    values (
      ${id},
      ${organization.id},
      ${email},
      ${input.displayName?.trim() || null},
      ${input.message?.trim() || null},
      ${input.role},
      ${actorUserId},
      now() + interval '7 days'
    )
    on conflict (partner_org_id, lower(email)) where status = 'pending'
    do update set
      role = excluded.role,
      display_name = excluded.display_name,
      message = excluded.message,
      invited_by_user_id = excluded.invited_by_user_id,
      expires_at = excluded.expires_at,
      updated_at = now()
    returning id
  `) as { id: string }[]

  await recordPartnerMembershipAudit({
    partnerOrgId: organization.id,
    actorUserId,
    invitationId: rows[0].id,
    action: rows[0].id === id ? "invite_created" : "invite_resent",
    newRole: input.role,
    newStatus: "pending"
  })

  return { id: rows[0].id }
}

export async function cancelPartnerUserInvitation(
  actorUserId: string,
  invitationId: string
) {
  const organization = await requirePrimaryPartnerOrganization(actorUserId)
  const actorRole = normalizePartnerRole(organization.membershipRole)
  if (actorRole === "viewer") throw new Error("Forbidden.")

  const rows = (await sql`
    update partner_user_invitations
    set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = ${invitationId}
      and partner_org_id = ${organization.id}
      and status = 'pending'
    returning id, role
  `) as { id: string; role: string }[]
  if (rows.length === 0) throw new Error("Invitation not found.")

  await recordPartnerMembershipAudit({
    partnerOrgId: organization.id,
    actorUserId,
    invitationId,
    action: "invite_cancelled",
    oldRole: rows[0].role,
    oldStatus: "pending",
    newStatus: "cancelled"
  })
}

export async function acceptPartnerUserInvitation(
  actorUserId: string,
  invitationId: string
) {
  await sql`begin`
  try {
    const rows = (await sql`
      select
        pui.id,
        pui.partner_org_id,
        pui.role,
        pui.email,
        pui.expires_at,
        po.status as partner_org_status,
        u.email as user_email
      from partner_user_invitations pui
      inner join partner_organizations po on po.id = pui.partner_org_id
      inner join users u on u.id = ${actorUserId}
      where pui.id = ${invitationId}
        and pui.status = 'pending'
      for update
      limit 1
    `) as {
      id: string
      partner_org_id: string
      role: PartnerMvpRole
      email: string
      expires_at: string | Date
      partner_org_status: string
      user_email: string
    }[]

    const invite = rows[0]
    if (!invite) throw new Error("Invitation not found.")
    if (invite.partner_org_status !== "active") throw new Error("Partner organization is not active.")
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await sql`
        update partner_user_invitations
        set status = 'expired', updated_at = now()
        where id = ${invitationId}
      `
      throw new Error("Invitation has expired.")
    }
    if (invite.email.toLowerCase() !== invite.user_email.toLowerCase()) {
      throw new Error("Invitation email does not match current user.")
    }

    await sql`
      insert into partner_memberships (partner_org_id, user_id, role, status)
      values (${invite.partner_org_id}, ${actorUserId}, ${invite.role}, 'active')
      on conflict (partner_org_id, user_id) do update set
        role = excluded.role,
        status = 'active'
    `
    await sql`
      update partner_user_invitations
      set
        status = 'accepted',
        accepted_by_user_id = ${actorUserId},
        accepted_at = now(),
        updated_at = now()
      where id = ${invitationId}
    `
    await recordPartnerMembershipAudit({
      partnerOrgId: invite.partner_org_id,
      actorUserId,
      targetUserId: actorUserId,
      invitationId,
      action: "invite_accepted",
      newRole: invite.role,
      newStatus: "active"
    })
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}
```

- [ ] **Step 5: Add role/status mutation functions**

Add:

```ts
async function getActiveOwnerCount(partnerOrgId: string) {
  const rows = (await sql`
    select count(*)::int as count
    from partner_memberships
    where partner_org_id = ${partnerOrgId}
      and status = 'active'
      and role in ('partner_owner', 'primary_representative')
  `) as { count: number | string }[]
  return toNumber(rows[0]?.count)
}

export async function updatePartnerMemberRole(
  actorUserId: string,
  targetUserId: string,
  input: { role: PartnerMvpRole; reason?: string | null }
) {
  const organization = await requirePrimaryPartnerOrganization(actorUserId)
  const actorRole = normalizePartnerRole(organization.membershipRole)

  await sql`begin`
  try {
    const rows = (await sql`
      select role
      from partner_memberships
      where partner_org_id = ${organization.id}
        and user_id = ${targetUserId}
        and status = 'active'
      for update
      limit 1
    `) as { role: PartnerMembershipRole }[]
    const target = rows[0]
    if (!target) throw new Error("Member not found.")

    const targetRole = normalizePartnerRole(target.role)
    if (
      !canAssignPartnerRole({
        actorRole,
        targetCurrentRole: targetRole,
        targetNextRole: input.role,
        isSelf: actorUserId === targetUserId
      })
    ) {
      throw new Error("Forbidden.")
    }

    if (targetRole === "partner_owner" && input.role !== "partner_owner") {
      const ownerCount = await getActiveOwnerCount(organization.id)
      if (ownerCount <= 1) throw new Error("At least one Partner Owner is required.")
    }

    await sql`
      update partner_memberships
      set role = ${input.role}
      where partner_org_id = ${organization.id}
        and user_id = ${targetUserId}
    `
    await recordPartnerMembershipAudit({
      partnerOrgId: organization.id,
      actorUserId,
      targetUserId,
      action: "role_changed",
      oldRole: targetRole,
      newRole: input.role,
      reason: input.reason ?? null
    })
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function updatePartnerMemberStatus(
  actorUserId: string,
  targetUserId: string,
  input: { action: PartnerMembershipStatusAction; reason?: string | null }
) {
  const organization = await requirePrimaryPartnerOrganization(actorUserId)
  const actorRole = normalizePartnerRole(organization.membershipRole)

  if ((input.action === "disable" || input.action === "remove") && !input.reason?.trim()) {
    throw new Error("Reason is required.")
  }

  await sql`begin`
  try {
    const rows = (await sql`
      select role, status
      from partner_memberships
      where partner_org_id = ${organization.id}
        and user_id = ${targetUserId}
      for update
      limit 1
    `) as { role: PartnerMembershipRole; status: PartnerMembershipStatus | "inactive" }[]
    const target = rows[0]
    if (!target) throw new Error("Member not found.")

    const targetRole = normalizePartnerRole(target.role)
    if (
      !canChangePartnerMembershipStatus({
        actorRole,
        targetRole,
        action: input.action,
        isSelf: actorUserId === targetUserId
      })
    ) {
      throw new Error("Forbidden.")
    }

    if (
      target.status === "active" &&
      targetRole === "partner_owner" &&
      (input.action === "disable" || input.action === "remove")
    ) {
      const ownerCount = await getActiveOwnerCount(organization.id)
      if (ownerCount <= 1) throw new Error("At least one Partner Owner is required.")
    }

    const nextStatus: PartnerMembershipStatus =
      input.action === "disable"
        ? "disabled"
        : input.action === "remove"
          ? "removed"
          : "active"

    await sql`
      update partner_memberships
      set status = ${nextStatus}
      where partner_org_id = ${organization.id}
        and user_id = ${targetUserId}
    `
    await recordPartnerMembershipAudit({
      partnerOrgId: organization.id,
      actorUserId,
      targetUserId,
      action: `membership_${input.action}`,
      oldRole: targetRole,
      newRole: targetRole,
      oldStatus: target.status,
      newStatus: nextStatus,
      reason: input.reason ?? null
    })
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}
```

- [ ] **Step 6: Run typecheck**

Run: `bun typecheck`

Expected: PASS or no errors from `lib/partner/db.ts`.

---

### Task 4: Add S2 API routes

**Files:**
- Create: `app/api/partner/users/route.ts`
- Create: `app/api/partner/users/[userId]/role/route.ts`
- Create: `app/api/partner/users/[userId]/status/route.ts`
- Create: `app/api/partner/invitations/[invitationId]/route.ts`
- Create: `app/api/partner/invitations/[invitationId]/accept/route.ts`

- [ ] **Step 1: Create users route**

Write `app/api/partner/users/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  createPartnerUserInvitation,
  getPartnerUserManagementWorkspace
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET() {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const workspace = await getPartnerUserManagementWorkspace(userId)
    return NextResponse.json(workspace)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const body = (await request.json()) as {
      email?: string
      role?: "partner_owner" | "partner_admin" | "viewer"
      displayName?: string | null
      message?: string | null
    }
    const result = await createPartnerUserInvitation(userId, {
      email: body.email ?? "",
      role: body.role ?? "viewer",
      displayName: body.displayName ?? null,
      message: body.message ?? null
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invite failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 2: Create role route**

Write `app/api/partner/users/[userId]/role/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { updatePartnerMemberRole } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const actorUserId = await requirePartnerApiAction("invite.manage")
    const { userId } = await params
    const body = (await request.json()) as {
      role?: "partner_owner" | "partner_admin" | "viewer"
      reason?: string | null
    }
    await updatePartnerMemberRole(actorUserId, userId, {
      role: body.role ?? "viewer",
      reason: body.reason ?? null
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Role update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 3: Create status route**

Write `app/api/partner/users/[userId]/status/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { updatePartnerMemberStatus } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const actorUserId = await requirePartnerApiAction("invite.manage")
    const { userId } = await params
    const body = (await request.json()) as {
      action?: "disable" | "remove" | "reactivate"
      reason?: string | null
    }
    await updatePartnerMemberStatus(actorUserId, userId, {
      action: body.action ?? "disable",
      reason: body.reason ?? null
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 4: Create invitation cancel route**

Write `app/api/partner/invitations/[invitationId]/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { cancelPartnerUserInvitation } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const actorUserId = await requirePartnerApiAction("invite.manage")
    const { invitationId } = await params
    await cancelPartnerUserInvitation(actorUserId, invitationId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancel failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 5: Create invitation accept route**

Write `app/api/partner/invitations/[invitationId]/accept/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { acceptPartnerUserInvitation } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const userId = await getCurrentUserIdFromRequest()
    const { invitationId } = await params
    await acceptPartnerUserInvitation(userId, invitationId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Accept failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
```

- [ ] **Step 6: Run typecheck**

Run: `bun typecheck`

Expected: PASS or no errors from new route files.

---

### Task 5: Verify S2 baseline

**Files:**
- Verify: `lib/partner/core.test.ts`
- Verify: `lib/partner/access.test.ts`
- Verify: `lib/partner/admin.test.ts`

- [ ] **Step 1: Run focused tests**

Run: `bun test lib/partner/core.test.ts lib/partner/access.test.ts lib/partner/admin.test.ts`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `bun typecheck`

Expected: PASS.

- [ ] **Step 3: Run Biome check**

Run: `bun check`

Expected: PASS or formatter writes changes and reports success.

---

## Self-Review

Spec coverage:
- US-04 invitation creation/resend/cancel/accept: Task 3 + Task 4.
- US-05 role assignment matrix and last-owner guard: Task 1 + Task 3.
- US-06 disable/remove/reactivate with required reason and last-owner guard: Task 1 + Task 3.
- Audit events: Task 2 + Task 3.
- API surface for UI integration: Task 4.

Placeholder scan: no TBD/TODO/fill-later placeholders.

Type consistency: role/status names match `PartnerMvpRole`, `PartnerMembershipStatus`, and route payload unions.
