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
import { reuploadBoothTemplateAsset } from "@/lib/tradexpo/actions/booth-templates"
import { updateModelAssetStatus } from "@/lib/tradexpo/actions/model-assets"
import type { BoothTemplate, ModelAsset } from "@/lib/tradexpo/types"
import { getAssetMap } from "@/lib/tradexpo/utils"

function assetStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ready") return "default"
  if (status === "failed") return "destructive"
  if (status === "processing" || status === "pending") return "secondary"
  return "outline"
}

export function BoothTemplateDetailManager({
  initialTemplate,
  initialAssets,
}: {
  initialTemplate: BoothTemplate
  initialAssets: ModelAsset[]
}) {
  const [assets, setAssets] = React.useState<ModelAsset[]>(() =>
    initialAssets.map((a) => ({ ...a })),
  )
  const [template, setTemplate] = React.useState<BoothTemplate>(() => ({
    ...initialTemplate,
    translations: initialTemplate.translations.map((tr) => ({ ...tr })),
  }))
  const [notice, setNotice] = React.useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const assetMap = React.useMemo(() => getAssetMap(assets), [assets])

  const scheduleAssetProcessing = React.useCallback(
    (assetId: string) => {
      const scope = { type: "booth" as const, templateId: template.id }
      window.setTimeout(() => {
        void updateModelAssetStatus(assetId, "processing", scope)
          .then((updated) => {
            setAssets((current) =>
              current.map((item) => (item.id === assetId ? updated : item)),
            )
          })
          .catch(() => {
            setNotice({
              type: "error",
              text: "Could not update asset to processing.",
            })
          })
      }, 600)
      window.setTimeout(() => {
        void updateModelAssetStatus(assetId, "ready", scope)
          .then((updated) => {
            setAssets((current) =>
              current.map((item) => (item.id === assetId ? updated : item)),
            )
          })
          .catch(() => {
            setNotice({
              type: "error",
              text: "Could not finalize asset processing.",
            })
          })
      }, 2100)
    },
    [template.id],
  )

  async function handleReuploadAsset(kind: "glb" | "thumbnail" | "blend") {
    try {
      const { asset, templateFields } = await reuploadBoothTemplateAsset(
        template.id,
        kind,
      )
      setAssets((current) => [asset, ...current])
      setTemplate((current) => ({ ...current, ...templateFields }))
      setNotice({
        type: "success",
        text: `Re-uploading ${kind} asset. Processing...`,
      })
      scheduleAssetProcessing(asset.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Re-upload failed"
      setNotice({ type: "error", text: message })
    }
  }

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
