"use client"

import {
  CheckCircle2Icon,
  Clock3Icon,
  CopyIcon,
  LinkIcon,
  MailIcon,
  QrCodeIcon,
  RotateCwIcon,
  SearchIcon,
  SendIcon
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { PartnerAccess } from "@/lib/partner/access"
import type {
  PartnerEnterpriseMember,
  PartnerEnterpriseWorkspace
} from "@/lib/partner/db"

const invitationStatusLabels = {
  accepted: "Accepted",
  pending: "Pending"
} as const

const invitationTypeLabels = {
  site_visit: "Site Visit Link",
  join_partner_site: "Join Partner Site"
} as const

const invitationTypeOptions = ["site_visit", "join_partner_site"] as const

type InvitationStatus = keyof typeof invitationStatusLabels
type StatusFilter = InvitationStatus | "all"
type InvitationType = (typeof invitationTypeOptions)[number]

type InvitationRow = {
  id: string
  recipient: string
  enterpriseName: string
  status: InvitationStatus
  updatedAt: string
}

type ParsedRecipients = {
  valid: string[]
  invalid: string[]
}

type SendInvitationResponse = {
  sentCount: number
  createdCount: number
  resentCount: number
  skipped: { email: string; reason: string }[]
}

export function PartnerSiteInvitationManager({
  access,
  workspace,
  inviteBaseUrl
}: {
  access: PartnerAccess
  workspace: PartnerEnterpriseWorkspace
  inviteBaseUrl: string
}) {
  const router = useRouter()
  const canManageInvitations = access.actions["invite.manage"]
  const partnerId = workspace.organization?.id ?? ""
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invitationType, setInvitationType] =
    useState<InvitationType>("join_partner_site")
  const [recipientText, setRecipientText] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const invitationLink = useMemo(
    () =>
      partnerId
        ? buildInvitationLink({ inviteBaseUrl, invitationType, partnerId })
        : "",
    [inviteBaseUrl, invitationType, partnerId]
  )
  const parsedRecipients = useMemo(
    () => parseRecipientEmails(recipientText),
    [recipientText]
  )
  const qrCodeUrl = invitationLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(invitationLink)}`
    : ""

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

  async function copyInvitationLink() {
    if (!invitationLink) return

    setError(null)
    try {
      await navigator.clipboard.writeText(invitationLink)
      setMessage("Invitation link copied.")
    } catch {
      setError("Could not copy invitation link.")
    }
  }

  async function sendInvitationEmail() {
    setMessage(null)
    setError(null)

    if (!partnerId) {
      setError("Partner ID is required before sending invitations.")
      return
    }
    if (parsedRecipients.invalid.length > 0) {
      setError(`Invalid email: ${parsedRecipients.invalid.join(", ")}`)
      return
    }
    if (parsedRecipients.valid.length === 0) {
      setError("Enter at least one valid recipient email.")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/partner/partner-site/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationType, recipientText })
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Could not send invitations.")
      }

      const result = (await response.json()) as SendInvitationResponse
      setMessage(
        `Invitation email sent to ${result.sentCount} recipient(s). ${result.createdCount} new, ${result.resentCount} resent.`
      )
      if (result.skipped.length > 0) {
        setError(
          `Skipped: ${result.skipped.map((item) => `${item.email} (${item.reason})`).join(", ")}`
        )
      }
      setInviteOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invitations.")
    } finally {
      setIsSending(false)
    }
  }

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
            <Button
              className="rounded-full"
              disabled={!canManageInvitations}
              onClick={() => setInviteOpen(true)}
            >
              <MailIcon className="h-4 w-4" />
              Invite
            </Button>
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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create invitation</DialogTitle>
            <DialogDescription>
              Invite through a shareable link or send a system email invitation.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Field label="Destination">
              <NativeSelect
                className="w-full"
                value={invitationType}
                onChange={(event) =>
                  setInvitationType(event.target.value as InvitationType)
                }
              >
                {invitationTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {invitationTypeLabels[type]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Tabs defaultValue="link">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">
                  <LinkIcon className="h-4 w-4" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="email">
                  <MailIcon className="h-4 w-4" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4">
                <Field label="Invitation link">
                  <div className="flex gap-2">
                    <Input readOnly value={invitationLink} />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!invitationLink}
                      onClick={copyInvitationLink}
                    >
                      <CopyIcon className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </Field>

                <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 p-4">
                  {qrCodeUrl ? (
                    <Image
                      alt="Invitation QR code"
                      className="rounded-lg"
                      height={180}
                      src={qrCodeUrl}
                      unoptimized
                      width={180}
                    />
                  ) : (
                    <QrCodeIcon className="h-16 w-16 text-muted-foreground" />
                  )}
                  <p className="text-center text-muted-foreground text-xs">
                    Share QR code or copy invitation link.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <Field label="Recipient email list">
                  <Textarea
                    value={recipientText}
                    onChange={(event) => setRecipientText(event.target.value)}
                    placeholder="a@company.com, b@company.com"
                    rows={8}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {parsedRecipients.valid.length} valid
                  </Badge>
                  {parsedRecipients.invalid.length > 0 ? (
                    <Badge variant="destructive">
                      {parsedRecipients.invalid.length} invalid
                    </Badge>
                  ) : null}
                  <Badge variant="outline">
                    {invitationTypeLabels[invitationType]}
                  </Badge>
                </div>
                {parsedRecipients.invalid.length > 0 ? (
                  <p className="text-destructive text-sm">
                    Invalid email: {parsedRecipients.invalid.join(", ")}
                  </p>
                ) : null}
                <p className="text-muted-foreground text-sm">
                  System sends standard email template automatically. Partner
                  users cannot edit sender or content.
                </p>
                <Button
                  className="w-full"
                  disabled={!canManageInvitations || isSending || !partnerId}
                  onClick={sendInvitationEmail}
                >
                  <SendIcon className="h-4 w-4" />
                  {isSending ? "Sending..." : "Send email"}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  children,
  label
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function parseRecipientEmails(value: string): ParsedRecipients {
  const emails = value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const uniqueEmails = Array.from(new Set(emails))

  return {
    valid: uniqueEmails.filter(isEmail),
    invalid: uniqueEmails.filter((email) => !isEmail(email))
  }
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function buildInvitationLink({
  inviteBaseUrl,
  invitationType,
  partnerId
}: {
  inviteBaseUrl: string
  invitationType: InvitationType
  partnerId: string
}) {
  const url = getInvitationBaseUrl(inviteBaseUrl)
  url.searchParams.set("partnerId", partnerId)
  url.searchParams.set(
    "type",
    invitationType === "site_visit" ? "visit" : "join"
  )
  return url.toString()
}

function getInvitationBaseUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol === "https:") return url
  } catch {
    return new URL("https://arobid.site/invite")
  }

  return new URL("https://arobid.site/invite")
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
