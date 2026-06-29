"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  CuboidIcon,
  EyeIcon,
  ImageIcon,
  LayoutGridIcon,
  LinkIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
  VideoIcon,
  XIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CharacterCount } from "@/components/ui/character-count"
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
import { Separator } from "@/components/ui/separator"
import { getAssetUrl } from "@/lib/image-utils"
import type {
  BoothCustomization,
  BoothPublishStatus,
  BoothTemplate,
  BoothTemplateCustomizationConfig,
  ExhibitorCatalogProduct,
  Expo,
  ExpoBoothTemplateAssignment,
  ExpoStatus,
  SellerBoothProduct,
  SellerBoothRegistration,
  SellerBoothStatus
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

// ─── Helpers ────────────────────────────────────────────────────────────────

const boothStatusStyles: Record<SellerBoothStatus, string> = {
  "Pending Setup": "border-amber-300 bg-amber-100 text-amber-700",
  Configured: "border-blue-300 bg-blue-100 text-blue-700",
  Approved: "border-teal-300 bg-teal-100 text-teal-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700"
}

const publishStatusStyles: Record<BoothPublishStatus, string> = {
  Draft: "border-blue-300 bg-blue-50 text-blue-700",
  Published: "border-emerald-300 bg-emerald-50 text-emerald-700"
}

function isExpoEditable(status: ExpoStatus | undefined): boolean {
  if (!status) return false
  return status === "Live" || status === "Pending Review" || status === "Draft"
}

function hasCustomizations(c: BoothCustomization): boolean {
  return (
    c.colors.some((col) => col !== "#ffffff" && col !== "") ||
    c.logoUrl.trim() !== "" ||
    c.imageUrls.some((u) => u.trim() !== "") ||
    c.videoUrl.trim() !== "" ||
    c.products.length > 0
  )
}

function buildDefaultCustomization(
  registrationId: string,
  templateId: string | null,
  templateConfig: BoothTemplateCustomizationConfig | null
): BoothCustomization {
  return {
    registrationId,
    selectedBoothTemplateId: templateId,
    publishStatus: "Draft",
    colors: Array.from(
      { length: templateConfig?.colorSlots ?? 0 },
      () => "#ffffff"
    ),
    logoUrl: "",
    imageUrls: Array.from(
      { length: templateConfig?.imageSlots ?? 0 },
      () => ""
    ),
    videoType: null,
    videoUrl: "",
    products: []
  }
}

function buildInitialCustomization(
  registrationId: string,
  boothCustomizations: BoothCustomization[]
): BoothCustomization {
  const existing = boothCustomizations.find(
    (c) => c.registrationId === registrationId
  )
  if (existing) {
    return {
      ...existing,
      colors: [...existing.colors],
      imageUrls: [...existing.imageUrls],
      products: existing.products.map((p) => ({ ...p }))
    }
  }
  return buildDefaultCustomization(registrationId, null, null)
}

function isValidYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      ((u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
        u.pathname === "/watch" &&
        !!u.searchParams.get("v")) ||
      (u.hostname === "youtu.be" && u.pathname.length > 1)
    )
  } catch {
    return false
  }
}

// ─── Root component ──────────────────────────────────────────────────────────

interface Props {
  expoId: string
  registrationId: string
  expo: Expo
  registration: SellerBoothRegistration
  boothTemplates: BoothTemplate[]
  expoBoothTemplateAssignments: ExpoBoothTemplateAssignment[]
  boothTemplateCustomizationConfigs: BoothTemplateCustomizationConfig[]
  boothCustomizations: BoothCustomization[]
  exhibitorCatalogProducts: ExhibitorCatalogProduct[]
}

