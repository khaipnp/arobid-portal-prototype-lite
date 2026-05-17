"use client"

import { useState } from "react"
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

type MiniSiteRow = {
  id: string
  version_label: string
  status: string
  content_json: Record<string, unknown>
  reject_reason: string | null
  submitted_at: string | null
  published_at: string | null
  updated_at: string
}

type ReviewField = {
  label: string
  current: string
  submitted: string
  changed: boolean
}

export function PartnerMiniSiteReview({
  partnerOrgId,
  publishedVersion,
  versions
}: {
  partnerOrgId: string
  publishedVersion: MiniSiteRow | null
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
        {versions.map((version) => {
          const comparison = buildReviewComparison(publishedVersion, version)

          return (
            <div key={version.id} className="rounded-lg border p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{version.version_label}</div>
                      <Badge variant="outline">{version.status}</Badge>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Updated {new Date(version.updated_at).toLocaleString()}
                      {version.submitted_at
                        ? ` · Submitted ${new Date(
                            version.submitted_at
                          ).toLocaleString()}`
                        : ""}
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

                {version.status === "submitted" ? (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="font-medium text-sm">
                        {publishedVersion
                          ? "Published vs submitted comparison"
                          : "First-publication review"}
                      </div>
                      <Badge variant="secondary">
                        {comparison.filter((field) => field.changed).length} changed
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      {comparison.map((field) => (
                        <div
                          key={field.label}
                          className="grid gap-2 rounded-md border bg-background p-3 md:grid-cols-[12rem_1fr_1fr]"
                        >
                          <div className="flex items-center gap-2 font-medium text-sm">
                            {field.label}
                            {field.changed ? <Badge>Changed</Badge> : null}
                          </div>
                          <ComparisonValue label="Published" value={field.current} />
                          <ComparisonValue label="Submitted" value={field.submitted} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ComparisonValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="whitespace-pre-wrap text-sm">{value || "—"}</div>
    </div>
  )
}

function buildReviewComparison(
  publishedVersion: MiniSiteRow | null,
  submittedVersion: MiniSiteRow
): ReviewField[] {
  const published = extractMiniSiteContent(publishedVersion?.content_json)
  const submitted = extractMiniSiteContent(submittedVersion.content_json)

  return [
    compareField("Tenant identity", published.identity, submitted.identity),
    compareField("CTA", published.cta, submitted.cta),
    compareField("Company display", published.relations, submitted.relations),
    compareField("Expo display", published.sections, submitted.sections),
    compareField("Contact info", published.contact, submitted.contact),
    compareField(
      "Service / bundle draft",
      published.serviceBundleText,
      submitted.serviceBundleText
    )
  ]
}

function compareField(
  label: string,
  current: string,
  submitted: string
): ReviewField {
  return {
    label,
    current,
    submitted,
    changed: current !== submitted
  }
}

function extractMiniSiteContent(content: Record<string, unknown> | undefined) {
  const branding = isRecord(content?.branding) ? content.branding : {}
  const sections = isRecord(content?.sections) ? content.sections : {}
  const relations = Array.isArray(content?.relations) ? content.relations : []

  return {
    identity: [
      textValue(branding.tenantName),
      textValue(branding.tagline),
      textValue(branding.logoUrl),
      textValue(branding.bannerUrl),
      textValue(branding.primaryColor),
      textValue(branding.accentColor)
    ]
      .filter(Boolean)
      .join("\n"),
    cta: textValue(branding.ctaOption),
    contact: [
      textValue(branding.publicEmail),
      textValue(branding.publicPhone),
      textValue(branding.publicAddress),
      textValue(branding.publicWebsite)
    ]
      .filter(Boolean)
      .join("\n"),
    serviceBundleText: textValue(branding.serviceBundleText),
    sections: Object.entries(sections)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key)
      .sort()
      .join(", "),
    relations: relations
      .filter(isRecord)
      .map((relation) =>
        [
          textValue(relation.name),
          textValue(relation.type),
          textValue(relation.tier),
          relation.active ? "active" : "hidden"
        ]
          .filter(Boolean)
          .join(" · ")
      )
      .join("\n")
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}
