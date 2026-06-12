"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BadgeCheckIcon,
  CrownIcon,
  GemIcon,
  GripVerticalIcon,
  type LucideIcon,
  PlusIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  XIcon,
  ZapIcon
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BadgeManagementWorkspace } from "@/lib/badges/db"
import { cn } from "@/lib/utils"
import { Skeleton } from "../ui/skeleton"
import {
  BADGE_CATALOG_PAGE_SIZE,
  type BadgeDefinition,
  type BadgeDraft,
  type BadgeLevelType,
  type BadgeRankingConfig,
  type DisplayContext,
  type DisplayTarget,
  type EntityPreview,
  emptyBadgeDraft,
  makeExternalBadgeId,
  previewByContext,
  productPreviewThumbs
} from "./badge-management-data"

const badgeArtwork: Record<
  string,
  {
    label: string
    Icon: LucideIcon
    className: string
    iconClassName: string
  }
> = {
  "BADGE-B2B-ISO-9001": {
    label: "ISO 9001",
    Icon: ShieldCheckIcon,
    className: "bg-[#ecfdf5] text-[#047857] ring-[#bbf7d0]",
    iconClassName: "bg-white/80 text-[#059669]"
  },
  [makeExternalBadgeId("Company", "ISO 9001")]: {
    label: "ISO 9001",
    Icon: ShieldCheckIcon,
    className: "bg-[#ecfdf5] text-[#047857] ring-[#bbf7d0]",
    iconClassName: "bg-white/80 text-[#059669]"
  },
  [makeExternalBadgeId("Product / Service", "ISO 9001")]: {
    label: "ISO 9001",
    Icon: ShieldCheckIcon,
    className: "bg-[#ecfdf5] text-[#047857] ring-[#bbf7d0]",
    iconClassName: "bg-white/80 text-[#059669]"
  },
  [makeExternalBadgeId("Company", "FDA")]: {
    label: "FDA",
    Icon: ShieldCheckIcon,
    className: "bg-[#eef2ff] text-[#3730a3] ring-[#c7d2fe]",
    iconClassName: "bg-white/80 text-[#4f46e5]"
  },
  [makeExternalBadgeId("Product / Service", "FDA")]: {
    label: "FDA",
    Icon: ShieldCheckIcon,
    className: "bg-[#eef2ff] text-[#3730a3] ring-[#c7d2fe]",
    iconClassName: "bg-white/80 text-[#4f46e5]"
  },
  [makeExternalBadgeId("Company", "CE")]: {
    label: "CE",
    Icon: ShieldCheckIcon,
    className: "bg-[#fff7ed] text-[#c2410c] ring-[#fed7aa]",
    iconClassName: "bg-white/80 text-[#ea580c]"
  },
  [makeExternalBadgeId("Product / Service", "CE")]: {
    label: "CE",
    Icon: ShieldCheckIcon,
    className: "bg-[#fff7ed] text-[#c2410c] ring-[#fed7aa]",
    iconClassName: "bg-white/80 text-[#ea580c]"
  },
  [makeExternalBadgeId("Company", "GS1")]: {
    label: "GS1",
    Icon: BadgeCheckIcon,
    className: "bg-[#eff6ff] text-[#1d4ed8] ring-[#bfdbfe]",
    iconClassName: "bg-white/80 text-[#2563eb]"
  },
  "BADGE-B2B-PRODUCT-NEW": {
    label: "NEW",
    Icon: SparklesIcon,
    className: "bg-[#eef1ff] text-[#082e8f] ring-[#dde3ff]",
    iconClassName: "bg-white/70 text-[#294bd8]"
  },
  "BADGE-B2B-PRODUCT-LIVE": {
    label: "LIVE",
    Icon: ZapIcon,
    className: "bg-[#f97316] text-white ring-[#fed7aa]",
    iconClassName: "bg-white/20 text-white"
  },
  "BADGE-B2B-TOP-DEAL": {
    label: "TOP DEAL",
    Icon: TrophyIcon,
    className: "bg-[#ffe7e7] text-[#dc2626] ring-[#fecaca]",
    iconClassName: "bg-white/75 text-[#dc2626]"
  },
  "BADGE-B2B-SPECIAL-OFFER": {
    label: "SPECIAL OFFER",
    Icon: ZapIcon,
    className: "bg-[#082873] text-white ring-[#bfdbfe]",
    iconClassName: "bg-[#facc15] text-[#082873]"
  },
  "BADGE-RFQ-SILVER": {
    label: "SILVER",
    Icon: BadgeCheckIcon,
    className: "bg-[#f1f5f9] text-[#475569] ring-[#cbd5e1]",
    iconClassName: "bg-white/80 text-[#64748b]"
  },
  "BADGE-RFQ-GOLD": {
    label: "GOLD",
    Icon: CrownIcon,
    className: "bg-[#fef3c7] text-[#92400e] ring-[#fde68a]",
    iconClassName: "bg-white/80 text-[#d97706]"
  },
  "BADGE-RFQ-PIONEER": {
    label: "PIONEER",
    Icon: StarIcon,
    className: "bg-[#fdf2f8] text-[#be185d] ring-[#fbcfe8]",
    iconClassName: "bg-white/80 text-[#db2777]"
  },
  "BADGE-RFQ-DIAMOND": {
    label: "DIAMOND",
    Icon: GemIcon,
    className: "bg-[#e0f2fe] text-[#075985] ring-[#bae6fd]",
    iconClassName: "bg-white/80 text-[#0284c7]"
  },
  "BADGE-TX-VERIFIED-PRO": {
    label: "VERIFIED PRO",
    Icon: BadgeCheckIcon,
    className: "bg-[#ecfdf5] text-[#047857] ring-[#bbf7d0]",
    iconClassName: "bg-white/80 text-[#059669]"
  },
  "BADGE-TX-HOT-PICK": {
    label: "HOT PICK",
    Icon: TrophyIcon,
    className: "bg-[#ffe7e7] text-[#dc2626] ring-[#fecaca]",
    iconClassName: "bg-white/75 text-[#dc2626]"
  },
  "BADGE-TX-FEATURED": {
    label: "FEATURED",
    Icon: StarIcon,
    className: "bg-[#fdf2f8] text-[#be185d] ring-[#fbcfe8]",
    iconClassName: "bg-white/80 text-[#db2777]"
  }
}

