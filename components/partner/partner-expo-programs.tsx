"use client"

import type { PartnerAccess } from "@/lib/partner/access"
import type { PartnerExpoProgramsWorkspace } from "@/lib/partner/db"
import { PartnerExpoList } from "./partner-expo-list"

export function PartnerExpoPrograms({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerExpoProgramsWorkspace
}) {
  return (
    <div className="mt-6 space-y-4">
      <PartnerExpoList
        access={access}
        assignedExpos={workspace.assignedExpos}
      />
    </div>
  )
}
