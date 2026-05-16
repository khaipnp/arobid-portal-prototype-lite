"use client"

import {
  EditIcon,
  EyeIcon,
  GlobeIcon,
  ImageIcon,
  LayoutTemplateIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon
} from "lucide-react"
import Image from "next/image"
import { type ReactNode, useMemo, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
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
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useUpload } from "@/hooks/use-upload"
import type { PartnerAccess } from "@/lib/partner/access"
import { cn } from "@/lib/utils"

type SiteBranding = {
  tenantName: string
  tagline: string
  logoUrl: string
  primaryColor: string
  accentColor: string
}

type HomepageSections = {
  hero: boolean
  featuredExpos: boolean
  exhibitorCategories: boolean
  partners: boolean
  sponsors: boolean
  contactCta: boolean
}

type TenantRelationType = "partner" | "sponsor"

type TenantRelation = {
  id: string
  name: string
  type: TenantRelationType
  tier: string
  logoUrl: string
  websiteUrl: string
  active: boolean
}

type RelationForm = Omit<TenantRelation, "id">

const initialBranding: SiteBranding = {
  tenantName: "Arobid Trade Partner",
  tagline: "Your trusted gateway to digital trade exhibitions.",
  logoUrl: "",
  primaryColor: "#2563eb",
  accentColor: "#f97316"
}

const initialSections: HomepageSections = {
  hero: true,
  featuredExpos: true,
  exhibitorCategories: true,
  partners: true,
  sponsors: true,
  contactCta: true
}

const initialRelations: TenantRelation[] = [
  {
    id: "partner-viettrade",
    name: "VietTrade Connect",
    type: "partner",
    tier: "Strategic Partner",
    logoUrl: "",
    websiteUrl: "https://example.com/viettrade",
    active: true
  },
  {
    id: "sponsor-logistics",
    name: "Asean Logistics Group",
    type: "sponsor",
    tier: "Gold Sponsor",
    logoUrl: "",
    websiteUrl: "https://example.com/logistics",
    active: true
  },
  {
    id: "sponsor-finance",
    name: "Trade Finance Hub",
    type: "sponsor",
    tier: "Silver Sponsor",
    logoUrl: "",
    websiteUrl: "https://example.com/finance",
    active: false
  }
]

const sectionOptions: Array<{
  key: keyof HomepageSections
  title: string
  description: string
}> = [
  {
    key: "hero",
    title: "Hero banner",
    description: "Tenant intro, logo, tagline, and primary CTA."
  },
  {
    key: "featuredExpos",
    title: "Featured expos",
    description: "Highlight active and upcoming exhibition programs."
  },
  {
    key: "exhibitorCategories",
    title: "Exhibitor categories",
    description: "Show key industries and exhibitor discovery paths."
  },
  {
    key: "partners",
    title: "Partners",
    description: "Display active partner organizations."
  },
  {
    key: "sponsors",
    title: "Sponsors",
    description: "Display active sponsors by tier."
  },
  {
    key: "contactCta",
    title: "Contact CTA",
    description: "Show the inquiry block for tenant operations."
  }
]

const emptyRelationForm: RelationForm = {
  name: "",
  type: "partner",
  tier: "Strategic Partner",
  logoUrl: "",
  websiteUrl: "",
  active: true
}

