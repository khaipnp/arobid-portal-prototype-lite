"use client"

import {
  DownloadIcon,
  FileSpreadsheetIcon,
  MailIcon,
  SearchIcon,
  SendIcon,
  UploadIcon,
  XIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
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
  pending: "Pending",
  expired: "Expired"
} as const

type InvitationStatus = keyof typeof invitationStatusLabels
type StatusFilter = InvitationStatus | "all"
type RecipientSource = "manual" | "import"

type InvitationRow = {
  id: string
  recipient: string
  enterpriseName: string
  status: InvitationStatus
  updatedAt: string
}

type RecipientIssue = {
  email: string
  reason: string
}

type RecipientPreview = {
  source: RecipientSource
  limit: number
  normalizedRecipients: string[]
  valid: string[]
  invalid: RecipientIssue[]
  duplicates: RecipientIssue[]
  existingPending: RecipientIssue[]
  existingExpired: RecipientIssue[]
  existingAccepted: RecipientIssue[]
  canSend: boolean
}

type ParsedRecipients = {
  valid: string[]
  invalid: string[]
  duplicates: string[]
}

type SendInvitationResponse = {
  sentCount: number
  createdCount: number
  resentCount: number
  skipped: { email: string; reason: string }[]
  preview?: RecipientPreview
}

