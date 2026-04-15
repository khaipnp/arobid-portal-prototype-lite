"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockAssets, mockBoothTemplates } from "@/lib/tradexpo/mock-data"
import type { BoothTemplate, ModelAsset } from "@/lib/tradexpo/types"
import { createMockId, getAssetMap } from "@/lib/tradexpo/utils"

function cloneTemplate(id: string): BoothTemplate | undefined {
  const found = mockBoothTemplates.find((t) => t.id === id)
  if (!found) return undefined
  return { ...found, translations: found.translations.map((tr) => ({ ...tr })) }
}

function cloneAssets(): ModelAsset[] {
  return mockAssets.map((a) => ({ ...a }))
}

function assetStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ready") return "default"
  if (status === "failed") return "destructive"
  if (status === "processing" || status === "pending") return "secondary"
  return "outline"
}

export function BoothTemplateDetailManager({
  templateId,
}: {
  templateId: string
}) {
  const [assets, setAssets] = React.useState<ModelAsset[]>(cloneAssets)
  const [template, setTemplate] = React.useState<BoothTemplate | undefined>(
    () => cloneTemplate(templateId),
  )
  const [notice, setNotice] = React.useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const assetMap = React.useMemo(() => getAssetMap(assets), [assets])

  const scheduleAssetProcessing = React.useCallback((asset: ModelAsset) => {
    window.setTimeout(() => {
      setAssets((current) =>
        current.map((item) =>
          item.id === asset.id ? { ...item, status: "processing" } : item,
        ),
      )
    }, 600)
    window.setTimeout(() => {
      setAssets((current) =>
        current.map((item) =>
          item.id === asset.id ? { ...item, status: "ready" } : item,
        ),
      )
    }, 2100)
  }, [])

  function handleReuploadAsset(kind: "glb" | "thumbnail" | "blend") {
    if (!template) return

    const newAsset: ModelAsset = {
      id: createMockId("asset"),
      fileName: `re-upload-${kind}.${kind === "thumbnail" ? "png" : kind}`,
      kind,
      status: "pending",
      fileUrl: `https://picsum.photos/seed/${createMockId("preview")}/640/360`,
      createdAt: new Date().toISOString(),
    }

    setAssets((current) => [newAsset, ...current])
    scheduleAssetProcessing(newAsset)

    setTemplate((current) => {
      if (!current) return current
      return {
        ...current,
        ...(kind === "glb" ? { renderGlbAssetId: newAsset.id } : {}),
        ...(kind === "thumbnail" ? { thumbnailAssetId: newAsset.id } : {}),
        ...(kind === "blend" ? { sourceBlendAssetId: newAsset.id } : {}),
        updatedAt: new Date().toISOString(),
        updatedBy: "Khai Pham",
      }
    })

    setNotice({
      type: "success",
      text: `Re-uploading ${kind} asset. Processing...`,
    })
  }

  if (!template) return null

  const glbAsset = assetMap[template.renderGlbAssetId]
  const thumbAsset = assetMap[template.thumbnailAssetId]
  const blendAsset = template.sourceBlendAssetId
    ? assetMap[template.sourceBlendAssetId]
    : undefined

  const assetRows = [
    {
      label: "GLB Render File",
      asset: glbAsset,
      kind: "glb" as const,
      required: true,
    },
    {
      label: "Thumbnail",
      asset: thumbAsset,
      kind: "thumbnail" as const,
      required: true,
    },
    ...(blendAsset
      ? [
          {
            label: "Source Blender File",
            asset: blendAsset,
            kind: "blend" as const,
            required: false,
          },
        ]
      : []),
  ]

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold text-base">Asset Status</h2>
      <p className="mt-0.5 text-muted-foreground text-sm">
        Template can only be published when GLB and thumbnail are ready.
      </p>

      {notice ? (
        <p
          className={
            notice.type === "error"
              ? "mt-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-rose-700 text-sm"
              : "mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm"
          }
        >
          {notice.text}
        </p>
      ) : null}

      <div className="mt-3 rounded-md border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assetRows.map(({ label, asset, kind, required }) => (
              <TableRow key={kind}>
                <TableCell className="font-medium">
                  {label}
                  {required ? (
                    <span className="ml-1 text-rose-500">*</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {asset?.fileName ?? "—"}
                </TableCell>
                <TableCell>
                  {asset ? (
                    <Badge variant={assetStatusVariant(asset.status)}>
                      {asset.status}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      missing
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {asset?.status === "failed" ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleReuploadAsset(kind)}
                    >
                      Re-upload
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
