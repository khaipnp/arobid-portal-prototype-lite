import { ImageIcon, LayoutTemplateIcon, Loader2Icon } from "lucide-react"
import Image from "next/image"
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
import { Switch } from "@/components/ui/switch"
import { sectionOptions } from "./constants"
import type { EnabledSiteSections, SiteBranding, SiteSectionKey } from "./types"

export function SitePreviewControls({
  branding,
  isReadOnly,
  isUploadingLogo,
  sections,
  onBrandingChange,
  onRemoveLogo,
  onSectionToggle,
  onUploadLogo
}: {
  branding: SiteBranding
  isReadOnly: boolean
  isUploadingLogo: boolean
  sections: EnabledSiteSections
  onBrandingChange: <Key extends keyof SiteBranding>(
    key: Key,
    value: SiteBranding[Key]
  ) => void
  onRemoveLogo: () => void
  onSectionToggle: (key: SiteSectionKey) => void
  onUploadLogo: (file: File) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Configure logo and brand colors for branded buttons, headings, and
            accents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <LogoUploadField
            branding={branding}
            isReadOnly={isReadOnly}
            isUploading={isUploadingLogo}
            onRemove={onRemoveLogo}
            onUpload={onUploadLogo}
          />
          <ColorField
            label="Primary brand color"
            disabled={isReadOnly}
            value={branding.primaryColor}
            onChange={(value) => onBrandingChange("primaryColor", value)}
          />
          <ColorField
            label="Accent brand color"
            disabled={isReadOnly}
            value={branding.accentColor}
            onChange={(value) => onBrandingChange("accentColor", value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplateIcon className="size-5" />
            Homepage sections
          </CardTitle>
          <CardDescription>
            Header, banner, Buyer Find & Match, and footer always stay visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {sectionOptions.map((section) => {
            const switchId = `section-${section.key}`

            return (
              <div
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
                key={section.key}
              >
                <div className="space-y-1">
                  <Label htmlFor={switchId}>{section.title}</Label>
                  <p className="text-muted-foreground text-sm">
                    {section.description}
                  </p>
                </div>
                <Switch
                  checked={sections[section.key]}
                  disabled={isReadOnly}
                  id={switchId}
                  onCheckedChange={() => onSectionToggle(section.key)}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function LogoUploadField({
  branding,
  isReadOnly,
  isUploading,
  onRemove,
  onUpload
}: {
  branding: SiteBranding
  isReadOnly: boolean
  isUploading: boolean
  onRemove: () => void
  onUpload: (file: File) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Logo upload</Label>
      <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {branding.logoUrl ? (
            <Image
              alt={`${branding.tenantName} logo`}
              className="size-16 object-cover"
              height={64}
              src={branding.logoUrl}
              width={64}
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium text-sm">Tenant logo</p>
          <p className="truncate text-muted-foreground text-xs">
            {branding.logoUrl || "Upload PNG, JPG, SVG, or WebP to R2."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            disabled={isReadOnly || isUploading}
            variant="outline"
          >
            <Label className="cursor-pointer" htmlFor="site-logo-upload">
              {isUploading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ImageIcon className="size-4" />
              )}
              {isUploading ? "Uploading" : "Upload"}
              <Input
                accept="image/*"
                className="hidden"
                disabled={isReadOnly || isUploading}
                id="site-logo-upload"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onUpload(file)
                  event.currentTarget.value = ""
                }}
              />
            </Label>
          </Button>
          {branding.logoUrl ? (
            <Button
              disabled={isReadOnly || isUploading}
              variant="ghost"
              onClick={onRemove}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ColorField({
  disabled,
  label,
  value,
  onChange
}: {
  disabled: boolean
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          className="h-10 w-14 p-1"
          disabled={disabled}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  )
}
