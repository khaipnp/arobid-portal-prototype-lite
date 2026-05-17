"use client"

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

type MiniSiteRow = {
  id: string
  version_label: string
  status: string
  reject_reason: string | null
  updated_at: string
}

export function PartnerMiniSiteReview({
  partnerOrgId,
  versions
}: {
  partnerOrgId: string
  versions: MiniSiteRow[]
}) {
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [errorById, setErrorById] = useState<Record<string, string>>({})

  async function review(
    miniSiteId: string,
    decision: "published" | "rejected"
  ) {
    const reason = reasonById[miniSiteId]?.trim() ?? ""
    if (decision === "rejected" && reason.length === 0) {
      setErrorById((current) => ({
        ...current,
        [miniSiteId]: "Reject reason is required."
      }))
      return
    }

    setErrorById((current) => ({ ...current, [miniSiteId]: "" }))
    try {
      const response = await fetch(
        `/api/admin/partners/${partnerOrgId}/mini-site/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            miniSiteId,
            decision,
            reason
          })
        }
      )
      if (!response.ok) {
        setErrorById((current) => ({
          ...current,
          [miniSiteId]: "Could not review mini-site version."
        }))
        return
      }
      window.location.reload()
    } catch {
      setErrorById((current) => ({
        ...current,
        [miniSiteId]: "Could not reach review service."
      }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mini-site Review</CardTitle>
        <CardDescription>
          Publish or reject submitted Tenant mini-site versions. Partners cannot
          self-publish.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {versions.map((version) => (
          <div key={version.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{version.version_label}</div>
                <div className="text-muted-foreground text-sm">
                  {version.status} ·{" "}
                  {new Date(version.updated_at).toLocaleString()}
                </div>
                {version.reject_reason ? (
                  <div className="mt-2 text-destructive text-sm">
                    {version.reject_reason}
                  </div>
                ) : null}
                {errorById[version.id] ? (
                  <div className="mt-2 text-destructive text-sm">
                    {errorById[version.id]}
                  </div>
                ) : null}
              </div>
              {version.status === "submitted" ? (
                <div className="flex min-w-80 items-center gap-2">
                  <Input
                    placeholder="Reject reason"
                    value={reasonById[version.id] ?? ""}
                    onChange={(event) =>
                      setReasonById((current) => ({
                        ...current,
                        [version.id]: event.target.value
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    disabled={!reasonById[version.id]?.trim()}
                    onClick={() => review(version.id, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => review(version.id, "published")}>
                    Publish
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
