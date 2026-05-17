"use client"

import {
  MoreHorizontalIcon,
  ShieldIcon,
  UserPlusIcon,
  UsersIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { PartnerAccess } from "@/lib/partner/access"
import {
  getPartnerMemberActionVisibility,
  type PartnerMvpRole
} from "@/lib/partner/core"
import type {
  PartnerOrganizationMember,
  PartnerUserInvitation,
  PartnerUserManagementWorkspace
} from "@/lib/partner/db"

const roleLabels: Record<PartnerMvpRole, string> = {
  partner_owner: "Partner Owner",
  partner_admin: "Partner Admin",
  viewer: "Viewer"
}

const statusLabels: Record<PartnerOrganizationMember["status"], string> = {
  active: "Active",
  inactive: "Inactive",
  disabled: "Disabled",
  removed: "Removed"
}

const invitationStatusLabels: Record<PartnerUserInvitation["status"], string> =
  {
    pending: "Pending",
    accepted: "Accepted",
    cancelled: "Cancelled",
    expired: "Expired"
  }

type InviteForm = {
  email: string
  displayName: string
  role: PartnerMvpRole
  message: string
}

type MemberDialog =
  | { kind: "role"; member: PartnerOrganizationMember; role: PartnerMvpRole }
  | {
      kind: "status"
      member: PartnerOrganizationMember
      action: "disable" | "remove" | "reactivate"
    }
  | null

export function PartnerUserManagementManager({
  access,
  workspace,
  currentUserId
}: {
  access: PartnerAccess
  workspace: PartnerUserManagementWorkspace
  currentUserId: string
}) {
  const router = useRouter()
  const actorRole = access.role ?? "viewer"
  const [inviteOpen, setInviteOpen] = useState(false)
  const [dialog, setDialog] = useState<MemberDialog>(null)
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: "",
    displayName: "",
    role: actorRole === "partner_owner" ? "partner_admin" : "viewer",
    message: ""
  })
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const canInvite = actorRole !== "viewer"
  const pendingInvites = workspace.invitations.filter(
    (invite) => invite.status === "pending"
  )
  const activeMembers = workspace.members.filter(
    (member) => member.status === "active"
  )

  const roleOptions = useMemo(() => {
    if (actorRole === "partner_owner") {
      return ["partner_owner", "partner_admin", "viewer"] as PartnerMvpRole[]
    }
    if (actorRole === "partner_admin") {
      return ["partner_admin", "viewer"] as PartnerMvpRole[]
    }
    return ["viewer"] as PartnerMvpRole[]
  }, [actorRole])

  async function submitJson(url: string, method: string, body?: unknown) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Request failed.")
      }
      setMessage("Saved.")
      setInviteOpen(false)
      setDialog(null)
      setReason("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  async function inviteUser() {
    await submitJson("/api/partner/users", "POST", {
      email: inviteForm.email,
      displayName: inviteForm.displayName || null,
      role: inviteForm.role,
      message: inviteForm.message || null
    })
  }

  async function confirmMemberDialog() {
    if (!dialog) return
    if (dialog.kind === "role") {
      await submitJson(
        `/api/partner/users/${dialog.member.userId}/role`,
        "PATCH",
        {
          role: dialog.role,
          reason
        }
      )
      return
    }

    await submitJson(
      `/api/partner/users/${dialog.member.userId}/status`,
      "PATCH",
      {
        action: dialog.action,
        reason
      }
    )
  }

  async function cancelInvitation(invitationId: string) {
    await submitJson(`/api/partner/invitations/${invitationId}`, "DELETE")
  }

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          title="Active members"
          value={activeMembers.length}
          note="Can access Partner Portal"
          icon={<UsersIcon />}
        />
        <MetricCard
          title="Pending invites"
          value={pendingInvites.length}
          note="Awaiting acceptance"
          icon={<UserPlusIcon />}
        />
        <MetricCard
          title="Current role"
          value={roleLabels[actorRole]}
          note="Controls membership actions"
          icon={<ShieldIcon />}
        />
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Partner Users</CardTitle>
              <CardDescription>
                Membership is scoped to current Partner Organization.
              </CardDescription>
            </div>
            {canInvite ? (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlusIcon />
                Invite user
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspace.members.map((member) => {
                const actionVisibility = getPartnerMemberActionVisibility({
                  actorRole,
                  targetRole: member.role,
                  targetStatus: member.status,
                  isSelf: member.userId === currentUserId
                })
                const hasActions =
                  actionVisibility.canChangeRole ||
                  actionVisibility.canDisable ||
                  actionVisibility.canRemove ||
                  actionVisibility.canReactivate

                return (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <p className="font-medium">
                        {member.name ?? member.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {member.email}
                      </p>
                    </TableCell>
                    <TableCell>{roleLabels[member.role]}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.status === "active" ? "default" : "outline"
                        }
                      >
                        {statusLabels[member.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasActions ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">
                                Open member actions
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actionVisibility.canChangeRole
                              ? roleOptions
                                  .filter((role) => role !== member.role)
                                  .map((role) => (
                                    <DropdownMenuItem
                                      key={role}
                                      onClick={() =>
                                        setDialog({
                                          kind: "role",
                                          member,
                                          role
                                        })
                                      }
                                    >
                                      Change to {roleLabels[role]}
                                    </DropdownMenuItem>
                                  ))
                              : null}
                            {actionVisibility.canDisable ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setDialog({
                                    kind: "status",
                                    member,
                                    action: "disable"
                                  })
                                }
                              >
                                Disable user
                              </DropdownMenuItem>
                            ) : null}
                            {actionVisibility.canReactivate ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setDialog({
                                    kind: "status",
                                    member,
                                    action: "reactivate"
                                  })
                                }
                              >
                                Reactivate user
                              </DropdownMenuItem>
                            ) : null}
                            {actionVisibility.canRemove ? (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setDialog({
                                    kind: "status",
                                    member,
                                    action: "remove"
                                  })
                                }
                              >
                                Remove user
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            Pending invitations expire after 7 calendar days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workspace.invitations.length === 0 ? (
            <div className="rounded-md border border-dashed py-10 text-center text-muted-foreground text-sm">
              No invitations yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.invitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-muted-foreground text-xs">
                        {invite.displayName || "No display name"}
                      </p>
                    </TableCell>
                    <TableCell>{roleLabels[invite.role]}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invite.status === "pending" ? "default" : "outline"
                        }
                      >
                        {invitationStatusLabels[invite.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {canInvite && invite.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInvitation(invite.id)}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Partner User</DialogTitle>
            <DialogDescription>
              Invite grants access only within current Partner Organization
              after acceptance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Email address</Label>
              <Input
                value={inviteForm.email}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    email: event.target.value
                  }))
                }
                placeholder="ops@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Display name</Label>
              <Input
                value={inviteForm.displayName}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    displayName: event.target.value
                  }))
                }
                placeholder="Nguyen Partner Ops"
              />
            </div>
            <div className="grid gap-2">
              <Label>Partner role</Label>
              <NativeSelect
                value={inviteForm.role}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    role: event.target.value as PartnerMvpRole
                  }))
                }
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label>Message</Label>
              <Textarea
                value={inviteForm.message}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    message: event.target.value
                  }))
                }
                placeholder="Optional invite note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={inviteUser}>
              {isSaving ? "Inviting..." : "Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle(dialog)}</DialogTitle>
            <DialogDescription>
              {dialog?.member.email ?? "Member action"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Internal audit note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={confirmMemberDialog}>
              {isSaving ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getDialogTitle(dialog: MemberDialog) {
  if (!dialog) return "Member action"
  if (dialog.kind === "role") return `Change role to ${roleLabels[dialog.role]}`
  if (dialog.action === "disable") return "Disable user"
  if (dialog.action === "remove") return "Remove user"
  return "Reactivate user"
}

function MetricCard({
  title,
  value,
  note,
  icon
}: {
  title: string
  value: string | number
  note: string
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-muted-foreground text-xs [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        <span>{note}</span>
      </CardContent>
    </Card>
  )
}
