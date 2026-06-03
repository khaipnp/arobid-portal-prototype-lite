import { Building2Icon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item"
import type { PartnerExpoExhibitorsWorkspace } from "@/lib/partner/db"

const _numberFormat = new Intl.NumberFormat("en")
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
            <CardDescription>Base on view</CardDescription>
          </div>
          {onViewAll ? (
            <Button size="xs" variant="outline" onClick={onViewAll}>
              View all
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
            <Item key={exhibitor.id} variant="muted" size="default">
              <ItemMedia
                variant="image"
                className="rounded-full border bg-muted/50"
              >
                {exhibitor.logoUrl ? (
                  <Image
                    src={exhibitor.logoUrl}
                    alt=""
                    width={256}
                    height={256}
                  />
                ) : (
                  <Building2Icon className="h-4 w-4 text-muted-foreground" />
                )}
              </ItemMedia>

              <ItemContent className="min-w-0">
                <ItemTitle className="truncate font-sans">
                  {exhibitor.displayName}
                </ItemTitle>
              </ItemContent>
              <ItemActions className="shrink-0">
                <span>{exhibitor.boothCount} views</span>
              </ItemActions>
            </Item>
          ))
        )}
      </CardContent>
    </Card>
  )
}
