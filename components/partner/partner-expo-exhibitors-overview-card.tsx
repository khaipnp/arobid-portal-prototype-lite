import { ArrowRightIcon, Building2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import type { PartnerExpoExhibitorsWorkspace } from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

export function PartnerExpoExhibitorsOverviewCard({
  workspace,
  onViewAll
}: {
  workspace: PartnerExpoExhibitorsWorkspace
  onViewAll?: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Top Exhibitors</CardTitle>
            <CardDescription>
              {numberFormat.format(workspace.summary.exhibitorCount)} exhibitors
              · {numberFormat.format(workspace.summary.boothCount)} booths ·{" "}
              {currencyFormat.format(workspace.summary.paidAmount)} paid
            </CardDescription>
          </div>
          {onViewAll ? (
            <Button size="sm" variant="outline" onClick={onViewAll}>
              View all
              <ArrowRightIcon />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {workspace.topExhibitors.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
            No exhibitors yet.
          </div>
        ) : (
          workspace.topExhibitors.map((exhibitor) => (
            <div
              key={exhibitor.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2Icon className="h-4 w-4 text-muted-foreground" />
                  <p className="truncate font-medium text-sm">
                    {exhibitor.displayName}
                  </p>
                </div>
                <p className="truncate text-muted-foreground text-xs">
                  {exhibitor.contactEmail ?? "No contact email"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">
                  {numberFormat.format(exhibitor.boothCount)} booths
                </Badge>
                <span className="font-mono text-muted-foreground text-xs tabular-nums">
                  {currencyFormat.format(exhibitor.paidAmount)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