export function PartnerSiteInvitationManager({
  access,
  workspace
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
  const [inputMode, setInputMode] = useState<RecipientSource>("manual")
  const [recipientText, setRecipientText] = useState("")
  const [uploadedRecipients, setUploadedRecipients] = useState<string[]>([])
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<RecipientPreview | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const parsedRecipients = useMemo(
    () => parseRecipientEmails(recipientText),
    [recipientText]
  )
  const selectedRecipients = useMemo(
    () =>
      inputMode === "manual"
        ? [...parsedRecipients.valid, ...parsedRecipients.invalid]
        : uploadedRecipients,
    [inputMode, parsedRecipients, uploadedRecipients]
  )

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

  function resetInviteDialog() {
    setInputMode("manual")
    setRecipientText("")
    setUploadedRecipients([])
    setUploadedFileName(null)
    setPreview(null)
    setError(null)
  }

  function openInviteDialog() {
    resetInviteDialog()
    setInviteOpen(true)
  }

  function updateInviteOpen(open: boolean) {
    setInviteOpen(open)
    if (!open) resetInviteDialog()
  }

  async function validateRecipients() {
    setMessage(null)
    setError(null)
    setPreview(null)

    if (!partnerId) {
      setError("Partner context is required before sending invitations.")
      return
    }
    if (selectedRecipients.length === 0) {
      setError("Enter at least one recipient email.")
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch(
        "/api/partner/partner-site/invitations/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients: selectedRecipients,
            source: inputMode
          })
        }
      )
      const payload = (await response.json().catch(() => null)) as
        | RecipientPreview
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "Could not validate recipients."
        )
      }

      setPreview(payload as RecipientPreview)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not validate recipients."
      )
    } finally {
      setIsValidating(false)
    }
  }

  async function sendInvitationEmail() {
    setMessage(null)
    setError(null)

    if (!preview?.canSend) {
      setError("Validate recipients before sending invitations.")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/partner/partner-site/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: preview.valid, source: inputMode })
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Could not send invitations.")
      }

      const result = (await response.json()) as SendInvitationResponse
      setMessage(
        `Invitation records created for ${result.createdCount} recipient(s).`
      )
      if (result.skipped.length > 0) {
        setError(
          `Skipped: ${result.skipped.map((item) => `${item.email} (${item.reason})`).join(", ")}`
        )
      }
      setInviteOpen(false)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send invitations."
      )
    } finally {
      setIsSending(false)
    }
  }

  async function resendInvitation(invitation: InvitationRow) {
    if (
      (invitation.status !== "pending" && invitation.status !== "expired") ||
      resendingId
    ) {
      return
    }

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

  function downloadTemplate() {
    const blob = new Blob(["Recipient Email\n"], {
      type: "text/csv;charset=utf-8;"
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "partner-site-invitation-template.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    setPreview(null)
    setError(null)
    setUploadedRecipients([])
    setUploadedFileName(null)

    if (!file) return

    try {
      const recipients = await readRecipientFile(file)
      setUploadedRecipients(recipients)
      setUploadedFileName(file.name)
      setInputMode("import")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file.")
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <InputGroup className="w-full max-w-xs">
            <InputGroupAddon align="inline-start">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 255))}
              placeholder="Search recipient email"
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setQuery("")}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <NativeSelect
            className="w-full sm:w-44"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
          </NativeSelect>
        </div>
        <Button
          size="lg"
          disabled={!canManageInvitations}
          onClick={openInviteDialog}
        >
          Create Invite
        </Button>
      </div>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border">
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
                  {invitation.recipient || "No recipient email"}
                </TableCell>
                <TableCell>
                  <InvitationStatusBadge status={invitation.status} />
                </TableCell>
                <TableCell className="text-right">
                  {invitation.status === "pending" ||
                  invitation.status === "expired" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        !canManageInvitations || resendingId === invitation.id
                      }
                      onClick={() => resendInvitation(invitation)}
                    >
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

      <Dialog open={inviteOpen} onOpenChange={updateInviteOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create invitation</DialogTitle>
            <DialogDescription>
              Validate recipients first, then send Join Partner invitation
              records under the current Partner Site context.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Tabs
              value={inputMode}
              onValueChange={(value) => {
                setInputMode(value as RecipientSource)
                setPreview(null)
                setError(null)
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">
                  <MailIcon className="h-4 w-4" />
                  Manual input
                </TabsTrigger>
                <TabsTrigger value="import">
                  <FileSpreadsheetIcon className="h-4 w-4" />
                  Import file
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-5 space-y-4">
                <Textarea
                  value={recipientText}
                  onChange={(event) => {
                    setRecipientText(event.target.value)
                    setPreview(null)
                  }}
                  placeholder="a@company.com, b@company.com"
                  rows={8}
                />

                <p className="text-muted-foreground text-sm">
                  Manual input supports up to 20 comma-separated emails.
                </p>
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download template
                  </Button>
                  <Button asChild variant="outline">
                    <label className="cursor-pointer">
                      <UploadIcon className="h-4 w-4" />
                      Upload CSV/XLSX
                      <input
                        className="sr-only"
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm">
                  Imported files must include only a Recipient Email column and
                  support up to 200 emails.
                </p>
                {uploadedFileName ? (
                  <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                    {uploadedFileName}: {uploadedRecipients.length} recipient(s)
                    loaded.
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {selectedRecipients.length} recipient(s)
              </Badge>
              {inputMode === "manual" &&
              parsedRecipients.duplicates.length > 0 ? (
                <Badge variant="outline">
                  {parsedRecipients.duplicates.length} duplicate(s) ignored
                </Badge>
              ) : null}
              <Badge variant="outline">Join Partner</Badge>
              {preview ? (
                <Badge variant={preview.canSend ? "default" : "destructive"}>
                  {preview.canSend ? "Ready to send" : "Fix required"}
                </Badge>
              ) : null}
            </div>

            {preview ? <RecipientPreviewPanel preview={preview} /> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={!canManageInvitations || isValidating || isSending}
              onClick={validateRecipients}
            >
              {isValidating ? "Validating..." : "Preview validation"}
            </Button>
            <Button
              disabled={
                !canManageInvitations ||
                isSending ||
                !partnerId ||
                !preview?.canSend
              }
              onClick={sendInvitationEmail}
            >
              <SendIcon className="h-4 w-4" />
              {isSending ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
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

function RecipientPreviewPanel({ preview }: { preview: RecipientPreview }) {
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{preview.valid.length} valid</Badge>
        {preview.invalid.length > 0 ? (
          <Badge variant="destructive">{preview.invalid.length} invalid</Badge>
        ) : null}
        {preview.duplicates.length > 0 ? (
          <Badge variant="outline">
            {preview.duplicates.length} duplicate(s) ignored
          </Badge>
        ) : null}
      </div>

      <PreviewIssueList title="Valid recipients" emails={preview.valid} />
      <PreviewIssueList title="Invalid emails" issues={preview.invalid} />
      <PreviewIssueList
        title="Duplicates ignored"
        issues={preview.duplicates}
      />
      <PreviewIssueList
        title="Already pending"
        issues={preview.existingPending}
      />
      <PreviewIssueList
        title="Expired - use Resend"
        issues={preview.existingExpired}
      />
      <PreviewIssueList
        title="Already accepted"
        issues={preview.existingAccepted}
      />
    </div>
  )
}

function PreviewIssueList({
  emails,
  issues,
  title
}: {
  emails?: string[]
  issues?: RecipientIssue[]
  title: string
}) {
  const items = issues ?? emails?.map((email) => ({ email, reason: "" })) ?? []
  if (items.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="font-medium text-sm">{title}</p>
      <div className="max-h-28 overflow-y-auto rounded-md bg-muted/40 p-2 text-sm">
        {items.map((item) => (
          <div
            key={`${title}-${item.email}`}
            className="flex justify-between gap-3"
          >
            <span>{item.email}</span>
            {item.reason ? (
              <span className="text-muted-foreground">{item.reason}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

async function readRecipientFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension !== "csv" && extension !== "xlsx") {
    throw new Error("Unsupported file type. Upload .csv or .xlsx.")
  }

  if (extension === "csv") {
    const text = await file.text()
    return parseRecipientCsv(text)
  }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error("Spreadsheet is empty.")
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  })
  return extractRecipientEmailColumn(rows)
}

function parseRecipientCsv(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const [header, ...rows] = lines
  if (!header) throw new Error("CSV is empty.")
  const headers = splitCsvLine(header)
  const emailIndex = headers.findIndex(
    (item) => item.trim().toLowerCase() === "recipient email"
  )
  if (emailIndex === -1) {
    throw new Error('Template must include "Recipient Email" column.')
  }

  return rows
    .map((line) => splitCsvLine(line)[emailIndex]?.trim() ?? "")
    .filter(Boolean)
}

function splitCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let quoted = false

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === "," && !quoted) {
      values.push(current)
      current = ""
      continue
    }
    current += char
  }
  values.push(current)

  return values
}

function extractRecipientEmailColumn(rows: Record<string, unknown>[]) {
  if (rows.length === 0) throw new Error("Spreadsheet is empty.")
  const firstRow = rows[0]
  const emailKey = Object.keys(firstRow).find(
    (key) => key.trim().toLowerCase() === "recipient email"
  )
  if (!emailKey) {
    throw new Error('Template must include "Recipient Email" column.')
  }

  return rows.map((row) => String(row[emailKey] ?? "").trim()).filter(Boolean)
}

function parseRecipientEmails(value: string): ParsedRecipients {
  const emails = value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const seen = new Set<string>()
  const uniqueEmails: string[] = []
  const duplicates: string[] = []

  for (const email of emails) {
    if (seen.has(email)) {
      duplicates.push(email)
      continue
    }
    seen.add(email)
    uniqueEmails.push(email)
  }

  return {
    valid: uniqueEmails.filter(isEmail),
    invalid: uniqueEmails.filter((email) => !isEmail(email)),
    duplicates
  }
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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
    if (
      member.inviteExpiresAt &&
      new Date(member.inviteExpiresAt).getTime() < Date.now()
    ) {
      return "expired"
    }

    return "pending"
  }

  return null
}

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {invitationStatusLabels[status]}
    </Badge>
  )
}

function getStatusBadgeVariant(status: InvitationStatus) {
  if (status === "accepted") return "default"
  if (status === "expired") return "destructive"
  return "secondary"
}
