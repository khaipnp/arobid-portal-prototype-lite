import {
  ArrowLeftIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CreditCardIcon,
  DoorOpenIcon,
  EyeIcon,
  InfoIcon,
  MapPinIcon,
  PackageCheckIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldAlertIcon,
  StoreIcon,
  TicketCheckIcon,
  UserRoundIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { CustomerOrderStatusBadge } from "@/components/orders/customer-order-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { getAssetUrl } from "@/lib/image-utils"
import type {
  BoothCustomization,
  BoothTemplate,
  Expo,
  Order,
  SellerBoothRegistration,
  SellerBoothStatus
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

type TimelinePhase = "Upcoming" | "Live" | "Archived"

const phaseStyles: Record<TimelinePhase, string> = {
  Upcoming: "border-amber-300 bg-amber-50 text-amber-800",
  Live: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Archived: "border-zinc-300 bg-zinc-100 text-zinc-700"
}

const boothStatusStyles: Record<SellerBoothStatus, string> = {
  "Pending Setup": "border-amber-300 bg-amber-50 text-amber-800",
  Configured: "border-blue-300 bg-blue-50 text-blue-700",
  Approved: "border-teal-300 bg-teal-50 text-teal-700",
  Live: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700"
}

const boothStatusIcon: Record<SellerBoothStatus, ReactNode> = {
  "Pending Setup": <CircleDashedIcon className="size-3.5" />,
  Configured: <CircleDotIcon className="size-3.5" />,
  Approved: <CheckCircle2Icon className="size-3.5" />,
  Live: <CheckCircle2Icon className="size-3.5" />,
  Ended: <CircleDashedIcon className="size-3.5" />
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso)
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount)
}

function slugifyExpoName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getPublicExpoHref(expo: Expo) {
  return `/expos/${expo.slug ?? slugifyExpoName(expo.name)}`
}

function getPaymentActionLabel(order: Order) {
  return order.status === "Pending Payment"
    ? "Complete Payment"
    : "View Payment"
}

function isApprovedForBoothSetup(status: SellerBoothStatus) {
  return status === "Approved" || status === "Live"
}

function findOrderForRegistration(
  registration: SellerBoothRegistration,
  expo: Expo,
  orders: Order[]
) {
  return orders.find((order) => {
    if (order.orderType !== "booth_registration") return false
    if (order.referenceId === registration.id) return true
    return (
      order.expoName === expo.name &&
      order.boothRef === registration.boothRef &&
      order.boothTier === registration.boothTier
    )
  })
}

