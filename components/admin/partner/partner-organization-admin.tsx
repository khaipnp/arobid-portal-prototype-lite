"use client"

import Link from "next/link"
import { useState } from "react"
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
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create Partner Organization</CardTitle>
          <CardDescription>
            Create Arobid-governed partner organizations. Users are attached
            through memberships.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partner-name">Name</Label>
            <Input
              id="partner-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ASEAN Export Hub"
            />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
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
            onClick={createOrganization}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Creating..." : "Create organization"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partner Organizations</CardTitle>
          <CardDescription>
            Control-plane records for Partner Portal access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {organizations.map((organization) => (
            <Link
              key={organization.id}
              href={`/admin/partners/${organization.id}`}
              className="block rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{organization.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {organization.model} · {organization.partner_type} ·{" "}
                    {organization.member_count} members
                  </div>
                </div>
                <div className="rounded-full bg-muted px-2 py-1 text-xs">
                  {organization.status}
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
