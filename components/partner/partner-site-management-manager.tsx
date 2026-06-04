"use client"

import { EditIcon, PlusIcon, Trash2Icon } from "lucide-react"
import Image from "next/image"
import { type ReactNode, useEffect, useId, useState } from "react"
import {
  emptyRelationForm,
  initialBranding,
  initialRelations,
  initialSectionMedia,
  initialSections
} from "@/components/partner/site-preview/constants"
import { SiteLivePreview } from "@/components/partner/site-preview/site-live-preview"
import { SitePreviewControls } from "@/components/partner/site-preview/site-preview-controls"
import type {
  RelationForm,
  SiteBranding,
  SiteMediaKey,
  SiteSectionKey,
  SiteSectionMedia,
  TenantRelation,
  TenantRelationType
} from "@/components/partner/site-preview/types"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useUpload } from "@/hooks/use-upload"
import type { PartnerAccess } from "@/lib/partner/access"
import { cn } from "@/lib/utils"
import { ButtonGroup } from "../ui/button-group"

const logoMaxSizeBytes = 2 * 1024 * 1024
const sectionMediaMaxSizeBytes = 2 * 1024 * 1024
const hexColorPattern = /^#[0-9a-fA-F]{6}$/

export function PartnerSiteManagementManager({
  access
}: {
  access: PartnerAccess
}) {
  const [branding, setBranding] = useState(initialBranding)
  const [sections, setSections] = useState(initialSections)
  const [sectionMedia, setSectionMedia] = useState(initialSectionMedia)
  const [relations, setRelations] = useState(initialRelations)
  const [editingRelation, setEditingRelation] = useState<TenantRelation | null>(
    null
  )
  const [form, setForm] = useState<RelationForm>(emptyRelationForm)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TenantRelation | null>(null)
  const { uploadFile, isUploading } = useUpload()
  const [draftId, setDraftId] = useState<string | null>(null)
  const [versionStatus, setVersionStatus] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [submitNote, setSubmitNote] = useState("")

  const previewLabel = getPreviewLabel(versionStatus)
  const isSubmitted = versionStatus === "submitted"
  const isReadOnly = access.readOnly || isSubmitted
  const canSubmitRelation = form.name.trim().length > 0

  useEffect(() => {
    let isMounted = true

    async function loadPreviewVersion() {
      const response = await fetch("/api/partner/mini-site/preview")
      if (!response.ok) return
      const payload = (await response.json()) as {
        version: {
          id: string
          status: string
          content?: {
            branding?: SiteBranding
            relations?: TenantRelation[]
            sectionMedia?: SiteSectionMedia
            sections?: Record<SiteSectionKey, boolean>
          }
        } | null
      }
      if (!isMounted || !payload.version) return
      setDraftId(payload.version.id)
      setVersionStatus(payload.version.status)
      if (payload.version.content?.branding) {
        setBranding(payload.version.content.branding)
      }
      if (payload.version.content?.relations) {
        setRelations(payload.version.content.relations)
      }
      if (payload.version.content?.sectionMedia) {
        setSectionMedia({
          ...initialSectionMedia,
          ...payload.version.content.sectionMedia
        })
      }
      if (payload.version.content?.sections) {
        setSections(payload.version.content.sections)
      }
    }

    loadPreviewVersion()

    return () => {
      isMounted = false
    }
  }, [])

  function updateBranding<Key extends keyof SiteBranding>(
    key: Key,
    value: SiteBranding[Key]
  ) {
    if (
      (key === "primaryColor" || key === "accentColor") &&
      !hexColorPattern.test(value)
    ) {
      return
    }

    setBranding((current) => ({ ...current, [key]: value }))
  }

  function toggleSection(key: SiteSectionKey) {
    setSections((current) => ({ ...current, [key]: !current[key] }))
  }

  function updateSectionMedia(key: SiteMediaKey, index: number, value: string) {
    setSectionMedia((current) => {
      const nextValues = [...(current[key] ?? [])]
      nextValues[index] = value
      return { ...current, [key]: nextValues }
    })
  }

  async function uploadLogo(file: File) {
    if (!file.type.startsWith("image/") || file.size > logoMaxSizeBytes) return

    const result = await uploadFile(file, "image")
    if (result?.fileUrl) updateBranding("logoUrl", result.fileUrl)
  }

  async function uploadSectionMedia(
    key: SiteMediaKey,
    index: number,
    file: File
  ) {
    if (
      !file.type.startsWith("image/") ||
      file.size > sectionMediaMaxSizeBytes
    ) {
      return
    }

    const result = await uploadFile(file, "image")
    if (result?.fileUrl) updateSectionMedia(key, index, result.fileUrl)
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

  async function saveDraft() {
    if (isReadOnly) return
    setIsSavingDraft(true)
    setStatusMessage(null)
    try {
      const response = await fetch("/api/partner/mini-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { branding, relations, sectionMedia, sections }
        })
      })
      if (!response.ok) {
        setStatusMessage("Could not save mini-site draft.")
        return
      }
      const result = (await response.json()) as { id: string; status: string }
      setDraftId(result.id)
      setVersionStatus(result.status)
      setStatusMessage("Draft saved.")
    } finally {
      setIsSavingDraft(false)
    }
  }

  async function submitDraft() {
    if (isReadOnly || !draftId) return
    setIsSavingDraft(true)
    setStatusMessage(null)
    try {
      const response = await fetch("/api/partner/mini-site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ miniSiteId: draftId, submitNote })
      })
      if (response.ok) {
        setVersionStatus("submitted")
        setSubmitDialogOpen(false)
        setSubmitNote("")
        setStatusMessage("Draft submitted for Admin review.")
      } else {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        setStatusMessage(payload?.error ?? "Could not submit mini-site draft.")
      }
    } finally {
      setIsSavingDraft(false)
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{previewLabel}</Badge>
            {access.readOnly ? (
              <Badge variant="outline">Read-only role</Badge>
            ) : null}
            {isSubmitted ? <Badge variant="outline">Submitted</Badge> : null}
          </div>

          {statusMessage ? (
            <p className="text-muted-foreground text-sm">{statusMessage}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonGroup>
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
              Preview
            </Button>
            <Button
              disabled={isReadOnly || isSavingDraft}
              variant="outline"
              onClick={saveDraft}
            >
              Save Draft
            </Button>
          </ButtonGroup>

          <Button
            disabled={isReadOnly || isSavingDraft || !draftId}
            onClick={() => setSubmitDialogOpen(true)}
          >
            Submit for review
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <SitePreviewControls
          branding={branding}
          isReadOnly={isReadOnly}
          isUploadingLogo={isUploading}
          isUploadingMedia={isUploading}
          sectionMedia={sectionMedia}
          sections={sections}
          onBrandingChange={updateBranding}
          onRemoveLogo={removeLogo}
          onSectionMediaChange={updateSectionMedia}
          onSectionToggle={toggleSection}
          onUploadLogo={uploadLogo}
          onUploadSectionMedia={uploadSectionMedia}
        />
        <RelationsCard
          relations={relations}
          isReadOnly={isReadOnly}
          onCreate={openCreateDialog}
          onEdit={openEditDialog}
          onDelete={setDeleteTarget}
        />
      </section>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="h-screen max-h-none w-screen overflow-hidden rounded-none sm:max-w-screen">
          <DialogHeader>
            <DialogTitle>Live preview</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-y-auto">
            <SiteLivePreview
              branding={branding}
              relations={relations}
              sectionMedia={sectionMedia}
              sections={sections}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit mini-site for review?</DialogTitle>
            <DialogDescription>
              Arobid Admin reviews this saved version before publishing. Current
              live mini-site remains unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Submit note</Label>
            <Input
              value={submitNote}
              onChange={(event) => setSubmitNote(event.target.value)}
              placeholder="Optional note for Arobid Admin"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={isSavingDraft} onClick={submitDraft}>
              {isSavingDraft ? "Submitting..." : "Confirm submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RelationDialog
        form={form}
        isOpen={isDialogOpen}
        isEditing={Boolean(editingRelation)}
        isReadOnly={isReadOnly}
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
            <AlertDialogAction
              disabled={access.readOnly}
              onClick={deleteRelation}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function getPreviewLabel(status: string | null) {
  if (status === "draft") return "Draft Preview"
  if (status === "submitted") return "Submitted Preview"
  if (status === "rejected") return "Rejected Preview"
  if (status === "draft_update") return "Draft Update Preview"
  if (status === "published") return "Published Preview"
  return "New Draft Preview"
}

function RelationsCard({
  isReadOnly,
  relations,
  onCreate,
  onEdit,
  onDelete
}: {
  isReadOnly: boolean
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
            <CardTitle>Partners & sponsors</CardTitle>
          </div>
          <Button
            size="sm"
            className="rounded-full"
            disabled={isReadOnly}
            onClick={onCreate}
          >
            <PlusIcon />
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
                        disabled={isReadOnly}
                        onClick={() => onEdit(relation)}
                      >
                        <EditIcon className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="icon"
                        type="button"
                        variant="ghost"
                        disabled={isReadOnly}
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

function RelationDialog({
  form,
  isOpen,
  isEditing,
  isReadOnly,
  canSubmit,
  onChange,
  onOpenChange,
  onSubmit
}: {
  form: RelationForm
  isOpen: boolean
  isEditing: boolean
  isReadOnly: boolean
  canSubmit: boolean
  onChange: (form: RelationForm) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}) {
  const baseId = useId()
  const nameId = `${baseId}-name`
  const typeId = `${baseId}-type`
  const tierId = `${baseId}-tier`
  const logoUrlId = `${baseId}-logo-url`
  const websiteUrlId = `${baseId}-website-url`
  const activeId = `${baseId}-active`

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
          <Field htmlFor={nameId} label="Name">
            <Input
              disabled={isReadOnly}
              id={nameId}
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor={typeId} label="Type">
              <NativeSelect
                disabled={isReadOnly}
                id={typeId}
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
            <Field htmlFor={tierId} label="Tier">
              <Input
                disabled={isReadOnly}
                id={tierId}
                value={form.tier}
                onChange={(event) =>
                  onChange({ ...form, tier: event.target.value })
                }
              />
            </Field>
          </div>
          <Field htmlFor={logoUrlId} label="Logo URL">
            <Input
              disabled={isReadOnly}
              id={logoUrlId}
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(event) =>
                onChange({ ...form, logoUrl: event.target.value })
              }
            />
          </Field>
          <Field htmlFor={websiteUrlId} label="Website URL">
            <Input
              disabled={isReadOnly}
              id={websiteUrlId}
              placeholder="https://..."
              value={form.websiteUrl}
              onChange={(event) =>
                onChange({ ...form, websiteUrl: event.target.value })
              }
            />
          </Field>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-1">
              <Label htmlFor={activeId}>Show on homepage</Label>
              <p className="text-muted-foreground text-sm">
                Hidden entries stay in the list but do not render in preview.
              </p>
            </div>
            <Switch
              checked={form.active}
              disabled={isReadOnly}
              id={activeId}
              onCheckedChange={(active) => onChange({ ...form, active })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isReadOnly || !canSubmit} onClick={onSubmit}>
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
  htmlFor,
  label
}: {
  children: ReactNode
  className?: string
  htmlFor?: string
  label: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function LogoThumb({ relation }: { relation: TenantRelation }) {
  if (relation.logoUrl) {
    return (
      <Image
        alt={`${relation.name} ${relation.type} logo`}
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
