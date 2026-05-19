"use client"

import {
  MoreHorizontalIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"

const roleLabels: Record<PartnerMvpRole, string> = {
  partner_owner: "Partner Owner",
  partner_admin: "Partner Admin",
  viewer: "Viewer"
}

const statusLabels: Record<
  PartnerOrganizationMember["status"] | "pending",
  string
> = {
  active: "Active",
  inactive: "Inactive",
  disabled: "Disabled",
  removed: "Removed",
  pending: "Pending"
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

type UserTableRow =
  | { kind: "member"; member: PartnerOrganizationMember }
  | { kind: "invitation"; invitation: PartnerUserInvitation }

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
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    memberStatus: "all"
  })

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

  const filteredUsers = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const rows: UserTableRow[] = [
      ...workspace.members.map((member) => ({
        kind: "member" as const,
        member
      })),
      ...workspace.invitations
        .filter((invitation) => invitation.status === "pending")
        .map((invitation) => ({
          kind: "invitation" as const,
          invitation
        }))
    ]

    return rows.filter((row) => {
      const email =
        row.kind === "member" ? row.member.email : row.invitation.email
      const name =
        row.kind === "member" ? row.member.name : row.invitation.displayName
      const role = row.kind === "member" ? row.member.role : row.invitation.role
      const status = row.kind === "member" ? row.member.status : "pending"
      const matchesSearch =
        !search ||
        email.toLowerCase().includes(search) ||
        name?.toLowerCase().includes(search)
      const matchesRole = filters.role === "all" || role === filters.role
      const matchesStatus =
        filters.memberStatus === "all" || status === filters.memberStatus
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [filters, workspace.members, workspace.invitations])

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({
      search: "",
      role: "all",
      memberStatus: "all"
    })
  }

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
      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          title="Active members"
          value={activeMembers.length}
          icon={<UsersIcon />}
        />
        <MetricCard
          title="Pending invites"
          value={pendingInvites.length}
          icon={<UserPlusIcon />}
        />
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <InputGroup className="rounded-full">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search name, email, message..."
            />
          </InputGroup>
          <NativeSelect
            className="w-44 rounded-full!"
            value={filters.memberStatus}
            onChange={(event) =>
              updateFilter("memberStatus", event.target.value)
            }
          >
            <option value="all">Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        {canInvite ? (
          <Button className="rounded-full" onClick={() => setInviteOpen(true)}>
            <UserPlusIcon />
            Invite user
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users match current filters.
                </TableCell>
              </TableRow>
            ) : null}
            {filteredUsers.map((row) => {
              if (row.kind === "invitation") {
                const { invitation } = row
                return (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <p className="font-medium">
                        {invitation.displayName || invitation.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {invitation.email}
                      </p>
                    </TableCell>
                    <TableCell>{roleLabels[invitation.role]}</TableCell>
                    <TableCell>
                      <Badge>Pending</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {canInvite ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              }

              const { member } = row
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
                    <p className="font-medium">{member.name ?? member.email}</p>
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
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="rounded-full"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">Open member actions</span>
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
      </div>

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
  icon
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-sm">{title}</span>
          <span className="font-medium text-2xl">{value}</span>
        </div>
        <div className="rounded-full bg-muted p-3 text-foreground [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