function getBadgeArtwork(badge: BadgeDefinition) {
  return (
    badgeArtwork[badge.id] ?? {
      label: badge.name.toUpperCase(),
      Icon: BadgeCheckIcon,
      className: "bg-slate-100 text-slate-700 ring-slate-200",
      iconClassName: "bg-white text-slate-600"
    }
  )
}

function targetTone(target: DisplayTarget) {
  const tones: Record<DisplayTarget, string> = {
    Supplier: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Product: "border-sky-200 bg-sky-50 text-sky-700",
    RFQ: "border-amber-200 bg-amber-50 text-amber-700",
    TradeXpo: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
  }
  return tones[target]
}

function levelTone(level: number) {
  if (level >= 5) return "border-purple-200 bg-purple-50 text-purple-700"
  if (level === 4) return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
  if (level === 3) return "border-sky-200 bg-sky-50 text-sky-700"
  if (level === 2) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function getLevelTypeName(levelTypes: BadgeLevelType[], levelTypeId: string) {
  return (
    levelTypes.find((levelType) => levelType.id === levelTypeId)?.name ??
    levelTypeId
  )
}

function getContextCounts(displayContexts: DisplayContext[]) {
  return displayContexts.reduce(
    (counts, context) => {
      counts[context.target] = (counts[context.target] ?? 0) + 1
      return counts
    },
    {} as Partial<Record<DisplayTarget, number>>
  )
}

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error || fallback
  } catch (_error) {
    return fallback
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

const fallbackContext: DisplayContext = {
  id: "",
  title: "No context",
  target: "Product",
  surface: "",
  ranking: []
}

function useBadgeManagementState(initialWorkspace: BadgeManagementWorkspace) {
  const [levelTypes] = useState(initialWorkspace.levelTypes)
  const [catalogBadges, setCatalogBadges] = useState(initialWorkspace.badges)
  const [displayContexts, setDisplayContexts] = useState(
    initialWorkspace.displayContexts
  )
  const [rankingsByContext, setRankingsByContext] = useState(
    () =>
      Object.fromEntries(
        initialWorkspace.displayContexts.map((context) => [
          context.id,
          context.ranking
        ])
      ) as Record<string, BadgeRankingConfig[]>
  )
  const [selectedContextId, setSelectedContextId] = useState(
    initialWorkspace.displayContexts[0]?.id ?? ""
  )
  const [previewEntityName, setPreviewEntityName] = useState("")
  const [publishedAtByContext, setPublishedAtByContext] = useState<
    Record<string, string | null>
  >(
    Object.fromEntries(
      initialWorkspace.displayContexts.map((context) => [context.id, null])
    )
  )
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isAddBadgeOpen, setIsAddBadgeOpen] = useState(false)
  const [isAddExternalBadgeOpen, setIsAddExternalBadgeOpen] = useState(false)
  const [badgeToAdd, setBadgeToAdd] = useState("")
  const [addBadgeQuery, setAddBadgeQuery] = useState("")
  const [catalogQuery, setCatalogQuery] = useState("")
  const [catalogPage, setCatalogPage] = useState(1)
  const [badgeCatalogQuery, setBadgeCatalogQuery] = useState("")
  const [badgeModuleFilter, setBadgeModuleFilter] = useState("all")
  const [badgeGroupFilter, setBadgeGroupFilter] = useState("all")
  const [badgeCatalogPage, setBadgeCatalogPage] = useState(1)
  const [badgeDraft, setBadgeDraft] = useState(emptyBadgeDraft)
  const [badgeBeingEdited, setBadgeBeingEdited] =
    useState<BadgeDefinition | null>(null)
  const [isEditBadgeOpen, setIsEditBadgeOpen] = useState(false)
  const [isSavingBadge, setIsSavingBadge] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)

  const selectedContext =
    displayContexts.find((context) => context.id === selectedContextId) ??
    displayContexts[0] ??
    fallbackContext
  const selectedRanking = rankingsByContext[selectedContext.id] ?? []
  const previewEntities = previewByContext[selectedContext.id] ?? []
  const selectedPreviewEntity =
    previewEntities.find((entity) => entity.name === previewEntityName) ??
    previewEntities[0]
  const sortedRanking = useMemo(() => {
    return [...selectedRanking].sort((a, b) => a.priority - b.priority)
  }, [selectedRanking])
  const activeRanking = useMemo(() => {
    return sortedRanking.filter((item) => item.active)
  }, [sortedRanking])
  const availableBadgesForContext = catalogBadges.filter(
    (badge) =>
      badge.status !== "archived" &&
      !selectedRanking.some((item) => item.badgeId === badge.id)
  )
  const filteredAvailableBadges = useMemo(() => {
    const query = addBadgeQuery.trim().toLowerCase()
    if (!query) return availableBadgesForContext

    return availableBadgesForContext.filter((badge) => {
      const levelTypeName = getLevelTypeName(levelTypes, badge.levelTypeId)
      return [
        badge.id,
        badge.name,
        badge.module,
        badge.group,
        badge.levelTypeId,
        levelTypeName,
        `level ${badge.level}`
      ].some((value) => value.toLowerCase().includes(query))
    })
  }, [addBadgeQuery, availableBadgesForContext, levelTypes])
  const contextCounts = getContextCounts(displayContexts)
  const activePlacements = Object.values(rankingsByContext)
    .flat()
    .filter((item) => item.active).length
  const publishedAt = publishedAtByContext[selectedContext.id]
  const badgeCatalogDefinitions = useMemo(
    () => catalogBadges.filter((badge) => badge.status !== "archived"),
    [catalogBadges]
  )
  const badgeModules = useMemo(
    () => [...new Set(badgeCatalogDefinitions.map((badge) => badge.module))],
    [badgeCatalogDefinitions]
  )
  const badgeGroups = useMemo(
    () => [...new Set(badgeCatalogDefinitions.map((badge) => badge.group))],
    [badgeCatalogDefinitions]
  )
  const filteredBadgeCatalogDefinitions = useMemo(() => {
    const query = badgeCatalogQuery.trim().toLowerCase()

    return badgeCatalogDefinitions.filter((badge) => {
      const levelTypeName = getLevelTypeName(levelTypes, badge.levelTypeId)
      const matchesQuery = query
        ? [
            badge.id,
            badge.name,
            badge.module,
            badge.group,
            badge.whereItAppears,
            badge.levelTypeId,
            levelTypeName,
            `level ${badge.level}`
          ].some((value) => value.toLowerCase().includes(query))
        : true
      const matchesModule =
        badgeModuleFilter === "all" || badge.module === badgeModuleFilter
      const matchesGroup =
        badgeGroupFilter === "all" || badge.group === badgeGroupFilter

      return matchesQuery && matchesModule && matchesGroup
    })
  }, [
    badgeCatalogDefinitions,
    badgeCatalogQuery,
    badgeGroupFilter,
    badgeModuleFilter,
    levelTypes
  ])
  const totalBadgeCatalogPages = Math.max(
    1,
    Math.ceil(filteredBadgeCatalogDefinitions.length / BADGE_CATALOG_PAGE_SIZE)
  )
  const paginatedBadgeCatalogDefinitions = useMemo(() => {
    const start = (badgeCatalogPage - 1) * BADGE_CATALOG_PAGE_SIZE
    return filteredBadgeCatalogDefinitions.slice(
      start,
      start + BADGE_CATALOG_PAGE_SIZE
    )
  }, [badgeCatalogPage, filteredBadgeCatalogDefinitions])
  const filteredBadgeDefinitions = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase()
    if (!query) return badgeCatalogDefinitions

    return badgeCatalogDefinitions.filter((badge) => {
      const levelTypeName = getLevelTypeName(levelTypes, badge.levelTypeId)
      return [
        badge.id,
        badge.name,
        badge.module,
        badge.group,
        badge.levelTypeId,
        levelTypeName,
        `level ${badge.level}`
      ].some((value) => value.toLowerCase().includes(query))
    })
  }, [badgeCatalogDefinitions, catalogQuery, levelTypes])
  const totalCatalogPages = Math.max(
    1,
    Math.ceil(filteredBadgeDefinitions.length / BADGE_CATALOG_PAGE_SIZE)
  )
  const paginatedBadgeDefinitions = useMemo(() => {
    const start = (catalogPage - 1) * BADGE_CATALOG_PAGE_SIZE
    return filteredBadgeDefinitions.slice(
      start,
      start + BADGE_CATALOG_PAGE_SIZE
    )
  }, [catalogPage, filteredBadgeDefinitions])

  useEffect(() => {
    if (catalogPage > totalCatalogPages) {
      setCatalogPage(totalCatalogPages)
    }
  }, [catalogPage, totalCatalogPages])

  useEffect(() => {
    if (badgeCatalogPage > totalBadgeCatalogPages) {
      setBadgeCatalogPage(totalBadgeCatalogPages)
    }
  }, [badgeCatalogPage, totalBadgeCatalogPages])

  function resetBadgeCatalogPage() {
    setBadgeCatalogPage(1)
  }

  function getCatalogBadge(badgeId: string) {
    const badge = catalogBadges.find((item) => item.id === badgeId)
    if (!badge) {
      throw new Error(`Missing badge definition for ${badgeId}`)
    }
    return badge
  }

  function updateRanking(
    badgeId: string,
    patch: Partial<Omit<BadgeRankingConfig, "badgeId">>
  ) {
    setRankingsByContext((current) => ({
      ...current,
      [selectedContext.id]: (current[selectedContext.id] ?? []).map((item) =>
        item.badgeId === badgeId ? { ...item, ...patch } : item
      )
    }))
  }

  function moveRanking(badgeId: string, direction: -1 | 1) {
    setRankingsByContext((current) => {
      const contextRanking = current[selectedContext.id] ?? []
      const sorted = [...contextRanking].sort((a, b) => a.priority - b.priority)
      const currentIndex = sorted.findIndex((item) => item.badgeId === badgeId)
      const targetIndex = currentIndex + direction

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
        return current
      }

      const currentItem = sorted[currentIndex]
      const targetItem = sorted[targetIndex]

      return {
        ...current,
        [selectedContext.id]: contextRanking.map((item) => {
          if (item.badgeId === currentItem.badgeId) {
            return { ...item, priority: targetItem.priority }
          }
          if (item.badgeId === targetItem.badgeId) {
            return { ...item, priority: currentItem.priority }
          }
          return item
        })
      }
    })
  }

  function addBadgeToContext(badgeId: string) {
    if (!badgeId) return

    setRankingsByContext((current) => {
      const contextRanking = current[selectedContext.id] ?? []
      if (contextRanking.some((item) => item.badgeId === badgeId)) {
        return current
      }

      const nextPriority =
        contextRanking.length > 0
          ? Math.max(...contextRanking.map((item) => item.priority)) + 1
          : 1

      return {
        ...current,
        [selectedContext.id]: [
          ...contextRanking,
          { badgeId, active: true, priority: nextPriority }
        ]
      }
    })
    setBadgeToAdd("")
    setIsAddBadgeOpen(false)
  }

  function removeBadgeFromContext(badgeId: string) {
    setRankingsByContext((current) => ({
      ...current,
      [selectedContext.id]: (current[selectedContext.id] ?? []).filter(
        (item) => item.badgeId !== badgeId
      )
    }))
  }

  function openAddBadgeDialog() {
    setBadgeToAdd("")
    setAddBadgeQuery("")
    setOperationError(null)
    setIsAddBadgeOpen(true)
  }

  async function publishContext() {
    setOperationError(null)
    try {
      const response = await fetch(
        `/api/admin/badge-display-contexts/${encodeURIComponent(selectedContext.id)}/rankings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ranking: sortedRanking })
        }
      )

      if (!response.ok) {
        throw new Error(await readApiError(response, "Publish ranking failed."))
      }

      const workspace = (await response.json()) as BadgeManagementWorkspace
      setCatalogBadges(workspace.badges)
      setDisplayContexts(workspace.displayContexts)
      setRankingsByContext(
        Object.fromEntries(
          workspace.displayContexts.map((context) => [
            context.id,
            context.ranking
          ])
        ) as Record<string, BadgeRankingConfig[]>
      )
      setPublishedAtByContext((current) => ({
        ...current,
        [selectedContext.id]: new Date().toISOString()
      }))
    } catch (error) {
      setOperationError(getErrorMessage(error, "Publish ranking failed."))
    }
  }

  function openAddExternalBadgeDialog() {
    setBadgeDraft(emptyBadgeDraft)
    setBadgeBeingEdited(null)
    setOperationError(null)
    setIsAddExternalBadgeOpen(true)
  }

  function openEditBadgeDialog(badge: BadgeDefinition) {
    setBadgeBeingEdited(badge)
    setBadgeDraft({
      name: badge.name,
      module: badge.module,
      group: badge.group,
      levelTypeId: badge.levelTypeId,
      level: badge.level,
      condition: badge.condition,
      whereItAppears: badge.whereItAppears,
      designLink: badge.designLink ?? ""
    })
    setOperationError(null)
    setIsEditBadgeOpen(true)
  }

  function updateBadgeDraft(patch: Partial<BadgeDraft>) {
    setBadgeDraft((current) => ({ ...current, ...patch }))
  }

  async function createBadgeFromDraft() {
    const name = badgeDraft.name.trim()
    if (!name) return

    setIsSavingBadge(true)
    setOperationError(null)
    try {
      const response = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgeDraft)
      })

      if (!response.ok) {
        throw new Error(await readApiError(response, "Create badge failed."))
      }

      const body = (await response.json()) as { badge: BadgeDefinition }
      setCatalogBadges((current) => [...current, body.badge])
      setCatalogQuery("")
      setBadgeCatalogQuery("")
      setBadgeDraft(emptyBadgeDraft)
      setIsAddExternalBadgeOpen(false)
    } catch (error) {
      setOperationError(getErrorMessage(error, "Create badge failed."))
    } finally {
      setIsSavingBadge(false)
    }
  }

  async function updateBadgeFromDraft() {
    if (!badgeBeingEdited) return
    const name = badgeDraft.name.trim()
    if (!name) return

    setIsSavingBadge(true)
    setOperationError(null)
    try {
      const response = await fetch(
        `/api/admin/badges/${encodeURIComponent(badgeBeingEdited.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(badgeDraft)
        }
      )

      if (!response.ok) {
        throw new Error(await readApiError(response, "Update badge failed."))
      }

      const body = (await response.json()) as { badge: BadgeDefinition }
      setCatalogBadges((current) =>
        current.map((badge) =>
          badge.id === body.badge.id ? body.badge : badge
        )
      )
      setBadgeBeingEdited(null)
      setBadgeDraft(emptyBadgeDraft)
      setIsEditBadgeOpen(false)
    } catch (error) {
      setOperationError(getErrorMessage(error, "Update badge failed."))
    } finally {
      setIsSavingBadge(false)
    }
  }

  async function archiveBadgeFromCatalog(badge: BadgeDefinition) {
    setIsSavingBadge(true)
    setOperationError(null)
    try {
      const response = await fetch(
        `/api/admin/badges/${encodeURIComponent(badge.id)}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error(await readApiError(response, "Archive badge failed."))
      }

      setCatalogBadges((current) =>
        current.map((item) =>
          item.id === badge.id ? { ...item, status: "archived" } : item
        )
      )
      setRankingsByContext(
        (current) =>
          Object.fromEntries(
            Object.entries(current).map(([contextId, ranking]) => [
              contextId,
              ranking.filter((item) => item.badgeId !== badge.id)
            ])
          ) as Record<string, BadgeRankingConfig[]>
      )
    } catch (error) {
      setOperationError(getErrorMessage(error, "Archive badge failed."))
    } finally {
      setIsSavingBadge(false)
    }
  }
  return {
    levelTypes,
    displayContexts,
    rankingsByContext,
    selectedContext,
    setSelectedContextId,
    previewEntities,
    selectedPreviewEntity,
    setPreviewEntityName,
    sortedRanking,
    activeRanking,
    availableBadgesForContext,
    filteredAvailableBadges,
    contextCounts,
    activePlacements,
    publishedAt,
    badgeCatalogDefinitions,
    badgeModules,
    badgeGroups,
    filteredBadgeCatalogDefinitions,
    totalBadgeCatalogPages,
    paginatedBadgeCatalogDefinitions,
    filteredBadgeDefinitions,
    totalCatalogPages,
    paginatedBadgeDefinitions,
    isPreviewOpen,
    setIsPreviewOpen,
    isAddBadgeOpen,
    setIsAddBadgeOpen,
    isAddExternalBadgeOpen,
    setIsAddExternalBadgeOpen,
    isEditBadgeOpen,
    setIsEditBadgeOpen,
    setBadgeBeingEdited,
    isSavingBadge,
    operationError,
    badgeToAdd,
    setBadgeToAdd,
    addBadgeQuery,
    setAddBadgeQuery,
    catalogQuery,
    setCatalogQuery,
    catalogPage,
    setCatalogPage,
    badgeCatalogQuery,
    setBadgeCatalogQuery,
    badgeModuleFilter,
    setBadgeModuleFilter,
    badgeGroupFilter,
    setBadgeGroupFilter,
    badgeCatalogPage,
    setBadgeCatalogPage,
    resetBadgeCatalogPage,
    badgeDraft,
    getCatalogBadge,
    updateRanking,
    moveRanking,
    addBadgeToContext,
    removeBadgeFromContext,
    openAddBadgeDialog,
    publishContext,
    openAddExternalBadgeDialog,
    openEditBadgeDialog,
    updateBadgeDraft,
    createBadgeFromDraft,
    updateBadgeFromDraft,
    archiveBadgeFromCatalog
  }
}

export function BadgeManagementConfig({
  initialWorkspace
}: {
  initialWorkspace: BadgeManagementWorkspace
}) {
  const {
    levelTypes,
    displayContexts,
    rankingsByContext,
    selectedContext,
    setSelectedContextId,
    previewEntities,
    selectedPreviewEntity,
    setPreviewEntityName,
    sortedRanking,
    activeRanking,
    availableBadgesForContext,
    filteredAvailableBadges,
    contextCounts,
    activePlacements,
    publishedAt,
    badgeCatalogDefinitions,
    badgeModules,
    badgeGroups,
    filteredBadgeCatalogDefinitions,
    totalBadgeCatalogPages,
    paginatedBadgeCatalogDefinitions,
    filteredBadgeDefinitions,
    totalCatalogPages,
    paginatedBadgeDefinitions,
    isPreviewOpen,
    setIsPreviewOpen,
    isAddBadgeOpen,
    setIsAddBadgeOpen,
    isAddExternalBadgeOpen,
    setIsAddExternalBadgeOpen,
    isEditBadgeOpen,
    setIsEditBadgeOpen,
    setBadgeBeingEdited,
    isSavingBadge,
    operationError,
    badgeToAdd,
    setBadgeToAdd,
    addBadgeQuery,
    setAddBadgeQuery,
    catalogQuery,
    setCatalogQuery,
    catalogPage,
    setCatalogPage,
    badgeCatalogQuery,
    setBadgeCatalogQuery,
    badgeModuleFilter,
    setBadgeModuleFilter,
    badgeGroupFilter,
    setBadgeGroupFilter,
    badgeCatalogPage,
    setBadgeCatalogPage,
    resetBadgeCatalogPage,
    badgeDraft,
    getCatalogBadge,
    updateRanking,
    moveRanking,
    addBadgeToContext,
    removeBadgeFromContext,
    openAddBadgeDialog,
    publishContext,
    openAddExternalBadgeDialog,
    openEditBadgeDialog,
    updateBadgeDraft,
    createBadgeFromDraft,
    updateBadgeFromDraft,
    archiveBadgeFromCatalog
  } = useBadgeManagementState(initialWorkspace)

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Display contexts" value={displayContexts.length} />
        <MetricCard
          label="Product contexts"
          value={contextCounts.Product ?? 0}
        />
        <MetricCard
          label="Supplier contexts"
          value={contextCounts.Supplier ?? 0}
        />
        <MetricCard label="Active placements" value={activePlacements} />
      </div>

      {operationError ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm"
        >
          {operationError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-foreground/10">
          <CardHeader>
            <CardTitle>Display Surfaces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayContexts.map((context) => {
              const isSelected = context.id === selectedContext.id
              const activeCount = (rankingsByContext[context.id] ?? []).filter(
                (item) => item.active
              ).length
              return (
                <button
                  key={context.id}
                  type="button"
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-muted/40 text-foreground"
                      : "bg-background hover:bg-muted/30"
                  )}
                  onClick={() => setSelectedContextId(context.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{context.title}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("border", targetTone(context.target))}
                    >
                      {context.target}
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {activeCount} active badge placements
                  </p>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-foreground/10">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontalIcon className="size-5 text-muted-foreground" />
                    Context Detail
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={cn("border", targetTone(selectedContext.target))}
                >
                  {selectedContext.target}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <InfoPill label="Context" value={selectedContext.title} />
                <InfoPill label="Target" value={selectedContext.target} />
                <InfoPill
                  label="Active badges"
                  value={String(activeRanking.length)}
                />
                <InfoPill
                  label="Total badges"
                  value={String(sortedRanking.length)}
                />
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-medium text-sm">Preview & publish</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      Preview
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={publishContext}
                      disabled={activeRanking.length === 0}
                    >
                      {publishedAt ? "Republish" : "Publish"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <InfoPill
                    label="Last published"
                    value={formatPublishedAt(publishedAt)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-foreground/10">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>Badge Inventory</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={openAddBadgeDialog}
                disabled={availableBadgesForContext.length === 0}
              >
                <PlusIcon className="size-4" />
                Add Badge
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Context #</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="w-[112px] text-center">
                        Active
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRanking.length > 0 ? (
                      sortedRanking.map((item, index) => {
                        const badge = getCatalogBadge(item.badgeId)
                        return (
                          <TableRow key={item.badgeId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <GripVerticalIcon className="size-4 text-muted-foreground" />
                                <Badge variant="secondary">
                                  #{item.priority}
                                </Badge>
                                <div className="flex overflow-hidden rounded-lg border bg-background">
                                  <button
                                    type="button"
                                    className="border-r p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                                    disabled={index === 0}
                                    onClick={() =>
                                      moveRanking(item.badgeId, -1)
                                    }
                                    aria-label={`Move ${badge.name} up`}
                                  >
                                    <ArrowUpIcon className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                                    disabled={
                                      index === sortedRanking.length - 1
                                    }
                                    onClick={() => moveRanking(item.badgeId, 1)}
                                    aria-label={`Move ${badge.name} down`}
                                  >
                                    <ArrowDownIcon className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <BadgeArtwork badge={badge} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{badge.group}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("border", levelTone(badge.level))}
                              >
                                {getLevelTypeName(
                                  levelTypes,
                                  badge.levelTypeId
                                )}{" "}
                                L{badge.level}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={item.active}
                                  onCheckedChange={(active) =>
                                    updateRanking(item.badgeId, { active })
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() =>
                                    removeBadgeFromContext(item.badgeId)
                                  }
                                  aria-label={`Remove ${badge.name}`}
                                >
                                  <XIcon className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No badges
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-foreground/10">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Badge Catalog Management</CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">
              Manage badge catalog master data by module, certification group,
              and display surface.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {badgeCatalogDefinitions.length} badges
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
            <Input
              value={badgeCatalogQuery}
              onChange={(event) => {
                setBadgeCatalogQuery(event.target.value)
                resetBadgeCatalogPage()
              }}
              placeholder="Search badge, module, group, level, surface, or ID"
            />
            <Select
              value={badgeModuleFilter}
              onValueChange={(value) => {
                setBadgeModuleFilter(value)
                resetBadgeCatalogPage()
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {badgeModules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={badgeGroupFilter}
              onValueChange={(value) => {
                setBadgeGroupFilter(value)
                resetBadgeCatalogPage()
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {badgeGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Badge</TableHead>
                  <TableHead className="w-[160px]">Module</TableHead>
                  <TableHead className="w-[260px]">Group</TableHead>
                  <TableHead className="w-[180px]">Level</TableHead>
                  <TableHead>Where it appears</TableHead>
                  <TableHead className="w-[150px] text-center">
                    Status
                  </TableHead>
                  <TableHead className="w-[160px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBadgeCatalogDefinitions.length > 0 ? (
                  paginatedBadgeCatalogDefinitions.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1">
                          <BadgeArtwork badge={badge} size="sm" />
                          <p className="break-all text-muted-foreground text-xs">
                            {badge.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{badge.module}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="text-sm">{badge.group}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("border", levelTone(badge.level))}
                        >
                          {getLevelTypeName(levelTypes, badge.levelTypeId)} L
                          {badge.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground text-xs leading-relaxed">
                        {badge.whereItAppears}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs capitalize">
                          {badge.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditBadgeDialog(badge)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSavingBadge}
                            onClick={() => void archiveBadgeFromCatalog(badge)}
                          >
                            Archive
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No badges found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredBadgeCatalogDefinitions.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {(badgeCatalogPage - 1) * BADGE_CATALOG_PAGE_SIZE + 1}-
                {Math.min(
                  badgeCatalogPage * BADGE_CATALOG_PAGE_SIZE,
                  filteredBadgeCatalogDefinitions.length
                )}{" "}
                of {filteredBadgeCatalogDefinitions.length}
              </p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setBadgeCatalogPage((current) =>
                          Math.max(1, current - 1)
                        )
                      }}
                      aria-disabled={badgeCatalogPage === 1}
                      className={
                        badgeCatalogPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-3 text-sm">
                      Page {badgeCatalogPage} / {totalBadgeCatalogPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setBadgeCatalogPage((current) =>
                          Math.min(totalBadgeCatalogPages, current + 1)
                        )
                      }}
                      aria-disabled={
                        badgeCatalogPage === totalBadgeCatalogPages
                      }
                      className={
                        badgeCatalogPage === totalBadgeCatalogPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-foreground/10">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Badge Catalog Reference</CardTitle>
          <Button type="button" size="sm" onClick={openAddExternalBadgeDialog}>
            <PlusIcon className="size-4" />
            Add Badge
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={catalogQuery}
            onChange={(event) => {
              setCatalogQuery(event.target.value)
              setCatalogPage(1)
            }}
            placeholder="Search badge, module, group, level, or ID"
            className="max-w-md"
          />
          <div className="overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Badge</TableHead>
                  <TableHead className="w-[150px]">Level</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="min-w-[280px]">Condition</TableHead>
                  <TableHead className="w-[140px] text-center">
                    Admin Editable
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBadgeDefinitions.length > 0 ? (
                  paginatedBadgeDefinitions.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1">
                          <BadgeArtwork badge={badge} size="sm" />
                          <p className="text-muted-foreground text-xs">
                            {badge.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("border", levelTone(badge.level))}
                        >
                          {getLevelTypeName(levelTypes, badge.levelTypeId)} L
                          {badge.level}
                        </Badge>
                      </TableCell>
                      <TableCell>{badge.module}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{badge.group}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[420px] whitespace-normal text-muted-foreground text-xs leading-relaxed">
                        {badge.condition}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          No
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No badges found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredBadgeDefinitions.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {(catalogPage - 1) * BADGE_CATALOG_PAGE_SIZE + 1}-
                {Math.min(
                  catalogPage * BADGE_CATALOG_PAGE_SIZE,
                  filteredBadgeDefinitions.length
                )}{" "}
                of {filteredBadgeDefinitions.length}
              </p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCatalogPage((current) => Math.max(1, current - 1))
                      }}
                      aria-disabled={catalogPage === 1}
                      className={
                        catalogPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-3 text-sm">
                      Page {catalogPage} / {totalCatalogPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        setCatalogPage((current) =>
                          Math.min(totalCatalogPages, current + 1)
                        )
                      }}
                      aria-disabled={catalogPage === totalCatalogPages}
                      className={
                        catalogPage === totalCatalogPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Badge Preview</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-2xl border bg-gradient-to-b from-slate-50 to-white p-4">
              <Tabs
                value={selectedPreviewEntity?.name ?? ""}
                onValueChange={setPreviewEntityName}
              >
                <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/40 p-1">
                  {previewEntities.map((entity) => (
                    <TabsTrigger key={entity.name} value={entity.name}>
                      {entity.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="mt-4">
                {selectedPreviewEntity ? (
                  selectedContext.id === "product-card-listing" ? (
                    <ProductListingPreview
                      entity={selectedPreviewEntity}
                      getBadgeById={getCatalogBadge}
                      ranking={activeRanking}
                    />
                  ) : (
                    <EntityPreviewCard
                      context={selectedContext}
                      entity={selectedPreviewEntity}
                      getBadgeById={getCatalogBadge}
                      ranking={activeRanking}
                    />
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
                    No preview entity
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <InfoPill label="Context" value={selectedContext.title} />
              <InfoPill label="Target" value={selectedContext.target} />
              <InfoPill
                label="Active badges"
                value={String(activeRanking.length)}
              />
              <InfoPill
                label="Last published"
                value={formatPublishedAt(publishedAt)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddBadgeOpen}
        onOpenChange={(open) => {
          setIsAddBadgeOpen(open)
          if (!open) {
            setBadgeToAdd("")
            setAddBadgeQuery("")
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Badge</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                {selectedContext.title}
              </p>
              <p className="text-muted-foreground text-xs">
                Choose one badge to add into this context ranking.
              </p>
            </div>

            <Input
              value={addBadgeQuery}
              onChange={(event) => {
                setAddBadgeQuery(event.target.value)
                setBadgeToAdd("")
              }}
              placeholder="Search badge by name, module, level, or ID"
            />

            <Select
              value={badgeToAdd}
              onValueChange={setBadgeToAdd}
              disabled={filteredAvailableBadges.length === 0}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select badge" />
              </SelectTrigger>
              <SelectContent>
                {filteredAvailableBadges.map((badge) => (
                  <SelectItem key={badge.id} value={badge.id}>
                    {`${badge.name} • ${badge.module} • ${getLevelTypeName(levelTypes, badge.levelTypeId)} L${badge.level}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filteredAvailableBadges.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-3 text-muted-foreground text-sm">
                No badge found
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddBadgeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => addBadgeToContext(badgeToAdd)}
              disabled={!badgeToAdd}
            >
              Add Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddExternalBadgeOpen}
        onOpenChange={setIsAddExternalBadgeOpen}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Badge</DialogTitle>
          </DialogHeader>

          <BadgeDraftFields
            badgeDraft={badgeDraft}
            levelTypes={levelTypes}
            updateBadgeDraft={updateBadgeDraft}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddExternalBadgeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void createBadgeFromDraft()}
              disabled={!badgeDraft.name.trim() || isSavingBadge}
            >
              {isSavingBadge ? "Saving..." : "Add Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditBadgeOpen}
        onOpenChange={(open) => {
          setIsEditBadgeOpen(open)
          if (!open) {
            setBadgeBeingEdited(null)
            updateBadgeDraft(emptyBadgeDraft)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Badge</DialogTitle>
          </DialogHeader>

          <BadgeDraftFields
            badgeDraft={badgeDraft}
            levelTypes={levelTypes}
            updateBadgeDraft={updateBadgeDraft}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditBadgeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void updateBadgeFromDraft()}
              disabled={!badgeDraft.name.trim() || isSavingBadge}
            >
              {isSavingBadge ? "Saving..." : "Save Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BadgeDraftFields({
  badgeDraft,
  levelTypes,
  updateBadgeDraft
}: {
  badgeDraft: BadgeDraft
  levelTypes: BadgeLevelType[]
  updateBadgeDraft: (patch: Partial<BadgeDraft>) => void
}) {
  const selectedLevelType =
    levelTypes.find((levelType) => levelType.id === badgeDraft.levelTypeId) ??
    levelTypes[0]
  const minLevel = selectedLevelType?.minLevel ?? 1
  const maxLevel = selectedLevelType?.maxLevel ?? 5
  const levelOptions = Array.from(
    { length: maxLevel - minLevel + 1 },
    (_item, index) => minLevel + index
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          aria-label="Badge name"
          value={badgeDraft.name}
          onChange={(event) => updateBadgeDraft({ name: event.target.value })}
          placeholder="Badge name"
        />
        <Input
          aria-label="Module"
          value={badgeDraft.module}
          onChange={(event) => updateBadgeDraft({ module: event.target.value })}
          placeholder="Module"
        />
        <Input
          aria-label="Group"
          value={badgeDraft.group}
          onChange={(event) => updateBadgeDraft({ group: event.target.value })}
          placeholder="Group"
        />
        <Select
          value={badgeDraft.levelTypeId}
          onValueChange={(levelTypeId) =>
            updateBadgeDraft({
              levelTypeId: levelTypeId as BadgeDraft["levelTypeId"],
              level: 1
            })
          }
        >
          <SelectTrigger aria-label="Level type" className="bg-white">
            <SelectValue placeholder="Level type" />
          </SelectTrigger>
          <SelectContent>
            {levelTypes.map((levelType) => (
              <SelectItem key={levelType.id} value={levelType.id}>
                {levelType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(badgeDraft.level)}
          onValueChange={(level) => updateBadgeDraft({ level: Number(level) })}
        >
          <SelectTrigger aria-label="Level" className="bg-white">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            {levelOptions.map((level) => (
              <SelectItem key={level} value={String(level)}>
                Level {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-label="Design link"
          value={badgeDraft.designLink}
          onChange={(event) =>
            updateBadgeDraft({ designLink: event.target.value })
          }
          placeholder="Design link"
        />
      </div>
      <Input
        aria-label="Where it appears"
        value={badgeDraft.whereItAppears}
        onChange={(event) =>
          updateBadgeDraft({ whereItAppears: event.target.value })
        }
        placeholder="Where it appears"
      />
      <Input
        aria-label="Condition or verification note"
        value={badgeDraft.condition}
        onChange={(event) =>
          updateBadgeDraft({ condition: event.target.value })
        }
        placeholder="Condition / verification note"
      />
    </div>
  )
}

function ProductListingPreview({
  entity,
  getBadgeById,
  ranking
}: {
  entity: EntityPreview
  getBadgeById: (badgeId: string) => BadgeDefinition
  ranking: BadgeRankingConfig[]
}) {
  const renderedBadges = ranking.filter((item) =>
    entity.eligibleBadgeIds.includes(item.badgeId)
  )

  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {renderedBadges.map((item) => {
          const badge = getBadgeById(item.badgeId)
          return <BadgeArtwork key={item.badgeId} badge={badge} size="sm" />
        })}
      </div>

      <div className="mt-5 space-y-3">
        <Skeleton className="h-3 w-full" />

        <div className="max-w-4xl space-y-2">
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3xs" />
            <Skeleton className="h-3 w-xs" />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-amber-500">
              <StarIcon className="size-4 fill-current" />
              <StarIcon className="size-4 fill-current" />
              <StarIcon className="size-4 fill-current" />
              <StarIcon className="size-4 fill-current" />
              <StarIcon className="size-4 fill-current text-amber-300" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[68px_minmax(0,1fr)]">
          <div className="space-y-3">
            {productPreviewThumbs.map((thumbId) => (
              <Skeleton key={thumbId} className="size-18 rounded-2xl" />
            ))}
          </div>

          <Skeleton className="h-full w-full rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-medium text-sm">{value}</p>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="bg-gradient-to-br from-white to-slate-50" size="sm">
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </p>
        <p className="font-semibold text-2xl">{value}</p>
      </CardContent>
    </Card>
  )
}

function EntityPreviewCard({
  context,
  entity,
  getBadgeById,
  ranking
}: {
  context: DisplayContext
  entity: EntityPreview
  getBadgeById: (badgeId: string) => BadgeDefinition
  ranking: BadgeRankingConfig[]
}) {
  const renderedBadges = ranking.filter((item) =>
    entity.eligibleBadgeIds.includes(item.badgeId)
  )

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#082873] underline underline-offset-2">
            {entity.name}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 border", targetTone(context.target))}
        >
          {context.target}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {renderedBadges.map((item, index) => {
          const badge = getBadgeById(item.badgeId)
          return (
            <BadgeArtwork
              key={item.badgeId}
              badge={badge}
              contextPriority={item.priority}
              showCompactedSlot
              size="sm"
              visibleSlot={index + 1}
            />
          )
        })}
      </div>
    </div>
  )
}

function BadgeArtwork({
  badge,
  contextPriority,
  showCompactedSlot = false,
  showContextPriority = false,
  size = "md",
  visibleSlot
}: {
  badge: BadgeDefinition
  contextPriority?: number
  showCompactedSlot?: boolean
  showContextPriority?: boolean
  size?: "sm" | "md"
  visibleSlot?: number
}) {
  const artwork = getBadgeArtwork(badge)
  const Icon = artwork.Icon
  const isSmall = size === "sm"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold shadow-sm ring-1",
        isSmall ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-sm",
        artwork.className
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          isSmall ? "size-4" : "size-5",
          artwork.iconClassName
        )}
      >
        <Icon className={isSmall ? "size-3" : "size-3.5"} />
      </span>
      <span>{artwork.label}</span>
      {showContextPriority && contextPriority ? (
        <span className="ml-1 rounded-full bg-white/55 px-1.5 py-0.5 font-semibold text-[10px] text-current leading-none">
          #{contextPriority}
        </span>
      ) : null}
      {showCompactedSlot && visibleSlot ? (
        <span className="ml-1 rounded-full bg-white/55 px-1.5 py-0.5 font-semibold text-[10px] text-current leading-none">
          slot #{visibleSlot}
          {contextPriority && contextPriority !== visibleSlot
            ? ` from #${contextPriority}`
            : ""}
        </span>
      ) : null}
    </span>
  )
}

function formatPublishedAt(value: string | null) {
  if (!value) return "Not published yet"

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}
