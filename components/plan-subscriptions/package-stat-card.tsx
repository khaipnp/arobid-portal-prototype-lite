import { Card, CardContent } from "@/components/ui/card"

export function PackageStatCard({
  title,
  value,
  note,
  icon
}: {
  title: string
  value: string | number
  note: string
  icon: React.ReactNode
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="font-medium text-muted-foreground text-sm">{title}</p>
            <p className="truncate font-semibold text-2xl tracking-tight tabular-nums">
              {value}
            </p>
            <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
              {note}
            </p>
          </div>
          <div className="rounded-md border bg-muted/40 p-2 text-muted-foreground [&_svg]:size-4">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
