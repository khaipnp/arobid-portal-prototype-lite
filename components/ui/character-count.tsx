import { cn } from "@/lib/utils"

type CharacterCountProps = {
  currentLength: number
  maxLength: number
  align?: "left" | "right"
  className?: string
}

export function CharacterCount({
  currentLength,
  maxLength,
  align = "right",
  className
}: CharacterCountProps) {
  const remaining = Math.max(maxLength - currentLength, 0)
  const isNearLimit = remaining <= Math.min(10, maxLength)
  const isAtLimit = remaining === 0

  return (
    <p
      className={cn(
        "text-xs",
        align === "right" ? "text-right" : "text-left",
        isAtLimit
          ? "text-destructive"
          : isNearLimit
            ? "text-amber-600"
            : "text-muted-foreground",
        className
      )}
    >
      {remaining} characters left
    </p>
  )
}