export function SellerBoothConfigurator({
  expoId,
  registrationId,
  expo,
  registration,
  boothTemplates,
  expoBoothTemplateAssignments,
  boothTemplateCustomizationConfigs,
  exhibitorCatalogProducts,
  boothCustomizations
}: Props) {
  const availableTemplates = React.useMemo<BoothTemplate[]>(() => {
    const assignment = expoBoothTemplateAssignments.find(
      (a) => a.expoId === expoId
    )
    if (!assignment) return boothTemplates
    return boothTemplates.filter((t) =>
      assignment.boothTemplateIds.includes(t.id)
    )
  }, [expoId, boothTemplates, expoBoothTemplateAssignments])

  const [customization, setCustomization] = React.useState<BoothCustomization>(
    () => buildInitialCustomization(registrationId, boothCustomizations)
  )
  const [isDirty, setIsDirty] = React.useState(false)
  const [savedStatus, setSavedStatus] =
    React.useState<BoothPublishStatus | null>(() => {
      const existing = boothCustomizations.find(
        (c) => c.registrationId === registrationId
      )
      return existing?.publishStatus ?? null
    })

  // Gallery / template selection state
  const [galleryOpen, setGalleryOpen] = React.useState(false)
  const [galleryStep, setGalleryStep] = React.useState<"list" | "detail">(
    "list"
  )
  const [galleryHighlight, setGalleryHighlight] =
    React.useState<BoothTemplate | null>(null)
  const [changeWarningOpen, setChangeWarningOpen] = React.useState(false)
  const [confirmSelectOpen, setConfirmSelectOpen] = React.useState(false)
  const [pendingTemplate, setPendingTemplate] =
    React.useState<BoothTemplate | null>(null)

  // 3D preview
  const [preview3DOpen, setPreview3DOpen] = React.useState(false)
  const [preview3DTemplate, setPreview3DTemplate] =
    React.useState<BoothTemplate | null>(null)

  // Product selector
  const [productSelectorOpen, setProductSelectorOpen] = React.useState(false)

  // Publish confirm
  const [publishConfirmOpen, setPublishConfirmOpen] = React.useState(false)
  const [requestError, setRequestError] = React.useState<string | null>(null)

  const selectedTemplate = React.useMemo<BoothTemplate | undefined>(
    () =>
      customization.selectedBoothTemplateId
        ? boothTemplates.find(
            (t) => t.id === customization.selectedBoothTemplateId
          )
        : undefined,
    [customization.selectedBoothTemplateId, boothTemplates]
  )

  const templateConfig = React.useMemo<BoothTemplateCustomizationConfig | null>(
    () =>
      customization.selectedBoothTemplateId
        ? (boothTemplateCustomizationConfigs.find(
            (c) => c.boothTemplateId === customization.selectedBoothTemplateId
          ) ?? null)
        : null,
    [customization.selectedBoothTemplateId, boothTemplateCustomizationConfigs]
  )

  const isReadOnly =
    !isExpoEditable(expo?.status) || registration?.status === "Ended"

  // ── Patch helpers ──────────────────────────────────────────────────────────

  function patch<K extends keyof BoothCustomization>(
    key: K,
    value: BoothCustomization[K]
  ) {
    setCustomization((prev) => {
      const next = { ...prev, [key]: value }
      // If booth was Published and exhibitor edits → revert to Draft
      if (savedStatus === "Published") next.publishStatus = "Draft"
      return next
    })
    setIsDirty(true)
  }

  function patchColor(index: number, hex: string) {
    setCustomization((prev) => {
      const colors = [...prev.colors]
      colors[index] = hex
      return { ...prev, colors }
    })
    setIsDirty(true)
  }

  function patchImageUrl(index: number, url: string) {
    setCustomization((prev) => {
      const imageUrls = [...prev.imageUrls]
      imageUrls[index] = url
      return { ...prev, imageUrls }
    })
    setIsDirty(true)
  }

  // ── Template selection ──────────────────────────────────────────────────────

  function openGallery() {
    setGalleryStep("list")
    setGalleryHighlight(null)
    setGalleryOpen(true)
  }

  function handleChangeTemplateClick() {
    if (hasCustomizations(customization)) {
      setChangeWarningOpen(true)
    } else {
      openGallery()
    }
  }

  function handleTemplateCardClick(t: BoothTemplate) {
    setGalleryHighlight(t)
    setGalleryStep("detail")
  }

  function handleSelectTemplate(t: BoothTemplate) {
    setPendingTemplate(t)
    setConfirmSelectOpen(true)
  }

  function confirmTemplateSelection() {
    if (!pendingTemplate) return
    const config =
      boothTemplateCustomizationConfigs.find(
        (c) => c.boothTemplateId === pendingTemplate.id
      ) ?? null
    const fresh = buildDefaultCustomization(
      registrationId,
      pendingTemplate.id,
      config
    )
    setCustomization(fresh)
    setIsDirty(false)
    setSavedStatus(null)
    setConfirmSelectOpen(false)
    setGalleryOpen(false)
    setPendingTemplate(null)
  }

  // ── Save / Publish ─────────────────────────────────────────────────────────

  async function persistCustomization(next: BoothCustomization) {
    const response = await fetch(
      `/api/seller/booth-customizations/${registrationId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customization: next })
      }
    )
    if (!response.ok) {
      throw new Error("Failed to persist customization")
    }
  }

  async function handleSaveDraft() {
    const next: BoothCustomization = {
      ...customization,
      publishStatus: "Draft"
    }
    try {
      await persistCustomization(next)
      setCustomization(next)
      setSavedStatus("Draft")
      setIsDirty(false)
      setRequestError(null)
    } catch {
      setRequestError("Unable to save draft.")
    }
  }

  function handlePublish() {
    setPublishConfirmOpen(true)
  }

  async function confirmPublish() {
    const next: BoothCustomization = {
      ...customization,
      publishStatus: "Published"
    }
    try {
      await persistCustomization(next)
      setCustomization(next)
      setSavedStatus("Published")
      setIsDirty(false)
      setPublishConfirmOpen(false)
      setRequestError(null)
    } catch {
      setRequestError("Unable to publish booth.")
    }
  }

  // ── Products ───────────────────────────────────────────────────────────────

  const productLimit = templateConfig?.productLimit ?? 0

  function toggleProduct(catalogProduct: ExhibitorCatalogProduct) {
    setCustomization((prev) => {
      const exists = prev.products.some((p) => p.id === catalogProduct.id)
      if (exists) {
        return {
          ...prev,
          products: prev.products.filter((p) => p.id !== catalogProduct.id)
        }
      }
      if (prev.products.length >= productLimit) return prev
      const next: SellerBoothProduct = {
        id: catalogProduct.id,
        name: catalogProduct.name,
        description: catalogProduct.description,
        imageUrl: catalogProduct.imageUrl
      }
      return { ...prev, products: [...prev.products, next] }
    })
    setIsDirty(true)
  }

  function removeProduct(id: string) {
    setCustomization((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id)
    }))
    setIsDirty(true)
  }

  // ── YouTube validation ─────────────────────────────────────────────────────

  const youtubeError =
    customization.videoType === "youtube" &&
    customization.videoUrl.trim() !== "" &&
    !isValidYouTubeUrl(customization.videoUrl)

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasNoTemplate = !customization.selectedBoothTemplateId

  return (
    <div className="grid gap-6 px-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {selectedTemplate && (
            <Image
              src={getAssetUrl(null, selectedTemplate.id, 120, 80)}
              alt={selectedTemplate.name}
              width={80}
              height={54}
              className="rounded-md border object-cover"
            />
          )}
          <div>
            <p className="font-semibold text-sm">
              Booth {registration.boothRef} · {registration.boothTier}
            </p>
            <p className="text-muted-foreground text-xs">
              {selectedTemplate?.name ?? "No template selected"}
            </p>
            <p className="mt-0.5 text-muted-foreground text-xs">{expo.name}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "ml-1 text-xs",
              boothStatusStyles[registration.status]
            )}
          >
            {registration.status}
          </Badge>
          {savedStatus && (
            <Badge
              variant="outline"
              className={cn("text-xs", publishStatusStyles[savedStatus])}
            >
              {savedStatus}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasNoTemplate ? null : isReadOnly ? null : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleChangeTemplateClick}
            >
              Change Template
            </Button>
          )}
        </div>
      </div>

      {isReadOnly && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          This expo has ended or is archived. Booth configuration is read-only.
        </div>
      )}

      {requestError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {requestError}
        </div>
      )}

      {/* No template selected → US-01 */}
      {hasNoTemplate ? (
        <NoTemplateView
          isReadOnly={isReadOnly}
          onSelectTemplate={openGallery}
        />
      ) : (
        /* Full customization UI → US-03 */
        <CustomizationPanel
          customization={customization}
          templateConfig={templateConfig}
          isReadOnly={isReadOnly}
          isDirty={isDirty}
          savedStatus={savedStatus}
          youtubeError={youtubeError}
          onPatchColor={patchColor}
          onPatchImageUrl={patchImageUrl}
          onPatch={patch}
          onRemoveProduct={removeProduct}
          onOpenProductSelector={() => setProductSelectorOpen(true)}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          expoId={expoId}
        />
      )}

      {/* ── Dialogs ── */}

      {/* Template gallery (US-01 / US-02) */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-3xl!">
          {galleryStep === "list" ? (
            <>
              <DialogHeader>
                <DialogTitle>Select Booth Template</DialogTitle>
                <DialogDescription>
                  Choose a template available for this expo. The template
                  determines which customization fields are available.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {availableTemplates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    config={
                      boothTemplateCustomizationConfigs.find(
                        (c) => c.boothTemplateId === t.id
                      ) ?? null
                    }
                    isSelected={customization.selectedBoothTemplateId === t.id}
                    onClick={() => handleTemplateCardClick(t)}
                  />
                ))}
              </div>
            </>
          ) : (
            galleryHighlight && (
              <TemplateDetailView
                template={galleryHighlight}
                config={
                  boothTemplateCustomizationConfigs.find(
                    (c) => c.boothTemplateId === galleryHighlight.id
                  ) ?? null
                }
                onBack={() => setGalleryStep("list")}
                onSelect={() => handleSelectTemplate(galleryHighlight)}
                onPreview3D={() => {
                  setPreview3DTemplate(galleryHighlight)
                  setPreview3DOpen(true)
                }}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Change template warning (US-02) */}
      <Dialog open={changeWarningOpen} onOpenChange={setChangeWarningOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
              Change Booth Template?
            </DialogTitle>
            <DialogDescription>
              Your customizations (colors, logo, images, video, products) will
              be reset.{" "}
              {savedStatus === "Published" &&
                "Your booth will also be unpublished."}{" "}
              Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeWarningOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setChangeWarningOpen(false)
                openGallery()
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm template selection */}
      <Dialog open={confirmSelectOpen} onOpenChange={setConfirmSelectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Template Selection</DialogTitle>
            <DialogDescription>
              Apply{" "}
              <span className="font-medium text-foreground">
                {pendingTemplate?.name}
              </span>{" "}
              to your booth? This will clear any existing customizations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSelectOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmTemplateSelection}>Select Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3D Preview (US-04) */}
      <Dialog open={preview3DOpen} onOpenChange={setPreview3DOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CuboidIcon className="h-5 w-5 text-primary" />
              3D Booth Preview
            </DialogTitle>
            <DialogDescription>
              Read-only preview with current customization state (including
              unsaved changes).
            </DialogDescription>
          </DialogHeader>
          <Preview3DViewer
            template={preview3DTemplate}
            customization={customization}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview3DOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product selector */}
      <Dialog open={productSelectorOpen} onOpenChange={setProductSelectorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Featured Products</DialogTitle>
            <DialogDescription>
              Select up to {productLimit} product
              {productLimit !== 1 ? "s" : ""} from your B2B Marketplace catalog.
            </DialogDescription>
          </DialogHeader>
          <ProductSelectorList
            catalogProducts={exhibitorCatalogProducts}
            selectedIds={customization.products.map((p) => p.id)}
            limit={productLimit}
            onToggle={toggleProduct}
          />
          <DialogFooter>
            <Button onClick={() => setProductSelectorOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish confirmation */}
      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Booth?</DialogTitle>
            <DialogDescription>
              Your booth will become visible to expo visitors. You can edit and
              re-publish at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmPublish}>
              <SendIcon className="h-4 w-4" />
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── NoTemplateView ──────────────────────────────────────────────────────────

function NoTemplateView({
  isReadOnly,
  onSelectTemplate
}: {
  isReadOnly: boolean
  onSelectTemplate: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-dashed bg-muted/30 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <LayoutGridIcon className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-base">No Booth Template Selected</h3>
        <p className="mt-1 max-w-sm text-muted-foreground text-sm">
          Choose a template to set your booth&apos;s design and unlock
          customization options.
        </p>
      </div>
      <Button onClick={onSelectTemplate} disabled={isReadOnly} size="lg">
        <LayoutGridIcon className="h-4 w-4" />
        Select Template
      </Button>
      {isReadOnly && (
        <p className="text-muted-foreground text-xs">
          Template selection is disabled for archived expos.
        </p>
      )}
    </div>
  )
}

// ─── CustomizationPanel (US-03) ───────────────────────────────────────────────

function CustomizationPanel({
  customization,
  templateConfig,
  isReadOnly,
  isDirty,
  savedStatus,
  youtubeError,
  onPatchColor,
  onPatchImageUrl,
  onPatch,
  onRemoveProduct,
  onOpenProductSelector,
  onSaveDraft,
  onPublish,
  expoId
}: {
  customization: BoothCustomization
  templateConfig: BoothTemplateCustomizationConfig | null
  isReadOnly: boolean
  isDirty: boolean
  savedStatus: BoothPublishStatus | null
  youtubeError: boolean
  onPatchColor: (i: number, hex: string) => void
  onPatchImageUrl: (i: number, url: string) => void
  onPatch: <K extends keyof BoothCustomization>(
    k: K,
    v: BoothCustomization[K]
  ) => void
  onRemoveProduct: (id: string) => void
  onOpenProductSelector: () => void
  onSaveDraft: () => void
  onPublish: () => void
  expoId: string
}) {
  const colorSlots = templateConfig?.colorSlots ?? 0
  const imageSlots = templateConfig?.imageSlots ?? 0
  const productLimit = templateConfig?.productLimit ?? 0
  const hasVideo = templateConfig?.hasVideo ?? false

  const canSave = isDirty && !youtubeError

  return (
    <div className="grid gap-6">
      {/* Colors */}
      {colorSlots > 0 && (
        <Section title="Brand Colors">
          <div className="flex flex-wrap gap-6">
            {Array.from({ length: colorSlots }, (_, index) => ({
              id: `color-slot-${index + 1}`,
              index
            })).map((slot) => (
              <ColorSlot
                key={slot.id}
                label={`Color ${slot.index + 1}`}
                value={customization.colors[slot.index] ?? "#ffffff"}
                onChange={(hex) => onPatchColor(slot.index, hex)}
                disabled={isReadOnly}
              />
            ))}
          </div>
        </Section>
      )}

      {colorSlots > 0 && <Separator />}

      {/* Logo */}
      <Section title="Logo">
        <div className="grid gap-3 md:grid-cols-2">
          <FieldGroup label="Logo URL">
            <Input
              value={customization.logoUrl}
              onChange={(e) => onPatch("logoUrl", e.target.value)}
              placeholder="https://…"
              disabled={isReadOnly}
            />
          </FieldGroup>
          {customization.logoUrl && (
            <div className="flex items-center gap-3">
              <Image
                src={customization.logoUrl}
                alt="Logo preview"
                width={80}
                height={80}
                className="rounded-md border object-contain"
              />
            </div>
          )}
        </div>
      </Section>

      <Separator />

      {/* Images */}
      {imageSlots > 0 && (
        <>
          <Section
            title={`Images (${imageSlots} slot${imageSlots !== 1 ? "s" : ""})`}
          >
            <div className="grid gap-4">
              {Array.from({ length: imageSlots }, (_, index) => ({
                id: `image-slot-${index + 1}`,
                index
              })).map((slot) => (
                <div key={slot.id} className="grid gap-2">
                  <FieldGroup label={`Image ${slot.index + 1}`}>
                    <Input
                      value={customization.imageUrls[slot.index] ?? ""}
                      onChange={(e) =>
                        onPatchImageUrl(slot.index, e.target.value)
                      }
                      placeholder="https://… (recommended 1200×600)"
                      disabled={isReadOnly}
                    />
                  </FieldGroup>
                  {(customization.imageUrls[slot.index] ?? "") && (
                    <Image
                      src={customization.imageUrls[slot.index]}
                      alt={`Booth image ${slot.index + 1}`}
                      width={400}
                      height={250}
                      className="w-full max-w-sm rounded-md border object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </Section>
          <Separator />
        </>
      )}

      {/* Video (US-03 AC-04/05/06) */}
      {hasVideo && (
        <>
          <Section title="Video">
            {!isReadOnly && (
              <div className="mb-4 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    customization.videoType === "upload" ? "default" : "outline"
                  }
                  onClick={() => {
                    onPatch("videoType", "upload")
                    onPatch("videoUrl", "")
                  }}
                >
                  <VideoIcon className="h-3.5 w-3.5" />
                  Upload Video
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    customization.videoType === "youtube"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => {
                    onPatch("videoType", "youtube")
                    onPatch("videoUrl", "")
                  }}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  YouTube Link
                </Button>
                {customization.videoType && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onPatch("videoType", null)
                      onPatch("videoUrl", "")
                    }}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {customization.videoType === "upload" && (
              <FieldGroup label="Video file URL">
                <Input
                  value={customization.videoUrl}
                  onChange={(e) => onPatch("videoUrl", e.target.value)}
                  placeholder="https://… (mp4, webm)"
                  disabled={isReadOnly}
                />
              </FieldGroup>
            )}

            {customization.videoType === "youtube" && (
              <FieldGroup label="YouTube URL">
                <Input
                  value={customization.videoUrl}
                  onChange={(e) => onPatch("videoUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  disabled={isReadOnly}
                  className={youtubeError ? "border-destructive" : ""}
                />
                {youtubeError && (
                  <p className="text-destructive text-xs">
                    Please enter a valid YouTube URL (youtube.com/watch?v=…).
                  </p>
                )}
              </FieldGroup>
            )}

            {!customization.videoType && (
              <p className="text-muted-foreground text-sm">
                {isReadOnly
                  ? "No video added."
                  : "Choose Upload Video or YouTube Link above."}
              </p>
            )}
          </Section>
          <Separator />
        </>
      )}

      {/* Featured Products (US-03 AC-02/03) */}
      {productLimit > 0 && (
        <Section
          title="Featured Products"
          action={
            !isReadOnly && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {customization.products.length} / {productLimit}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenProductSelector}
                  disabled={customization.products.length >= productLimit}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Products
                </Button>
              </div>
            )
          }
        >
          {customization.products.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-muted-foreground text-sm">
              No featured products yet.{" "}
              {!isReadOnly && (
                <button
                  type="button"
                  className="underline"
                  onClick={onOpenProductSelector}
                >
                  Add one
                </button>
              )}
            </p>
          ) : (
            <div className="grid gap-3">
              {customization.products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      width={64}
                      height={48}
                      className="shrink-0 rounded border object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{p.name}</p>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                        {p.description}
                      </p>
                    )}
                  </div>
                  {!isReadOnly && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => onRemoveProduct(p.id)}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Bottom action bar */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" asChild>
            <Link href={`/seller/my-expos/${expoId}`}>Cancel</Link>
          </Button>
          <div className="flex items-center gap-2">
            {!isDirty && savedStatus && (
              <span className="flex items-center gap-1 text-emerald-600 text-sm">
                <CheckCircle2Icon className="h-4 w-4" />
                {savedStatus === "Published" ? "Published" : "Draft saved"}
              </span>
            )}
            {youtubeError && (
              <span className="text-destructive text-sm">
                Fix YouTube URL before saving.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onSaveDraft}>
              Preview 3D
            </Button>
            <Button variant="outline" onClick={onSaveDraft} disabled={!canSave}>
              Save Draft
            </Button>
            <Button onClick={onPublish} disabled={isDirty || youtubeError}>
              <SendIcon className="h-4 w-4" />
              {savedStatus === "Published" ? "Re-Publish" : "Publish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  config,
  isSelected,
  onClick
}: {
  template: BoothTemplate
  config: BoothTemplateCustomizationConfig | null
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <div className="relative overflow-hidden">
        <Image
          src={getAssetUrl(null, template.id, 400, 240)}
          alt={template.name}
          width={400}
          height={240}
          className="h-36 w-full object-cover transition-transform group-hover:scale-105"
        />
        {isSelected && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary text-primary-foreground text-xs">
              Current
            </Badge>
          </div>
        )}
      </div>
      <div className="grid gap-1 p-3">
        <p className="font-semibold text-sm">{template.name}</p>
        <p className="line-clamp-2 text-muted-foreground text-xs">
          {template.description}
        </p>
        {config && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {config.colorSlots > 0 && (
              <TemplateProp label={`${config.colorSlots} colors`} />
            )}
            {config.imageSlots > 0 && (
              <TemplateProp
                label={`${config.imageSlots} image${config.imageSlots !== 1 ? "s" : ""}`}
              />
            )}
            {config.productLimit > 0 && (
              <TemplateProp label={`${config.productLimit} products`} />
            )}
            {config.hasVideo && <TemplateProp label="Video" />}
          </div>
        )}
      </div>
    </button>
  )
}

function TemplateProp({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
      {label}
    </span>
  )
}

// ─── TemplateDetailView ───────────────────────────────────────────────────────

function TemplateDetailView({
  template,
  config,
  onBack,
  onSelect,
  onPreview3D
}: {
  template: BoothTemplate
  config: BoothTemplateCustomizationConfig | null
  onBack: () => void
  onSelect: () => void
  onPreview3D: () => void
}) {
  return (
    <div className="grid gap-5">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeftIcon />
          Back
        </Button>
      </div>
      <Image
        src={getAssetUrl(null, template.id, 800, 400)}
        alt={template.name}
        width={800}
        height={400}
        className="w-full rounded-xl border object-cover"
      />
      <div>
        <h3 className="font-semibold text-lg">{template.name}</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          {template.description}
        </p>
      </div>
      {config && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-4">
          <ConfigStat label="Color Slots" value={String(config.colorSlots)} />
          <ConfigStat label="Image Slots" value={String(config.imageSlots)} />
          <ConfigStat
            label="Max Products"
            value={String(config.productLimit)}
          />
          <ConfigStat label="Video" value={config.hasVideo ? "Yes" : "No"} />
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onPreview3D}>
          <EyeIcon className="h-4 w-4" />
          Preview 3D
        </Button>
        <Button onClick={onSelect}>Select This Template</Button>
      </div>
    </div>
  )
}

function ConfigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-semibold text-base">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  )
}

// ─── Preview3DViewer (US-04) ─────────────────────────────────────────────────

function Preview3DViewer({
  template,
  customization
}: {
  template: BoothTemplate | null
  customization: BoothCustomization
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-zinc-900">
      <div className="relative min-h-64 overflow-hidden">
        {/* Simulated 3D environment */}
        <div className="absolute inset-0 bg-linear-to-br from-zinc-800 to-zinc-950" />
        {/* Grid floor */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            transform:
              "perspective(600px) rotateX(45deg) scale(2.5) translateY(20%)"
          }}
        />
        {/* Booth representation */}
        <div className="relative flex h-64 items-end justify-center pb-8">
          <div className="relative">
            {template && (
              <Image
                src={getAssetUrl(null, `${template.id}3d`, 400, 280)}
                alt={template.name}
                width={280}
                height={180}
                className="rounded-lg border-2 border-white/20 object-cover shadow-2xl"
              />
            )}
            {/* Color swatches overlay */}
            {customization.colors.length > 0 && (
              <div className="absolute bottom-2 left-2 flex gap-1">
                {customization.colors.map((c, i, colors) => (
                  <div
                    key={`${c}-${colors.slice(0, i).filter((value) => value === c).length}`}
                    className="h-4 w-4 rounded-full border-2 border-white shadow-md"
                    style={{ background: c }}
                  />
                ))}
              </div>
            )}
            {/* Logo overlay */}
            {customization.logoUrl && (
              <div className="absolute top-2 right-2">
                <Image
                  src={customization.logoUrl}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="rounded border border-white/30 bg-white/10 object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-2">
        <span className="text-white/60 text-xs">
          {template?.name ?? "No template"}
        </span>
        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400 text-xs">
          Simulated Preview — Production will render actual 3D
        </span>
      </div>
    </div>
  )
}

// ─── ProductSelectorList ──────────────────────────────────────────────────────

function ProductSelectorList({
  catalogProducts,
  selectedIds,
  limit,
  onToggle
}: {
  catalogProducts: ExhibitorCatalogProduct[]
  selectedIds: string[]
  limit: number
  onToggle: (p: ExhibitorCatalogProduct) => void
}) {
  const selectedSet = new Set(selectedIds)
  const atLimit = selectedIds.length >= limit

  return (
    <div className="grid max-h-96 gap-2 overflow-y-auto pr-1">
      {catalogProducts.map((p) => {
        const isSelected = selectedSet.has(p.id)
        const isDisabled = atLimit && !isSelected
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p)}
            disabled={isDisabled}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : "hover:border-primary/40 hover:bg-muted/40",
              isDisabled && "cursor-not-allowed opacity-50"
            )}
          >
            {p.imageUrl && (
              <Image
                src={p.imageUrl}
                alt={p.name}
                width={56}
                height={42}
                className="shrink-0 rounded border object-cover"
              />
            )}
            {!p.imageUrl && (
              <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded border bg-muted">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">{p.name}</p>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                {p.description}
              </p>
            </div>
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && (
                <CheckCircle2Icon className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
          </button>
        )
      })}
      {atLimit && (
        <p className="py-1 text-center text-muted-foreground text-xs">
          Limit reached ({limit} products max for this template).
        </p>
      )}
    </div>
  )
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function Section({
  title,
  action,
  children
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function FieldGroup({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )
}

function ColorSlot({
  label,
  value,
  onChange,
  disabled
}: {
  label: string
  value: string
  onChange: (hex: string) => void
  disabled: boolean
}) {
  const id = React.useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className={cn(
            "relative block h-9 w-9 cursor-pointer overflow-hidden rounded-md border-2 border-border transition-opacity",
            disabled && "cursor-not-allowed opacity-50"
          )}
          style={{ background: value }}
        >
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 font-mono text-xs uppercase"
          placeholder="#ffffff"
          disabled={disabled}
          maxLength={7}
        />
      </div>
      <CharacterCount currentLength={value.length} maxLength={7} />
    </div>
  )
}
