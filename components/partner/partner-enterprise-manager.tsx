"use client"

import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import type { PartnerAccess } from "@/lib/partner/access"
import type {
  PartnerEnterpriseMember,
  PartnerEnterpriseWorkspace
} from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")

function getEnterpriseInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

const statusLabels: Record<
  PartnerEnterpriseMember["activationStatus"],
  string
> = {
  invited: "Invited",
  pending_acceptance: "Pending acceptance",
  active: "Active",
  inactive: "Inactive",
  removed: "Removed",
  blocked: "Blocked"
}

const statusOrder: PartnerEnterpriseMember["activationStatus"][] = [
  "invited",
  "pending_acceptance",
  "active",
  "inactive",
  "removed",
  "blocked"
]

type FormMode = "add" | null
type RemoveTarget = Required<PartnerEnterpriseMember> | null
type CompanySearchResult = {
  id: string
  name: string
  taxId: string | null
  website: string | null
  address: string | null
  isActive: boolean
}

export function PartnerEnterpriseManager({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerEnterpriseWorkspace
}) {
  const router = useRouter()
  const canManageEnterprises = access.actions["enterprise.manage"]
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    PartnerEnterpriseMember["activationStatus"] | "all"
  >("all")
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [form, setForm] = useState({
    relationshipType: "member"
  })
  const [companySearch, setCompanySearch] = useState("")
  const [companyResults, setCompanyResults] = useState<CompanySearchResult[]>(
    []
  )
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget>(null)
  const [removeReason, setRemoveReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return workspace.members.filter((member) => {
      if (statusFilter !== "all" && member.activationStatus !== statusFilter) {
        return false
      }
      if (!q) return true
      return (
        member.enterpriseName.toLowerCase().includes(q) ||
        (member.contactEmail ?? "").toLowerCase().includes(q)
      )
    })
  }, [workspace.members, query, statusFilter])

  function openAdd() {
    setError(null)
    setForm({ relationshipType: "member" })
    setCompanySearch("")
    setCompanyResults([])
    setSelectedCompanyIds([])
    setInviteUrl(null)
    setFormMode("add")
  }

  async function submitJson(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown
  ) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Request failed.")
      }
      setMessage("Saved.")
      setFormMode(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  async function searchCompanies() {
    const q = companySearch.trim()
    if (q.length < 2) {
      setCompanyResults([])
      return
    }

    setError(null)
    const response = await fetch(
      `/api/partner/companies/search?q=${encodeURIComponent(q)}`
    )
    if (!response.ok) {
      setError("Could not search Arobid companies.")
      return
    }
    const payload = (await response.json()) as {
      companies: CompanySearchResult[]
    }
    setCompanyResults(payload.companies)
  }

  async function saveMember() {
    if (formMode === "add") {
      setIsSaving(true)
      setError(null)
      try {
        const response = await fetch("/api/partner/enterprise-members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyIds: selectedCompanyIds,
            relationshipType: form.relationshipType
          })
        })
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(payload?.error ?? "Request failed.")
        }
        const result = (await response.json()) as {
          created?: unknown[]
          skipped?: unknown[]
          shareUrl?: string
        }
        if (result.shareUrl) {
          setInviteUrl(result.shareUrl)
        }
        setMessage(
          `${result.created?.length ?? 0} invite(s) created, ${
            result.skipped?.length ?? 0
          } skipped.`
        )
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  async function removeAssociation() {
    if (!removeTarget) return
    await submitJson(
      `/api/partner/enterprise-members/${removeTarget.id}`,
      "DELETE",
      { reason: removeReason }
    )
    setRemoveTarget(null)
    setRemoveReason("")
  }

  return (
    <div className="space-y-4 px-4">
      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row justify-between">
          <div className="flex gap-2">
            <InputGroup className="max-w-sm rounded-full">
              <InputGroupAddon>
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company or email..."
              />
            </InputGroup>
            <NativeSelect
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | PartnerEnterpriseMember["activationStatus"]
                    | "all"
                )
              }
            >
              <option value="all">All statuses</option>
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </NativeSelect>
          </div>

          {canManageEnterprises ? (
            <Button onClick={openAdd}>
              <PlusIcon />
              Invite Company
            </Button>
          ) : null}
        </div>

        {filteredMembers.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
            No enterprise members found.
          </div>
        ) : (
          <Table className="border">
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Association</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {member.logoUrl ? (
                          <AvatarImage
                            alt={member.enterpriseName}
                            src={member.logoUrl}
                          />
                        ) : null}
                        <AvatarFallback>
                          {getEnterpriseInitial(member.enterpriseName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.enterpriseName}</p>
                        <p className="text-muted-foreground text-xs">
                          {member.contactEmail || "No contact email"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {statusLabels[member.activationStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary">
                        {member.relationshipType}
                      </Badge>
                      <p className="text-muted-foreground text-xs">
                        {member.source} ·{" "}
                        {member.publicProfile ? "Public" : "Private"}
                      </p>
                      {member.lastAction ? (
                        <p className="text-muted-foreground text-xs">
                          Last action: {member.lastAction}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {canManageEnterprises ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={
                            member.activationStatus === "removed" ||
                            member.activationStatus === "blocked"
                          }
                          onClick={() => {
                            setRemoveTarget(member)
                            setRemoveReason("")
                          }}
                        >
                          <Trash2Icon />
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog
        open={formMode !== null}
        onOpenChange={(v) => !v && setFormMode(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Invite Company</DialogTitle>
            <DialogDescription>
              Manage Tenant association metadata without changing Company SSOT.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {formMode === "add" ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="grid gap-2">
                  <Label>Search Arobid Company</Label>
                  <div className="flex gap-2">
                    <Input
                      value={companySearch}
                      onChange={(event) => setCompanySearch(event.target.value)}
                      placeholder="Search by company name, tax ID, website"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={searchCompanies}
                    >
                      Search
                    </Button>
                  </div>
                </div>
                {companyResults.length > 0 ? (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {companyResults.map((company) => (
                      <button
                        className="w-full rounded-md border p-2 text-left hover:bg-muted"
                        key={company.id}
                        type="button"
                        onClick={() =>
                          setSelectedCompanyIds((current) =>
                            current.includes(company.id)
                              ? current.filter((id) => id !== company.id)
                              : [...current, company.id]
                          )
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{company.name}</span>
                          {selectedCompanyIds.includes(company.id) ? (
                            <Badge>Selected</Badge>
                          ) : null}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {company.taxId || "No tax ID"} ·{" "}
                          {company.website || "No website"}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="rounded-md bg-muted p-2 text-muted-foreground text-sm">
                  Selected {selectedCompanyIds.length} company(s). Save without
                  selecting companies to get reusable Tenant registration URL.
                </div>
                {inviteUrl ? (
                  <div className="rounded-md border p-2 text-sm">
                    <div className="font-medium">Invite URL</div>
                    <div className="break-all text-muted-foreground">
                      {inviteUrl}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label>Relationship type</Label>
              <NativeSelect
                value={form.relationshipType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    relationshipType: event.target.value
                  }))
                }
              >
                <option value="member">Member</option>
                <option value="sponsored">Sponsored</option>
                <option value="expo_participant">Expo participant</option>
                <option value="campaign_attributed">Campaign attributed</option>
              </NativeSelect>
            </div>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormMode(null)}>
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={saveMember}>
              {isSaving
                ? "Saving..."
                : formMode === "add"
                  ? selectedCompanyIds.length > 0
                    ? `Invite ${selectedCompanyIds.length} selected`
                    : "Get share URL"
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove association?</DialogTitle>
            <DialogDescription>
              This removes {removeTarget?.enterpriseName} from this Tenant
              scope. It does not delete or edit the Company profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Removal reason</Label>
            <Input
              value={removeReason}
              onChange={(event) => setRemoveReason(event.target.value)}
              placeholder="Reason required for audit"
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={isSaving || !removeReason.trim()}
              variant="destructive"
              onClick={removeAssociation}
            >
              {isSaving ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
