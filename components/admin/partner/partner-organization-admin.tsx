"use client"

import {
  Building2Icon,
  CheckCircle2Icon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon
} from "lucide-react"
import Link from "next/link"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

const modelLabels: Record<string, string> = {
  tenant: "Tenant",
  co_host: "Co-host",
  turnkey: "Turnkey"
}

const partnerTypeLabels: Record<string, string> = {
  expo_partner: "Expo partner",
  strategic_partner: "Strategic partner",
  distribution_partner: "Distribution partner",
  alliance_partner: "Alliance partner",
  government_program_partner: "Government program partner"
}

type PartnerOrganizationRow = {
  id: string
  name: string
  model: string
  partner_type: string
  status: string
  member_count: number
}

export function PartnerOrganizationAdmin({
  organizations
}: {
  organizations: PartnerOrganizationRow[]
}) {
  const [name, setName] = useState("")
  const [model, setModel] = useState("tenant")
  const [partnerType, setPartnerType] = useState("expo_partner")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const metrics = useMemo(() => {
    const activeCount = organizations.filter(
      (organization) => organization.status === "active"
    ).length
    const totalMembers = organizations.reduce(
      (total, organization) => total + organization.member_count,
      0
    )
    const partnerTypeCount = new Set(
      organizations.map((organization) => organization.partner_type)
    ).size

    return [
      {
        label: "Organizations",
        value: organizations.length.toLocaleString(),
        icon: Building2Icon
      },
      {
        label: "Active",
        value: activeCount.toLocaleString(),
        icon: CheckCircle2Icon
      },
      {
        label: "Members",
        value: totalMembers.toLocaleString(),
        icon: UsersIcon
      },
      {
        label: "Partner types",
        value: partnerTypeCount.toLocaleString(),
        icon: ShieldCheckIcon
      }
    ]
  }, [organizations])

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return organizations.filter((organization) => {
      const matchesStatus =
        statusFilter === "all" || organization.status === statusFilter
      const searchableText = [
        organization.name,
        organization.id,
        organization.model,
        organization.partner_type,
        organization.status
      ]
        .join(" ")
        .toLowerCase()
      const matchesQuery =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [organizations, query, statusFilter])

  async function createOrganization() {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, model, partnerType })
      })
      if (!response.ok) {
        setError("Could not create Partner Organization.")
        return
      }
      window.location.reload()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-muted-foreground text-sm">{metric.label}</p>
                <p className="font-semibold text-2xl tracking-tight">
                  {metric.value}
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <metric.icon className="size-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="xl:sticky xl:top-4 xl:self-start">
          <CardHeader>
            <CardTitle>Create Partner</CardTitle>
            <CardDescription>
              Set up an Arobid-governed organization, then manage members and
              mini-site review from its detail page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Organization name</Label>
              <Input
                id="partner-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="ASEAN Export Hub"
              />
            </div>
            <div className="space-y-2">
              <Label>Operating model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="co_host">Co-host</SelectItem>
                  <SelectItem value="turnkey">Turnkey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Partner type</Label>
              <Select value={partnerType} onValueChange={setPartnerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expo_partner">Expo partner</SelectItem>
                  <SelectItem value="strategic_partner">
                    Strategic partner
                  </SelectItem>
                  <SelectItem value="distribution_partner">
                    Distribution partner
                  </SelectItem>
                  <SelectItem value="alliance_partner">
                    Alliance partner
                  </SelectItem>
                  <SelectItem value="government_program_partner">
                    Government program partner
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button
              className="w-full"
              onClick={createOrganization}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? "Creating..." : "Create organization"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Partner Organizations</CardTitle>
              <CardDescription>
                Browse partner records and open each control-plane workspace.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[420px] md:flex-row">
              <div className="relative flex-1">
                <SearchIcon
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, ID, model..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Organization</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead className="w-24 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((organization) => (
                    <TableRow key={organization.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{organization.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {organization.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatValue(organization.model, modelLabels)}
                      </TableCell>
                      <TableCell>
                        {formatValue(
                          organization.partner_type,
                          partnerTypeLabels
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatStatus(organization.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {organization.member_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/partners/${organization.id}`}>
                            Open
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No partner organizations match current filters.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatValue(value: string, labels: Record<string, string>) {
  return labels[value] ?? value
}

function formatStatus(status: string) {
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
