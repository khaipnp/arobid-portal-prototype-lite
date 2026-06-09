"use client"

import { SearchIcon, XIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { PartnerExpoExhibitorsWorkspace } from "@/lib/partner/db"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "../ui/input-group"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

function _formatDate(iso: string | null) {
  if (!iso) return "No purchase date"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

export function PartnerExpoExhibitorsTable({
  expoId,
  workspace
}: {
  expoId: string
  workspace: PartnerExpoExhibitorsWorkspace
}) {
  const [query, setQuery] = useState("")
  const [tier, setTier] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("all")

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return workspace.exhibitors.filter((exhibitor) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          exhibitor.displayName,
          exhibitor.contactName,
          exhibitor.contactEmail,
          exhibitor.website,
          exhibitor.address
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery))

      const matchesTier =
        tier === "all" ||
        exhibitor.tierMix[tier as keyof typeof exhibitor.tierMix] > 0

      const matchesPaymentStatus =
        paymentStatus === "all" || exhibitor.paymentStatus === paymentStatus

      return matchesQuery && matchesTier && matchesPaymentStatus
    })
  }, [paymentStatus, query, tier, workspace.exhibitors])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Exhibitors"
          value={workspace.summary.exhibitorCount}
        />

        <MetricCard
          title="Booths Purchased"
          value={workspace.summary.boothCount}
        />

        <MetricCard
          title="Paid revenue"
          value={currencyFormat.format(workspace.summary.paidAmount)}
        />
      </div>

      <h2 className="font-semibold text-2xl">Exhibitors</h2>
      <div className="flex gap-2">
        {/* Search */}
        <InputGroup className="max-w-xs">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company or contact"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                className="rounded-full"
                onClick={() => setQuery("")}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {/* Filter Tier */}
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger>
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            <SelectItem value="Basic">Basic</SelectItem>
            <SelectItem value="Professional">Professional</SelectItem>
            <SelectItem value="Premium">Premium</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Payment Status */}
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="No order">No order</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {workspace.exhibitors.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
          No booth registrations for this expo yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Booths</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((exhibitor) => (
                <TableRow key={exhibitor.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/partner/expo-program/expos/${expoId}/exhibitors/${exhibitor.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      {exhibitor.logoUrl ? (
                        <Image
                          src={exhibitor.logoUrl}
                          alt={exhibitor.displayName}
                          width={256}
                          height={256}
                          className="size-10 rounded-lg border bg-white object-contain p-0.5"
                        />
                      ) : null}
                      {exhibitor.displayName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{exhibitor.contactName}</div>
                    <div className="text-muted-foreground text-xs">
                      {exhibitor.contactEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {numberFormat.format(exhibitor.publishedBoothCount)} /{" "}
                      {numberFormat.format(exhibitor.boothCount)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-44 truncate">
                    {exhibitor.boothRefs.join(", ")}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        exhibitor.paymentStatus === "Paid"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {exhibitor.paymentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value
}: {
  title: string
  value: number | string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle>
          {typeof value === "number" ? numberFormat.format(value) : value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
