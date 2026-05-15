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
  TableRow
} from "@/components/ui/table"
import { reuploadBoothTemplateAsset } from "@/lib/tradexpo/actions/booth-templates"
import { updateModelAssetStatus } from "@/lib/tradexpo/actions/model-assets"
import type { BoothTemplate, ModelAsset } from "@/lib/tradexpo/types"
import { getAssetMap } from "@/lib/tradexpo/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card"

function assetStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ready") return "default"
  if (status === "failed") return "destructive"
  if (status === "processing" || status === "pending") return "secondary"
  return "outline"
}

export function BoothTemplateDetailManager({
  initialTemplate,
  initialAssets
}: {
  initialTemplate: BoothTemplate
  initialAssets: ModelAsset[]
}) {
  const [assets, setAssets] = React.useState<ModelAsset[]>(() =>
    initialAssets.map((a) => ({ ...a }))
  )
  const [template, setTemplate] = React.useState<BoothTemplate>(initialTemplate)
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
              current.map((item) => (item.id === assetId ? updated : item))
            )
          })
          .catch(() => {
            setNotice({
              type: "error",
              text: "Could not update asset to processing."
            })
          })
      }, 600)
      window.setTimeout(() => {
        void updateModelAssetStatus(assetId, "ready", scope)
          .then((updated) => {
            setAssets((current) =>
              current.map((item) => (item.id === assetId ? updated : item))
            )
          })
          .catch(() => {
            setNotice({
              type: "error",
              text: "Could not finalize asset processing."
            })
          })
      }, 2100)
    },
    [template.id]
  )

  async function handleReuploadAsset(kind: "glb" | "thumbnail" | "blend") {
    try {
      const { asset, templateFields } = await reuploadBoothTemplateAsset(
        template.id,
        kind
      )
      setAssets((current) => [asset, ...current])
      setTemplate((current) => ({ ...current, ...templateFields }))
      setNotice({
        type: "success",
        text: `Re-uploading ${kind} asset. Processing...`
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
      required: true
    },
    {
      label: "Thumbnail",
      asset: thumbAsset,
      kind: "thumbnail" as const,
      required: true
    },
    ...(blendAsset
      ? [
          {
            label: "Source Blender File",
            asset: blendAsset,
            kind: "blend" as const,
            required: false
          }
        ]
      : [])
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Status</CardTitle>
        <CardDescription>{assets.length} assets</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {assetRows.map(({ label, asset, kind, required }) => (
              <TableRow key={kind}>
                <TableCell className="font-medium">
                  {label}
                  {required ? (
                    <span className="ml-1 text-red-500">*</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {asset?.fileName ?? "—"}
                </TableCell>
                <TableCell>
                  {asset ? (
                    <Badge variant="secondary" className="capitalize">
                      {asset.status}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Missing
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
