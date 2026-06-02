"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useUpload } from "@/hooks/use-upload"
import { toDatetimeLocalValue } from "@/lib/tradexpo/expo-form-utils"
import {
  DEFAULT_EXPO_MARKETING_CONTENT,
  normalizeExpoMarketingContent,
  validateExpoMarketingContent
} from "@/lib/tradexpo/expo-marketing-content"
import {
  confirmOwnerChange,
  getOwnerDisplay
} from "@/lib/tradexpo/expo-owner-flow"
import {
  getExpoSchedulePrecision,
  normalizeExpoScheduleInput
} from "@/lib/tradexpo/schedule"
import { AROBID_DISPLAY_TARGET_ID } from "@/lib/tradexpo/tenant-display"
import type {
  ExpoMarketingContent,
  ExpoSchedulePrecision
} from "@/lib/tradexpo/types"
import {
  ADMIN_EXPO_FORM_STEPS,
  PARTNER_EXPO_FORM_STEPS
} from "./expo-form/constants"
import { GeneralStep } from "./expo-form/general-step"
import { HallsStep } from "./expo-form/halls-step"
import { MarketingStep } from "./expo-form/marketing-step"
import { OwnerChangeDialog } from "./expo-form/owner-change-dialog"
import { OwnerStep } from "./expo-form/owner-step"
import {
  audienceRowsFromContent,
  benefitRowsFromContent,
  hallsToRows,
  newHallRow
} from "./expo-form/row-helpers"
import { ScheduleStep } from "./expo-form/schedule-step"
import { StepNavigation } from "./expo-form/step-navigation"
import type {
  AudienceCardFormRow,
  BenefitCardFormRow,
  ExpoFormProps,
  ExpoFormStep,
  ExpoFormStepId,
  HallFormRow,
  OwnerPick
} from "./expo-form/types"

export type { ExpoFormProps } from "./expo-form/types"

