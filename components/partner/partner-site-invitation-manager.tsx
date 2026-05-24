"use client"

import {
  CheckCircle2Icon,
  Clock3Icon,
  RotateCwIcon,
  SearchIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { PartnerAccess } from "@/lib/partner/access"
import type {
  PartnerEnterpriseMember,
  PartnerEnterpriseWorkspace
} from "@/lib/partner/db"

const invitationStatusLabels = {
  accepted: "Accepted",
  pending: "Pending"
} as const

type InvitationStatus = keyof typeof invitationStatusLabels
type StatusFilter = InvitationStatus | "all"

type InvitationRow = {
  id: string
  recipient: string
  enterpriseName: string
  status: InvitationStatus
  updatedAt: string
}

export function PartnerSiteInvitationManager({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerEnterpriseWorkspace
}) {
  const router = useRouter()
  const canManageInvitations = access.actions["invite.manage"]
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const invitations = useMemo(
    () => workspace.members.map(toInvitationRow).filter(isInvitationRow),
    [workspace.members]
  )

  const filteredInvitations = useMemo(() => {
    const search = query.trim().toLowerCase()

    return invitations.filter((invitation) => {
      const matchesSearch =
        !search || invitation.recipient.toLowerCase().includes(search)
      const matchesStatus =
        statusFilter === "all" || invitation.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [invitations, query, statusFilter])

  async function resendInvitation(invitation: InvitationRow) {
    if (invitation.status !== "pending" || resendingId) return

    setResendingId(invitation.id)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(
        `/api/partner/enterprise-members/${invitation.id}/resend`,
        { method: "POST" }
      )
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Could not resend invitation.")
      }

      setMessage(
        invitation.recipient
          ? `Invitation resent to ${invitation.recipient}.`
          : "Invitation resent."
      )
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not resend invitation."
      )
    } finally {
      setResendingId(null)
    }
  }

  return (
    <div className="mt-5 space-y-4 px-4 pb-8">
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Partner Site</Badge>
              <Badge variant="secondary">
                {invitations.length} invitation(s)
              </Badge>
            </div>
            <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
              Track Partner Site invitation responses. Accepted means recipient
              registered from invitation; enterprise join status still depends
              on membership linking.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <InputGroup className="w-full rounded-full sm:w-80">
              <InputGroupAddon align="inline-start">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(event) => setQuery(event.target.value.slice(0, 255))}
                placeholder="Search recipient email"
              />
            </InputGroup>
            <NativeSelect
              className="w-full sm:w-44"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">All statuses</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
            </NativeSelect>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvitations.length === 0 ? (
              <TableRow>
                <TableCell
                  className="h-32 text-center text-muted-foreground"
                  colSpan={3}
                >
                  No invitation matches current filters.
                </TableCell>
              </TableRow>
            ) : null}
            {filteredInvitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {invitation.recipient || "No recipient email"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {invitation.enterpriseName}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <InvitationStatusBadge status={invitation.status} />
                </TableCell>
                <TableCell className="text-right">
                  {invitation.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        !canManageInvitations || resendingId === invitation.id
                      }
                      onClick={() => resendInvitation(invitation)}
                    >
                      <RotateCwIcon className="h-4 w-4" />
                      {resendingId === invitation.id
                        ? "Resending..."
                        : "Resend"}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function isInvitationRow(row: InvitationRow | null): row is InvitationRow {
  return row !== null
}

function toInvitationRow(
  member: Required<PartnerEnterpriseMember>
): InvitationRow | null {
  if (member.source !== "tenant_invite") return null

  const status = getInvitationStatus(member)
  if (!status) return null

  return {
    id: member.id,
    recipient: member.contactEmail ?? "",
    enterpriseName: member.enterpriseName,
    status,
    updatedAt: member.updatedAt
  }
}

function getInvitationStatus(
  member: Required<PartnerEnterpriseMember>
): InvitationStatus | null {
  if (member.activationStatus === "active" || member.acceptedAt) {
    return "accepted"
  }
  if (
    member.activationStatus === "invited" ||
    member.activationStatus === "pending_acceptance"
  ) {
    return "pending"
  }

  return null
}

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  if (status === "accepted") {
    return (
      <Badge className="gap-1" variant="default">
        <CheckCircle2Icon className="h-3.5 w-3.5" />
        Accepted
      </Badge>
    )
  }

  return (
    <Badge className="gap-1" variant="secondary">
      <Clock3Icon className="h-3.5 w-3.5" />
      Pending
    </Badge>
  )
}
