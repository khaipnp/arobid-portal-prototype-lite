import { CheckIcon, Edit3Icon, PackageCheckIcon } from "lucide-react"
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
import type { ExpoPackageDisplay } from "@/lib/tradexpo/types"

const numberFormat = new Intl.NumberFormat("en")

function formatPackagePrice(price: number, currency: string) {
  const safeCurrency = (currency || "VND").trim().toUpperCase()
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: safeCurrency === "VND" ? 0 : 2
    }).format(price)
  } catch {
    return `${new Intl.NumberFormat("vi-VN").format(price)} ${safeCurrency}`
  }
}

function getSourceLabel(source: ExpoPackageDisplay["source"]) {
  return source === "inline_created" ? "Event-bound" : "Linked"
}

export function PartnerExpoPackageOverviewCard({
  packages,
  canEdit,
  editHref
}: {
  packages: ExpoPackageDisplay[]
  canEdit: boolean
  editHref: string
}) {
  const sortedPackages = packages
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const publicPackages = sortedPackages.filter((pkg) => pkg.isPublic).length
  const featuredPackage = sortedPackages.find((pkg) => pkg.isFeatured)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Expo Packages</CardTitle>
            <CardDescription>
              Package pricing, visibility and seller benefits shown on Expo
              Detail.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {numberFormat.format(publicPackages)} public
            </Badge>
            {canEdit ? (
              <Button asChild size="xs" variant="outline">
                <Link href={editHref}>
                  <Edit3Icon />
                  Edit packages
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedPackages.length === 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed p-4 text-muted-foreground text-sm">
            <PackageCheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                No packages configured
              </p>
              <p>
                {canEdit
                  ? "Add packages while this expo is still editable."
                  : "Package setup is not available for this expo state."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sortedPackages.map((pkg) => (
              <article
                key={pkg.id}
                className="flex flex-col rounded-2xl border bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold text-base leading-6">
                      {pkg.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={pkg.isPublic ? "default" : "outline"}>
                        {pkg.isPublic ? "Public" : "Hidden"}
                      </Badge>
                      {pkg.isFeatured ? (
                        <Badge variant="secondary">Featured</Badge>
                      ) : null}
                      <Badge variant="outline">
                        {getSourceLabel(pkg.source)}
                      </Badge>
                    </div>
                  </div>
                  <p className="font-semibold text-sm tabular-nums">
                    {formatPackagePrice(pkg.price, pkg.priceUnit)}
                  </p>
                </div>

                {pkg.description ? (
                  <p className="mt-3 line-clamp-2 text-muted-foreground text-sm">
                    {pkg.description}
                  </p>
                ) : null}

                <ul className="mt-4 space-y-2 text-sm">
                  {pkg.benefits.slice(0, 3).map((benefit) => (
                    <li key={`${pkg.id}-${benefit}`} className="flex gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                {pkg.benefits.length > 3 ? (
                  <p className="mt-2 text-muted-foreground text-xs">
                    +{pkg.benefits.length - 3} more benefits
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}

        {featuredPackage ? (
          <p className="text-muted-foreground text-xs">
            Featured package: {featuredPackage.name}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