function SummaryTile({
  icon,
  label,
  value
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 font-medium text-sm">{value}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  )
}

interface Props {
  expoId: string
  expo: Expo | null
  registrations: SellerBoothRegistration[]
  boothTemplates: BoothTemplate[]
  boothCustomizations: BoothCustomization[]
  customerOrders: Order[]
  sellerProfile: { name: string; email: string } | null
  timelinePhase: TimelinePhase | null
}

export function SellerExpoDetail({
  expoId,
  expo,
  registrations,
  boothTemplates,
  boothCustomizations,
  customerOrders,
  sellerProfile,
  timelinePhase
}: Props) {
  const boothTemplateMap = new Map<string, BoothTemplate>()
  for (const boothTemplate of boothTemplates) {
    boothTemplateMap.set(boothTemplate.id, boothTemplate)
  }

  const customizationMap = new Map<
    string,
    { publishStatus: string; hasTemplate: boolean }
  >()
  for (const customization of boothCustomizations) {
    customizationMap.set(customization.registrationId, {
      publishStatus: customization.publishStatus,
      hasTemplate: !!customization.selectedBoothTemplateId
    })
  }

  if (!expo || registrations.length === 0) {
    return (
      <Empty className="min-h-105 border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlertIcon />
          </EmptyMedia>
          <EmptyTitle className="text-base">Expo access unavailable</EmptyTitle>
          <EmptyDescription>
            This Expo is not part of your workspace My Expos list, or it is no
            longer available for your account.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/seller/my-expos">
              <ArrowLeftIcon className="size-4" />
              Back to My Expos
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const phase = timelinePhase ?? "Upcoming"
  const publicExpoHref = getPublicExpoHref(expo)
  const firstRegistration = registrations[0]
  const firstOrder = registrations
    .map((registration) =>
      findOrderForRegistration(registration, expo, customerOrders)
    )
    .find((order): order is Order => Boolean(order))
  const approvedRegistrations = registrations.filter((registration) =>
    isApprovedForBoothSetup(registration.status)
  )
  const isLobbyAvailable = phase === "Live" || phase === "Archived"

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative min-h-72">
            <Image
              src={expo.thumbnailUrl}
              alt={expo.name}
              fill
              priority
              sizes="(min-width: 1024px) calc(100vw - 640px), 100vw"
              className="aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-black/5" />
            <div className="relative flex min-h-65 flex-col justify-between p-5 text-white md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("border-white/35 bg-white/15 text-white")}
                >
                  User Workspace
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", phaseStyles[phase])}
                >
                  {phase}
                </Badge>
              </div>

              <div className="max-w-3xl">
                <h2 className="text-balance font-semibold text-2xl leading-tight md:text-3xl">
                  {expo.name}
                </h2>
                {expo.description ? (
                  <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-white/80">
                    {expo.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="grid content-between gap-4 border-t p-5 lg:border-t-0 lg:border-l">
            <div className="space-y-3">
              <h3 className="font-semibold text-base">Next actions</h3>
              <div className="grid gap-2">
                <Button asChild className="justify-between">
                  <Link href={publicExpoHref}>
                    <span className="inline-flex items-center gap-2">
                      <EyeIcon className="size-4" />
                      View Public Expo Detail
                    </span>
                    <ChevronRightIcon className="size-4" />
                  </Link>
                </Button>

                {isLobbyAvailable ? (
                  <Button asChild variant="outline" className="justify-between">
                    <Link href={publicExpoHref}>
                      <span className="inline-flex items-center gap-2">
                        <DoorOpenIcon className="size-4" />
                        Virtual Lobby
                      </span>
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </Button>
                ) : null}

                {approvedRegistrations[0] ? (
                  <Button asChild variant="outline" className="justify-between">
                    <Link
                      href={`/seller/my-expos/${expoId}/configure/${approvedRegistrations[0].id}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <SettingsIcon className="size-4" />
                        Configure Booth
                      </span>
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-muted-foreground text-sm">
                    Configure Booth becomes available after booth registration
                    is approved.
                  </div>
                )}

                {firstOrder ? (
                  <Button asChild variant="outline" className="justify-between">
                    <Link href={`/seller/orders/${firstOrder.id}`}>
                      <span className="inline-flex items-center gap-2">
                        <CreditCardIcon className="size-4" />
                        {getPaymentActionLabel(firstOrder)}
                      </span>
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          icon={<CalendarDaysIcon className="size-4" />}
          label="Expo timeline"
          value={`${formatDate(expo.startDate)} - ${formatDate(expo.endDate)}`}
        />
        <SummaryTile
          icon={<Building2Icon className="size-4" />}
          label="Organizer"
          value={expo.ownerEmail}
        />
        <SummaryTile
          icon={<TicketCheckIcon className="size-4" />}
          label="Participation"
          value={`${registrations.length} booth${registrations.length === 1 ? "" : "s"} registered`}
        />
        <SummaryTile
          icon={<PackageCheckIcon className="size-4" />}
          label="Primary booth"
          value={`${firstRegistration.boothRef} - ${firstRegistration.boothTier}`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-base">Participation summary</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Workspace context for this selected Expo.
              </p>
            </div>
            <Badge variant="outline" className={cn(phaseStyles[phase])}>
              {phase}
            </Badge>
          </div>

          <Separator className="my-4" />

          <div className="divide-y">
            <DetailRow
              label="Registered contact"
              value={
                <span className="inline-flex flex-col items-end">
                  <span className="inline-flex items-center gap-1.5">
                    <UserRoundIcon className="size-3.5 text-muted-foreground" />
                    {sellerProfile?.name ?? "Not available"}
                  </span>
                  {sellerProfile?.email ? (
                    <span className="font-normal text-muted-foreground text-xs">
                      {sellerProfile.email}
                    </span>
                  ) : null}
                </span>
              }
            />
            <DetailRow label="Participation status" value="Joined" />
            <DetailRow
              label="Booth setup eligibility"
              value={
                approvedRegistrations.length > 0
                  ? "Approved registration available"
                  : "Waiting for approved booth registration"
              }
            />
            <DetailRow
              label="Payment status"
              value={
                firstOrder ? (
                  <CustomerOrderStatusBadge status={firstOrder.status} />
                ) : (
                  "Not available"
                )
              }
            />
          </div>

          {!firstOrder ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-dashed bg-muted/30 p-3 text-muted-foreground text-sm">
              <InfoIcon className="mt-0.5 size-4 shrink-0" />
              Payment or order information is not available yet for this Expo
              participation.
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-base">
                Booth participation summary
              </h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Package, booth position, setup state, and order context.
              </p>
            </div>
            <Badge variant="outline">{registrations.length} booth rows</Badge>
          </div>

          <div className="mt-4 grid gap-3">
            {registrations.map((registration) => {
              const template = registration.boothTemplateId
                ? boothTemplateMap.get(registration.boothTemplateId)
                : undefined
              const customization = customizationMap.get(registration.id)
              const order = findOrderForRegistration(
                registration,
                expo,
                customerOrders
              )
              const canConfigure = isApprovedForBoothSetup(registration.status)

              return (
                <article
                  key={registration.id}
                  className="grid gap-4 rounded-lg border bg-background p-4 lg:grid-cols-[minmax(0,1fr)_220px]"
                >
                  <div className="flex gap-3">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      {template ? (
                        <Image
                          src={getAssetUrl(
                            null,
                            registration.boothTemplateId,
                            160,
                            120
                          )}
                          alt={template.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <StoreIcon className="size-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm">
                          Booth {registration.boothRef}
                        </h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 text-xs",
                            boothStatusStyles[registration.status]
                          )}
                        >
                          {boothStatusIcon[registration.status]}
                          {registration.status}
                        </Badge>
                      </div>

                      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <PackageCheckIcon className="size-4" />
                          <span className="text-foreground">
                            {registration.boothTier}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <MapPinIcon className="size-4" />
                          <span className="text-foreground">
                            {registration.slotId ?? "Position not assigned"}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <SettingsIcon className="size-4" />
                          <span className="text-foreground">
                            {!customization?.hasTemplate
                              ? "No template selected"
                              : customization.publishStatus === "Published"
                                ? "Published"
                                : "Draft"}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <ReceiptTextIcon className="size-4" />
                          <span className="text-foreground">
                            {order ? formatCurrency(order.amount) : "No order"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid content-start gap-2">
                    {order ? (
                      <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                        <span className="text-muted-foreground text-xs">
                          Payment
                        </span>
                        <CustomerOrderStatusBadge status={order.status} />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
                        Payment/order data not available.
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {canConfigure ? (
                        <Button asChild size="sm" className="flex-1">
                          <Link
                            href={`/seller/my-expos/${expoId}/configure/${registration.id}`}
                          >
                            <SettingsIcon className="size-4" />
                            Configure
                          </Link>
                        </Button>
                      ) : null}

                      {order ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/seller/orders/${order.id}`}>
                            {getPaymentActionLabel(order)}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