export function PartnerSiteManagementManager({
  access
}: {
  access: PartnerAccess
}) {
  const [branding, setBranding] = useState(initialBranding)
  const [sections, setSections] = useState(initialSections)
  const [relations, setRelations] = useState(initialRelations)
  const [editingRelation, setEditingRelation] = useState<TenantRelation | null>(
    null
  )
  const [form, setForm] = useState<RelationForm>(emptyRelationForm)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TenantRelation | null>(null)
  const { uploadFile, isUploading } = useUpload()

  const activePartners = useMemo(
    () =>
      relations.filter(
        (relation) => relation.active && relation.type === "partner"
      ),
    [relations]
  )
  const activeSponsors = useMemo(
    () =>
      relations.filter(
        (relation) => relation.active && relation.type === "sponsor"
      ),
    [relations]
  )
  const activeSectionCount = Object.values(sections).filter(Boolean).length
  const canSubmitRelation = form.name.trim().length > 0

  function updateBranding<Key extends keyof SiteBranding>(
    key: Key,
    value: SiteBranding[Key]
  ) {
    setBranding((current) => ({ ...current, [key]: value }))
  }

  function toggleSection(key: keyof HomepageSections) {
    setSections((current) => ({ ...current, [key]: !current[key] }))
  }

  async function uploadLogo(file: File) {
    const result = await uploadFile(file, "image")
    if (result) updateBranding("logoUrl", result.fileUrl)
  }

  function removeLogo() {
    updateBranding("logoUrl", "")
  }

  function openCreateDialog() {
    setEditingRelation(null)
    setForm(emptyRelationForm)
    setIsDialogOpen(true)
  }

  function openEditDialog(relation: TenantRelation) {
    setEditingRelation(relation)
    setForm({
      name: relation.name,
      type: relation.type,
      tier: relation.tier,
      logoUrl: relation.logoUrl,
      websiteUrl: relation.websiteUrl,
      active: relation.active
    })
    setIsDialogOpen(true)
  }

  function saveRelation() {
    if (!canSubmitRelation) return
    if (editingRelation) {
      setRelations((current) =>
        current.map((relation) =>
          relation.id === editingRelation.id
            ? { ...relation, ...form }
            : relation
        )
      )
    } else {
      setRelations((current) => [
        ...current,
        {
          ...form,
          id: `relation-${Date.now()}`
        }
      ])
    }
    setIsDialogOpen(false)
  }

  function deleteRelation() {
    if (!deleteTarget) return
    setRelations((current) =>
      current.filter((relation) => relation.id !== deleteTarget.id)
    )
    setDeleteTarget(null)
  }

  function resetDemo() {
    setBranding(initialBranding)
    setSections(initialSections)
    setRelations(initialRelations)
  }

  return (
    <div className="space-y-4 px-4">
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Demo local</Badge>
              {access.readOnly ? (
                <Badge variant="outline">Read-only role</Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              Changes update the preview only and reset when the page reloads.
            </p>
          </div>
          <Button variant="outline" onClick={resetDemo}>
            <RefreshCwIcon className="size-4" />
            Reset demo
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <BrandingCard
            branding={branding}
            isUploadingLogo={isUploading}
            onChange={updateBranding}
            onRemoveLogo={removeLogo}
            onUploadLogo={uploadLogo}
          />
          <SectionsCard sections={sections} onToggle={toggleSection} />
          <RelationsCard
            relations={relations}
            onCreate={openCreateDialog}
            onEdit={openEditDialog}
            onDelete={setDeleteTarget}
          />
        </div>

        <PreviewCard
          branding={branding}
          sections={sections}
          activePartners={activePartners}
          activeSponsors={activeSponsors}
          activeSectionCount={activeSectionCount}
        />
      </section>

      <RelationDialog
        form={form}
        isOpen={isDialogOpen}
        isEditing={Boolean(editingRelation)}
        canSubmit={canSubmitRelation}
        onChange={setForm}
        onOpenChange={setIsDialogOpen}
        onSubmit={saveRelation}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete relation?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget?.name} from the local demo list and
              live preview.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteRelation}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function BrandingCard({
  branding,
  isUploadingLogo,
  onChange,
  onRemoveLogo,
  onUploadLogo
}: {
  branding: SiteBranding
  isUploadingLogo: boolean
  onChange: <Key extends keyof SiteBranding>(
    key: Key,
    value: SiteBranding[Key]
  ) => void
  onRemoveLogo: () => void
  onUploadLogo: (file: File) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-5" />
          Branding
        </CardTitle>
        <CardDescription>
          Configure logo, color palette, tenant name, and homepage copy.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <Field label="Tenant name">
          <Input
            value={branding.tenantName}
            onChange={(event) => onChange("tenantName", event.target.value)}
          />
        </Field>
        <LogoUploadField
          branding={branding}
          isUploading={isUploadingLogo}
          onRemove={onRemoveLogo}
          onUpload={onUploadLogo}
        />
        <Field className="lg:col-span-2" label="Tagline">
          <Textarea
            rows={3}
            value={branding.tagline}
            onChange={(event) => onChange("tagline", event.target.value)}
          />
        </Field>
        <ColorField
          label="Primary color"
          value={branding.primaryColor}
          onChange={(value) => onChange("primaryColor", value)}
        />
        <ColorField
          label="Accent color"
          value={branding.accentColor}
          onChange={(value) => onChange("accentColor", value)}
        />
      </CardContent>
    </Card>
  )
}

function LogoUploadField({
  branding,
  isUploading,
  onRemove,
  onUpload
}: {
  branding: SiteBranding
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
              alt=""
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
          <Button asChild disabled={isUploading} variant="outline">
            <Label className="cursor-pointer">
              {isUploading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ImageIcon className="size-4" />
              )}
              {isUploading ? "Uploading" : "Upload"}
              <Input
                accept="image/*"
                className="hidden"
                disabled={isUploading}
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
            <Button disabled={isUploading} variant="ghost" onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SectionsCard({
  sections,
  onToggle
}: {
  sections: HomepageSections
  onToggle: (key: keyof HomepageSections) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutTemplateIcon className="size-5" />
          Homepage sections
        </CardTitle>
        <CardDescription>
          Turn tenant homepage modules on or off for the live preview.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {sectionOptions.map((section) => (
          <div
            className="flex items-start justify-between gap-4 rounded-lg border p-3"
            key={section.key}
          >
            <div className="space-y-1">
              <Label>{section.title}</Label>
              <p className="text-muted-foreground text-sm">
                {section.description}
              </p>
            </div>
            <Switch
              checked={sections[section.key]}
              onCheckedChange={() => onToggle(section.key)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RelationsCard({
  relations,
  onCreate,
  onEdit,
  onDelete
}: {
  relations: TenantRelation[]
  onCreate: () => void
  onEdit: (relation: TenantRelation) => void
  onDelete: (relation: TenantRelation) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GlobeIcon className="size-5" />
              Partners & sponsors
            </CardTitle>
            <CardDescription>
              Manage tenant homepage partner and sponsor entries locally.
            </CardDescription>
          </div>
          <Button onClick={onCreate}>
            <PlusIcon className="size-4" />
            Add entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relations.map((relation) => (
                <TableRow key={relation.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <LogoThumb relation={relation} />
                      <div className="min-w-0">
                        <div className="font-medium">{relation.name}</div>
                        <div className="truncate text-muted-foreground text-xs">
                          {relation.websiteUrl || "No website URL"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{relation.type}</Badge>
                  </TableCell>
                  <TableCell>{relation.tier}</TableCell>
                  <TableCell>
                    <Badge variant={relation.active ? "default" : "secondary"}>
                      {relation.active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        type="button"
                        variant="ghost"
                        onClick={() => onEdit(relation)}
                      >
                        <EditIcon className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="icon"
                        type="button"
                        variant="ghost"
                        onClick={() => onDelete(relation)}
                      >
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewCard({
  branding,
  sections,
  activePartners,
  activeSponsors,
  activeSectionCount
}: {
  branding: SiteBranding
  sections: HomepageSections
  activePartners: TenantRelation[]
  activeSponsors: TenantRelation[]
  activeSectionCount: number
}) {
  return (
    <Card className="sticky top-4 h-fit overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeIcon className="size-5" />
          Live preview
        </CardTitle>
        <CardDescription>
          Tenant homepage mock using local configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          {sections.hero ? (
            <div
              className="space-y-5 p-5 text-white"
              style={{
                background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})`
              }}
            >
              <div className="flex items-center gap-3">
                <PreviewLogo branding={branding} />
                <div>
                  <div className="font-semibold">{branding.tenantName}</div>
                  <div className="text-white/75 text-xs">Tenant homepage</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-2xl leading-tight">
                  Build stronger trade connections
                </h3>
                <p className="text-sm text-white/85">{branding.tagline}</p>
              </div>
              <Button size="sm" variant="secondary">
                Explore tenant expos
              </Button>
            </div>
          ) : null}

          <div className="space-y-3 p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <PreviewMetric label="Sections" value={activeSectionCount} />
              <PreviewMetric label="Partners" value={activePartners.length} />
              <PreviewMetric label="Sponsors" value={activeSponsors.length} />
            </div>

            {sections.featuredExpos ? (
              <PreviewBlock title="Featured expos">
                <div className="grid gap-2">
                  {[
                    "Vietnam Manufacturing Online Expo",
                    "ASEAN Food Supply Week"
                  ].map((expo) => (
                    <div
                      className="rounded-lg border bg-muted/30 p-3 text-sm"
                      key={expo}
                    >
                      {expo}
                    </div>
                  ))}
                </div>
              </PreviewBlock>
            ) : null}

            {sections.exhibitorCategories ? (
              <PreviewBlock title="Exhibitor categories">
                <div className="flex flex-wrap gap-2">
                  {[
                    "Manufacturing",
                    "Food & Beverage",
                    "Logistics",
                    "Finance"
                  ].map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </PreviewBlock>
            ) : null}

            {sections.partners ? (
              <RelationPreview title="Partners" relations={activePartners} />
            ) : null}

            {sections.sponsors ? (
              <RelationPreview title="Sponsors" relations={activeSponsors} />
            ) : null}

            {sections.contactCta ? (
              <div className="rounded-xl border p-4 text-center">
                <div className="font-medium">Need tenant support?</div>
                <p className="text-muted-foreground text-xs">
                  Contact the partner operations team for expo onboarding.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RelationDialog({
  form,
  isOpen,
  isEditing,
  canSubmit,
  onChange,
  onOpenChange,
  onSubmit
}: {
  form: RelationForm
  isOpen: boolean
  isEditing: boolean
  canSubmit: boolean
  onChange: (form: RelationForm) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit entry" : "Add entry"}</DialogTitle>
          <DialogDescription>
            Entries appear in the local homepage preview when active.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <NativeSelect
                value={form.type}
                onChange={(event) =>
                  onChange({
                    ...form,
                    type: event.target.value as TenantRelationType
                  })
                }
              >
                <option value="partner">Partner</option>
                <option value="sponsor">Sponsor</option>
              </NativeSelect>
            </Field>
            <Field label="Tier">
              <Input
                value={form.tier}
                onChange={(event) =>
                  onChange({ ...form, tier: event.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Logo URL">
            <Input
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(event) =>
                onChange({ ...form, logoUrl: event.target.value })
              }
            />
          </Field>
          <Field label="Website URL">
            <Input
              placeholder="https://..."
              value={form.websiteUrl}
              onChange={(event) =>
                onChange({ ...form, websiteUrl: event.target.value })
              }
            />
          </Field>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-1">
              <Label>Show on homepage</Label>
              <p className="text-muted-foreground text-sm">
                Hidden entries stay in the list but do not render in preview.
              </p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(active) => onChange({ ...form, active })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={onSubmit}>
            {isEditing ? "Save changes" : "Add entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  children,
  className,
  label
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <Input
          className="h-10 w-14 p-1"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Field>
  )
}

function LogoThumb({ relation }: { relation: TenantRelation }) {
  if (relation.logoUrl) {
    return (
      <Image
        alt=""
        className="size-10 rounded-md border object-cover"
        height={40}
        src={relation.logoUrl}
        width={40}
      />
    )
  }

  return (
    <div className="flex size-10 items-center justify-center rounded-md border bg-muted font-medium text-xs uppercase">
      {relation.name.slice(0, 2)}
    </div>
  )
}

function PreviewLogo({ branding }: { branding: SiteBranding }) {
  if (branding.logoUrl) {
    return (
      <Image
        alt=""
        className="size-12 rounded-xl border border-white/25 bg-white object-cover"
        height={48}
        src={branding.logoUrl}
        width={48}
      />
    )
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-xl bg-white/15 font-semibold text-white ring-1 ring-white/25">
      {branding.tenantName.slice(0, 2)}
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="font-semibold text-lg">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  )
}

function PreviewBlock({
  children,
  title
}: {
  children: ReactNode
  title: string
}) {
  return (
    <div className="space-y-2 rounded-xl border p-3">
      <div className="font-medium text-sm">{title}</div>
      {children}
    </div>
  )
}

function RelationPreview({
  relations,
  title
}: {
  relations: TenantRelation[]
  title: string
}) {
  return (
    <PreviewBlock title={title}>
      {relations.length === 0 ? (
        <p className="text-muted-foreground text-sm">No active entries.</p>
      ) : (
        <div className="grid gap-2">
          {relations.map((relation) => (
            <div
              className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 p-2"
              key={relation.id}
            >
              <div className="flex min-w-0 items-center gap-2">
                <LogoThumb relation={relation} />
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">
                    {relation.name}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {relation.tier}
                  </div>
                </div>
              </div>
              <Badge variant="outline">{relation.type}</Badge>
            </div>
          ))}
        </div>
      )}
    </PreviewBlock>
  )
}