export function ExpoForm(props: ExpoFormProps) {
  const router = useRouter()
  const isEdit = props.mode === "edit"
  const editableScope = props.editableScope ?? "admin"
  const isPartnerContentEdit = isEdit && editableScope === "partner-content"
  const isSuper = props.isSuper ?? false
  const visibleSteps = isPartnerContentEdit
    ? PARTNER_EXPO_FORM_STEPS
    : ADMIN_EXPO_FORM_STEPS
  const tenantOptions = props.tenantOptions ?? []
  const displayTargetOptionIds = new Set([
    AROBID_DISPLAY_TARGET_ID,
    ...tenantOptions.map((tenant) => tenant.id)
  ])
  const [activeStepId, setActiveStepId] =
    React.useState<ExpoFormStepId>("general")

  React.useEffect(() => {
    if (!visibleSteps.some((step) => step.id === activeStepId)) {
      setActiveStepId(visibleSteps[0]?.id ?? "general")
    }
  }, [activeStepId, visibleSteps])

  const [name, setName] = React.useState(() =>
    isEdit ? props.initialExpo.name : ""
  )
  const [slug, setSlug] = React.useState(() =>
    isEdit ? (props.initialExpo.slug ?? "") : ""
  )
  const [description, setDescription] = React.useState(() =>
    isEdit ? (props.initialExpo.description ?? "") : ""
  )
  const [thumbnailUrl, setThumbnailUrl] = React.useState(() =>
    isEdit ? props.initialExpo.thumbnailUrl : ""
  )
  const [expoTemplateId, setExpoTemplateId] = React.useState(() =>
    isEdit ? (props.initialExpo.expoTemplateId ?? "") : ""
  )
  const [categoryIds, setCategoryIds] = React.useState<string[]>(() =>
    isEdit ? props.initialExpo.categoryIds : []
  )
  const [categoryQuery, setCategoryQuery] = React.useState("")
  const [timezone, setTimezone] = React.useState(() =>
    isEdit ? (props.initialExpo.timezone ?? "Asia/Bangkok") : "Asia/Bangkok"
  )

  const [schedulePrecision, setSchedulePrecision] =
    React.useState<ExpoSchedulePrecision>(() =>
      isEdit ? getExpoSchedulePrecision(props.initialExpo) : "unscheduled"
    )
  const [scheduleMonth, setScheduleMonth] = React.useState(() =>
    isEdit && props.initialExpo.scheduleMonth
      ? String(props.initialExpo.scheduleMonth)
      : ""
  )
  const [scheduleYear, setScheduleYear] = React.useState(() =>
    isEdit && props.initialExpo.scheduleYear
      ? String(props.initialExpo.scheduleYear)
      : ""
  )
  const [scheduleError, setScheduleError] = React.useState<string | null>(null)

  const [startLocal, setStartLocal] = React.useState(() => {
    if (isEdit) {
      if (props.initialExpo.startAt) {
        return toDatetimeLocalValue(new Date(props.initialExpo.startAt))
      }
      if (props.initialExpo.startDate) {
        return toDatetimeLocalValue(
          new Date(`${props.initialExpo.startDate}T12:00:00`)
        )
      }
    }
    return ""
  })
  const [endLocal, setEndLocal] = React.useState(() => {
    if (isEdit) {
      if (props.initialExpo.endAt) {
        return toDatetimeLocalValue(new Date(props.initialExpo.endAt))
      }
      if (props.initialExpo.endDate) {
        return toDatetimeLocalValue(
          new Date(`${props.initialExpo.endDate}T12:00:00`)
        )
      }
    }
    return ""
  })

  const [ownerQuery, setOwnerQuery] = React.useState(() =>
    isEdit
      ? (props.initialOwner?.email ?? props.initialExpo.ownerEmail ?? "")
      : ""
  )
  const [ownerResults, setOwnerResults] = React.useState<OwnerPick[]>([])
  const [ownerPick, setOwnerPick] = React.useState<OwnerPick | null>(() =>
    isEdit ? props.initialOwner : null
  )
  const [ownerLoading, setOwnerLoading] = React.useState(false)
  const [isChangingOwner, setIsChangingOwner] = React.useState(!isEdit)
  const [showOwnerChangeConfirm, setShowOwnerChangeConfirm] =
    React.useState(false)
  const [tenantPartnerOrgId, setTenantPartnerOrgId] = React.useState(() =>
    isEdit ? (props.initialExpo.tenantPartnerOrgId ?? "") : ""
  )
  const [displayTargetIds, setDisplayTargetIds] = React.useState<string[]>(
    () => {
      if (isEdit && props.initialExpo.displayTargetIds.length > 0) {
        return props.initialExpo.displayTargetIds.filter((id) =>
          displayTargetOptionIds.has(id)
        )
      }
      return [AROBID_DISPLAY_TARGET_ID]
    }
  )

  const initialMarketingContent = normalizeExpoMarketingContent(
    props.initialMarketingContent ?? DEFAULT_EXPO_MARKETING_CONTENT
  )
  const [whoEnabled, setWhoEnabled] = React.useState(
    initialMarketingContent.whoShouldJoin.enabled
  )
  const [whoTitle, setWhoTitle] = React.useState(
    initialMarketingContent.whoShouldJoin.sectionTitle
  )
  const [whoSubtitle, setWhoSubtitle] = React.useState(
    initialMarketingContent.whoShouldJoin.sectionSubtitle ?? ""
  )
  const [audienceCards, setAudienceCards] = React.useState<
    AudienceCardFormRow[]
  >(() => audienceRowsFromContent(initialMarketingContent))
  const [benefitsEnabled, setBenefitsEnabled] = React.useState(
    initialMarketingContent.audienceBenefits.enabled
  )
  const [benefitsTitle, setBenefitsTitle] = React.useState(
    initialMarketingContent.audienceBenefits.sectionTitle
  )
  const [benefitsSubtitle, setBenefitsSubtitle] = React.useState(
    initialMarketingContent.audienceBenefits.sectionSubtitle ?? ""
  )
  const [benefitCards, setBenefitCards] = React.useState<BenefitCardFormRow[]>(
    () => benefitRowsFromContent(initialMarketingContent)
  )

  const [halls, setHalls] = React.useState<HallFormRow[]>(() =>
    isEdit ? hallsToRows(props.initialHalls) : [newHallRow(0)]
  )

  const { uploadFile, isUploading } = useUpload()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await uploadFile(file, "thumbnail")
    if (result) {
      setThumbnailUrl(result.fileUrl)
    }
  }

  React.useEffect(() => {
    const q = ownerQuery.trim()
    if (q.length < 2) {
      setOwnerResults([])
      return
    }
    const t = window.setTimeout(async () => {
      setOwnerLoading(true)
      try {
        const res = await fetch(
          `/api/tradexpo/expo-owners/search?q=${encodeURIComponent(q)}`
        )
        const data = (await res.json()) as { users?: OwnerPick[] }
        setOwnerResults(data.users ?? [])
      } catch {
        setOwnerResults([])
      } finally {
        setOwnerLoading(false)
      }
    }, 400)
    return () => window.clearTimeout(t)
  }, [ownerQuery])

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleDisplayTarget(id: string) {
    setDisplayTargetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function addHall() {
    setHalls((prev) => [...prev, newHallRow(prev.length)])
  }

  function removeHall(index: number) {
    setHalls((prev) => prev.filter((_, i) => i !== index))
  }

  function updateHall(index: number, patch: Partial<HallFormRow>) {
    setHalls((prev) =>
      prev.map((h, i) => (i === index ? { ...h, ...patch } : h))
    )
  }

  function updateAudienceCard(
    index: number,
    patch: Partial<AudienceCardFormRow>
  ) {
    setAudienceCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, ...patch } : card))
    )
  }

  function updateBenefitCard(
    index: number,
    patch: Partial<BenefitCardFormRow>
  ) {
    setBenefitCards((prev) =>
      prev.map((card, i) => {
        if (i !== index) {
          return patch.isFeatured ? { ...card, isFeatured: false } : card
        }
        return { ...card, ...patch }
      })
    )
  }

  function updateBenefitItem(
    cardIndex: number,
    itemIndex: number,
    value: string
  ) {
    setBenefitCards((prev) =>
      prev.map((card, i) =>
        i === cardIndex
          ? {
              ...card,
              benefitItems: card.benefitItems.map((item, j) =>
                j === itemIndex ? value : item
              )
            }
          : card
      )
    )
  }

  function buildMarketingContent(): ExpoMarketingContent {
    return normalizeExpoMarketingContent({
      whoShouldJoin: {
        enabled: whoEnabled,
        sectionTitle: whoTitle,
        sectionSubtitle: whoSubtitle,
        audienceCards: audienceCards.map(({ key: _key, ...card }) => card)
      },
      audienceBenefits: {
        enabled: benefitsEnabled,
        sectionTitle: benefitsTitle,
        sectionSubtitle: benefitsSubtitle,
        benefitCards: benefitCards.map(({ key: _key, ...card }) => card)
      }
    })
  }

  function handleConfirmOwnerChange() {
    const next = confirmOwnerChange(ownerPick)
    setOwnerQuery(next.ownerQuery)
    setOwnerPick(next.ownerPick)
    setIsChangingOwner(next.isChangingOwner)
    setOwnerResults([])
    setError(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setScheduleError(null)
    if (!ownerPick) {
      setError("Search and select an expo owner by email.")
      return
    }
    if (!isPartnerContentEdit && !tenantPartnerOrgId) {
      setError("Select a tenant for this expo.")
      return
    }
    if (!isPartnerContentEdit && displayTargetIds.length === 0) {
      setError("Select at least one display position.")
      return
    }

    const scheduleResult = normalizeExpoScheduleInput({
      schedulePrecision,
      startAt: startLocal,
      endAt: endLocal,
      timezone,
      scheduleMonth,
      scheduleYear
    })
    if (!scheduleResult.ok) {
      setScheduleError(scheduleResult.error)
      return
    }
    const schedule = scheduleResult.schedule

    const marketingContent = buildMarketingContent()
    const marketingResult = validateExpoMarketingContent(marketingContent)
    if (!marketingResult.ok) {
      setError(marketingResult.error)
      return
    }

    const payload = {
      name,
      ...(isSuper ? { slug } : {}),
      description,
      thumbnailUrl,
      expoTemplateId,
      categoryIds,
      schedulePrecision: schedule.schedulePrecision,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      timezone: schedule.timezone,
      scheduleMonth: schedule.scheduleMonth,
      scheduleYear: schedule.scheduleYear,
      ownerUserId: ownerPick.id,
      ownerEmail: ownerPick.email,
      tenantPartnerOrgId,
      displayTargetIds,
      marketingContent,
      halls: halls.map((h) => ({
        hallName: h.hallName,
        hallTemplateId: h.hallTemplateId,
        basicQty: h.basicQty,
        professionalQty: h.professionalQty,
        premiumQty: h.premiumQty
      }))
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        const res = await fetch(
          props.submitEndpoint ?? `/api/tradexpo/expos/${props.expoId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        )
        const data = (await res.json()) as { ok?: boolean; error?: string }
        if (!res.ok) {
          setError(data.error ?? "Could not save expo.")
          return
        }
        router.push(
          props.successHref ?? `/admin/tradexpo/expos/${props.expoId}`
        )
        router.refresh()
      } else {
        const res = await fetch("/api/tradexpo/expos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const data = (await res.json()) as { id?: string; error?: string }
        if (!res.ok) {
          setError(data.error ?? "Could not create expo.")
          return
        }
        if (data.id) {
          router.push(`/admin/tradexpo/expos/${data.id}`)
          router.refresh()
        }
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const hasScheduleInput =
    schedulePrecision === "exact_date_range"
      ? startLocal.trim().length > 0 && endLocal.trim().length > 0
      : schedulePrecision === "month_year"
        ? scheduleMonth.trim().length > 0 && scheduleYear.trim().length > 0
        : true

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    expoTemplateId &&
    categoryIds.length > 0 &&
    ownerPick !== null &&
    (isPartnerContentEdit || tenantPartnerOrgId.length > 0) &&
    (isPartnerContentEdit || displayTargetIds.length > 0) &&
    hasScheduleInput

  const cancelHref =
    props.cancelHref ??
    (isEdit ? `/admin/tradexpo/expos/${props.expoId}` : "/admin/tradexpo/expos")
  const currentOwnerDisplay = isEdit
    ? getOwnerDisplay(ownerPick, props.initialExpo.ownerEmail)
    : null
  const filteredCategories = React.useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return props.categories
    return props.categories.filter((cat) => cat.name.toLowerCase().includes(q))
  }, [categoryQuery, props.categories])

  const activeStepIndex = Math.max(
    visibleSteps.findIndex((step) => step.id === activeStepId),
    0
  )
  const activeStep =
    visibleSteps[activeStepIndex] ?? (ADMIN_EXPO_FORM_STEPS[0] as ExpoFormStep)
  const isFirstStep = activeStepIndex === 0
  const isLastStep = activeStepIndex === visibleSteps.length - 1

  function goToPreviousStep() {
    const previousStep = visibleSteps[activeStepIndex - 1]
    if (previousStep) {
      setActiveStepId(previousStep.id)
    }
  }

  function goToNextStep() {
    const nextStep = visibleSteps[activeStepIndex + 1]
    if (nextStep) {
      setActiveStepId(nextStep.id)
    }
  }

  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        <StepNavigation
          steps={visibleSteps}
          activeStep={activeStep}
          onStepChange={setActiveStepId}
        />

        <div className="min-w-0 space-y-3">
          {activeStep.id === "general" ? (
            <GeneralStep
              title={
                isPartnerContentEdit
                  ? "Expo information"
                  : "General information"
              }
              stepDescription={activeStep.description}
              name={name}
              onNameChange={setName}
              isSuper={isSuper}
              isEdit={isEdit}
              slug={slug}
              onSlugChange={setSlug}
              expoDescription={description}
              onExpoDescriptionChange={setDescription}
              thumbnailUrl={thumbnailUrl}
              onThumbnailUrlChange={setThumbnailUrl}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              isPartnerContentEdit={isPartnerContentEdit}
              expoTemplateId={expoTemplateId}
              onExpoTemplateIdChange={setExpoTemplateId}
              layoutTemplates={props.layoutTemplates}
              categoryQuery={categoryQuery}
              onCategoryQueryChange={setCategoryQuery}
              filteredCategories={filteredCategories}
              categoryIds={categoryIds}
              onToggleCategory={toggleCategory}
            />
          ) : null}

          {activeStep.id === "schedule" ? (
            <ScheduleStep
              schedulePrecision={schedulePrecision}
              onSchedulePrecisionChange={setSchedulePrecision}
              startLocal={startLocal}
              onStartLocalChange={setStartLocal}
              endLocal={endLocal}
              onEndLocalChange={setEndLocal}
              timezone={timezone}
              onTimezoneChange={setTimezone}
              scheduleMonth={scheduleMonth}
              onScheduleMonthChange={setScheduleMonth}
              scheduleYear={scheduleYear}
              onScheduleYearChange={setScheduleYear}
              scheduleError={scheduleError}
              onScheduleErrorChange={setScheduleError}
            />
          ) : null}

          {!isPartnerContentEdit && activeStep.id === "owner" ? (
            <OwnerStep
              isEdit={isEdit}
              isChangingOwner={isChangingOwner}
              currentOwnerDisplay={currentOwnerDisplay}
              ownerQuery={ownerQuery}
              onOwnerQueryChange={setOwnerQuery}
              ownerResults={ownerResults}
              ownerPick={ownerPick}
              onOwnerPickChange={setOwnerPick}
              ownerLoading={ownerLoading}
              tenantOptions={tenantOptions}
              tenantPartnerOrgId={tenantPartnerOrgId}
              onTenantPartnerOrgIdChange={setTenantPartnerOrgId}
              displayTargetIds={displayTargetIds}
              onToggleDisplayTarget={toggleDisplayTarget}
              onRequestOwnerChange={() => setShowOwnerChangeConfirm(true)}
            />
          ) : null}

          {!isPartnerContentEdit && activeStep.id === "halls" ? (
            <HallsStep
              halls={halls}
              hallTemplates={props.hallTemplates}
              onAddHall={addHall}
              onRemoveHall={removeHall}
              onUpdateHall={updateHall}
            />
          ) : null}

          {activeStep.id === "marketing" ? (
            <MarketingStep
              whoEnabled={whoEnabled}
              onWhoEnabledChange={setWhoEnabled}
              whoTitle={whoTitle}
              onWhoTitleChange={setWhoTitle}
              whoSubtitle={whoSubtitle}
              onWhoSubtitleChange={setWhoSubtitle}
              audienceCards={audienceCards}
              onAudienceCardsChange={setAudienceCards}
              onUpdateAudienceCard={updateAudienceCard}
              benefitsEnabled={benefitsEnabled}
              onBenefitsEnabledChange={setBenefitsEnabled}
              benefitsTitle={benefitsTitle}
              onBenefitsTitleChange={setBenefitsTitle}
              benefitsSubtitle={benefitsSubtitle}
              onBenefitsSubtitleChange={setBenefitsSubtitle}
              benefitCards={benefitCards}
              onBenefitCardsChange={setBenefitCards}
              onUpdateBenefitCard={updateBenefitCard}
              onUpdateBenefitItem={updateBenefitItem}
            />
          ) : null}
        </div>
      </div>

      <OwnerChangeDialog
        open={showOwnerChangeConfirm}
        onOpenChange={setShowOwnerChangeConfirm}
        onConfirm={handleConfirmOwnerChange}
      />

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800 text-sm dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
        >
          Cancel
        </Button>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFirstStep}
            onClick={goToPreviousStep}
          >
            Previous
          </Button>
          {isLastStep ? (
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? <Spinner /> : null}
              {isEdit ? "Save changes" : "Create expo"}
            </Button>
          ) : (
            <Button type="button" onClick={goToNextStep}>
              Next
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
