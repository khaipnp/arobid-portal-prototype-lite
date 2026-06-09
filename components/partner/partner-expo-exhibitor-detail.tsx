import { Building2Icon, ExternalLinkIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import type { PartnerExpoExhibitorDetail } from "@/lib/partner/db"
import { Label } from "../ui/label"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function safeExternalHref(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function formatTopProduct(
  product: PartnerExpoExhibitorDetail["performance"]["topViewedProduct"]
) {
  return product
    ? `${product.productName} (${numberFormat.format(product.count)})`
    : "No data yet"
}

export function PartnerExpoExhibitorDetailView({
  detail
}: {
  detail: PartnerExpoExhibitorDetail
}) {
  const { exhibitor, registrations, orders } = detail
  const websiteHref = safeExternalHref(exhibitor.website)
  const ordersByRegistrationId = new Map(
    orders
      .filter((order) => order.registrationId)
      .map((order) => [order.registrationId, order])
  )
  const matchedOrderIds = new Set<string>()
  const orderItems = registrations.map((registration) => {
    const order = ordersByRegistrationId.get(registration.id) ?? null
    if (order) matchedOrderIds.add(order.id)
    return { registration, order }
  })
  const unmatchedOrders = orders.filter(
    (order) => !matchedOrderIds.has(order.id)
  )

  return (
    <div className="mt-6 space-y-8">
      <Card>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border">
            {exhibitor.logoUrl ? (
              <Image
                src={exhibitor.logoUrl}
                alt={exhibitor.displayName}
                width={512}
                height={512}
                className="size-16 bg-white object-contain p-1"
              />
            ) : (
              <Building2Icon className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-5">
            <div className="space-y-0.5">
              <h2 className="font-semibold text-xl">{exhibitor.displayName}</h2>
              <p className="text-muted-foreground text-sm">
                {exhibitor.address ?? "No address"}
              </p>
            </div>

            <div className="grid text-sm md:grid-cols-5">
              <Info label="Contact" value={exhibitor.contactName} />
              <Info label="Email" value={exhibitor.contactEmail} />
              <Info label="Phone" value={exhibitor.phone} />
              <Info label="Industry" value={exhibitor.industry} />
              <Info label="Tax ID" value={exhibitor.taxId} />
            </div>
          </div>
          {websiteHref ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={websiteHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-full"
              >
                Website
                <ExternalLinkIcon />
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>Performance</CardTitle>
          <CardDescription>
            Real engagement captured between expo start and end.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <PerformanceMetric
            label="RFQs received"
            value={numberFormat.format(detail.performance.rfqCount)}
          />
          <PerformanceMetric
            label="Chat events received"
            value={numberFormat.format(detail.performance.chatCount)}
          />
          <PerformanceMetric
            label="eProfile visits"
            value={numberFormat.format(detail.performance.eProfileVisits)}
          />
          <PerformanceMetric
            label="Most viewed product"
            value={formatTopProduct(detail.performance.topViewedProduct)}
          />
          <PerformanceMetric
            label="Most chatted product"
            value={formatTopProduct(detail.performance.topChattedProduct)}
          />
          <PerformanceMetric
            label="Most wishlisted product"
            value={formatTopProduct(detail.performance.topWishlistedProduct)}
          />
        </CardContent>
      </Card>

      {/* Orders */}
      <section className="space-y-4">
        <div>
          <h2 className="font-medium text-lg">Orders</h2>
          <p className="text-muted-foreground text-sm">
            Booth purchases and matched commercial records.
          </p>
        </div>

        <div className="space-y-3">
          {orderItems.length === 0 && unmatchedOrders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
              No booth registrations or matched orders.
            </div>
          ) : (
            <>
              {orderItems.map(({ registration, order }) => (
                <OrderItem
                  key={registration.id}
                  boothTier={registration.boothTier}
                  orderId={order?.id ?? null}
                  paymentMethod={order?.paymentMethod ?? null}
                  paymentStatus={order?.status ?? "No matched order"}
                  amount={order ? currencyFormat.format(order.amount) : "-"}
                  date={formatDateTime(
                    order?.updatedAt ?? registration.purchasedAt
                  )}
                />
              ))}

              {unmatchedOrders.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Other orders
                  </p>
                  {unmatchedOrders.map((order) => (
                    <OrderItem
                      key={order.id}
                      boothTier={order.boothTier ?? "Unknown tier"}
                      orderId={order.id}
                      paymentMethod={order.paymentMethod}
                      paymentStatus={order.status}
                      amount={currencyFormat.format(order.amount)}
                      date={formatDateTime(order.updatedAt)}
                    />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <Label className="font-normal text-muted-foreground">{label}</Label>
      <p className="flex items-center gap-1 truncate font-medium">
        {value || "-"}
      </p>
    </div>
  )
}

function OrderItem({
  boothTier,
  orderId,
  paymentMethod,
  paymentStatus,
  amount,
  date
}: {
  boothTier: string
  orderId: string | null
  paymentMethod: string | null
  paymentStatus: string
  amount: string
  date: string
}) {
  return (
    <Card>
      <CardHeader className="flex justify-between">
        {/* Order ID */}
        <Link href={`/orders/${orderId}`}>
          <CardTitle className="font-mono">{orderId}</CardTitle>
        </Link>

        {/* Payment Status */}
        <Badge variant={paymentStatus === "Paid" ? "default" : "secondary"}>
          {paymentStatus}
        </Badge>
      </CardHeader>
      <CardContent className="grid grid-cols-4">
        {/* Booth Tier */}
        <div className="space-y-1">
          <Label className="font-normal text-muted-foreground">
            Booth Tier
          </Label>
          <p className="text-base capitalize">{boothTier}</p>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <Label className="font-normal text-muted-foreground">Amount</Label>
          <p className="text-base capitalize">{amount}</p>
        </div>

        {/* Payment Method */}
        <div className="space-y-1">
          <Label className="font-normal text-muted-foreground">
            Payment Method
          </Label>
          <p className="text-base capitalize">
            {paymentMethod ?? "No payment method"}
          </p>
        </div>

        {/* Date */}
        <div className="space-y-1">
          <Label className="font-normal text-muted-foreground">Date</Label>
          <p className="text-base capitalize">{date}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <Label className="font-normal text-muted-foreground">{label}</Label>
      <p className="line-clamp-1 truncate text-base">{value}</p>
    </div>
  )
}
