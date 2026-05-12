import { Badge } from "@/components/ui/badge"
import type { ExpoStatus, TemplateDerivedStatus } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

const templateStatusStyles: Record<TemplateDerivedStatus, string> = {
  Inactive: "border-zinc-300 bg-zinc-100 text-zinc-700",
  Draft: "border-slate-300 bg-slate-100 text-slate-700",
  Published: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Processing: "border-amber-300 bg-amber-100 text-amber-700",
  Failed: "border-rose-300 bg-rose-100 text-rose-700"
}

export function StatusBadge({ status }: { status: TemplateDerivedStatus }) {
  return (
    <Badge variant="outline" className={cn(templateStatusStyles[status])}>
      {status}
    </Badge>
  )
}

const expoStatusStyles: Record<ExpoStatus, string> = {
  Draft: "border-slate-300 bg-slate-100 text-slate-700",
  "Pending Review": "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700",
  Archived: "border-purple-300 bg-purple-100 text-purple-700",
  Canceled: "border-rose-300 bg-rose-100 text-rose-700"
}

export function ExpoStatusBadge({ status }: { status: ExpoStatus }) {
  return (
    <Badge variant="outline" className={cn(expoStatusStyles[status])}>
      {status}
    </Badge>
  )
}
