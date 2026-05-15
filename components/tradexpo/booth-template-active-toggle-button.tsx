"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toggleBoothTemplateActive } from "@/lib/tradexpo/actions/booth-templates"
import { Switch } from "../ui/switch"

export function BoothTemplateActiveToggleButton({
  templateId,
  isActive
}: {
  templateId: string
  isActive: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  return (
    <Switch
      checked={isActive}
      disabled={pending}
      onCheckedChange={() => {
        startTransition(async () => {
          await toggleBoothTemplateActive(templateId)
          router.refresh()
        })
      }}
    />
  )
}
