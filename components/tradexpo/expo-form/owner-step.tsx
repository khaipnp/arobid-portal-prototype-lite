import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { UserAvatar } from "@/components/user-avatar"
import {
  AROBID_DISPLAY_TARGET_ID,
  AROBID_DISPLAY_TARGET_LABEL
} from "@/lib/tradexpo/tenant-display"
import type { ExpoTenantOption } from "@/lib/tradexpo/types"
import type { OwnerDisplay, OwnerPick } from "./types"

type OwnerStepProps = {
  isEdit: boolean
  isChangingOwner: boolean
  currentOwnerDisplay: OwnerDisplay | null
  ownerQuery: string
  onOwnerQueryChange: (value: string) => void
  ownerResults: OwnerPick[]
  ownerPick: OwnerPick | null
  onOwnerPickChange: (owner: OwnerPick | null) => void
  ownerLoading: boolean
  tenantOptions: ExpoTenantOption[]
  tenantPartnerOrgId: string
  onTenantPartnerOrgIdChange: (value: string) => void
  displayTargetIds: string[]
  onToggleDisplayTarget: (id: string) => void
  onRequestOwnerChange: () => void
}

export function OwnerStep({
  isEdit,
  isChangingOwner,
  currentOwnerDisplay,
  ownerQuery,
  onOwnerQueryChange,
  ownerResults,
  ownerPick,
  onOwnerPickChange,
  ownerLoading,
  tenantOptions,
  tenantPartnerOrgId,
  onTenantPartnerOrgIdChange,
  displayTargetIds,
  onToggleDisplayTarget,
  onRequestOwnerChange
}: OwnerStepProps) {
  const displayTargets = [
    { id: AROBID_DISPLAY_TARGET_ID, name: AROBID_DISPLAY_TARGET_LABEL },
    ...tenantOptions
  ]
  const selectedTenant = tenantOptions.find(
    (tenant) => tenant.id === tenantPartnerOrgId
  )

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl leading-none">Expo owner</h2>
        <p className="text-muted-foreground text-sm">
          Assign the manager, owning tenant, and where this expo appears.
        </p>
      </div>
      <div className="space-y-3">
        {isEdit && !isChangingOwner && currentOwnerDisplay ? (
          <div className="flex flex-col gap-3 rounded-md border px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={currentOwnerDisplay.label}
                imageUrl={currentOwnerDisplay.imageUrl}
                className="h-8 w-8 rounded-full"
              />
              <div>
                <p>
                  <strong>{currentOwnerDisplay.label}</strong> (
                  {currentOwnerDisplay.email})
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="text-legend"
              variant="ghost"
              size="xs"
              onClick={onRequestOwnerChange}
            >
              Change owner
            </Button>
          </div>
        ) : null}

        {isChangingOwner ? (
          <>
            {isEdit ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Owner change is pending. Search and select a new owner before
                saving.
              </p>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="owner-q">Owner email</Label>
              <Input
                id="owner-q"
                value={ownerQuery}
                onChange={(e) => {
                  onOwnerQueryChange(e.target.value)
                  onOwnerPickChange(null)
                }}
                placeholder="Type at least 2 characters…"
                autoComplete="off"
              />
            </div>
            {ownerLoading ? (
              <p className="text-muted-foreground text-xs">Searching…</p>
            ) : null}
            {ownerResults.length > 0 && !ownerPick ? (
              <ul className="space-y-2">
                {ownerResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onOwnerPickChange(u)
                        onOwnerQueryChange(u.email)
                      }}
                      className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted/50"
                    >
                      <UserAvatar
                        name={u.name}
                        imageUrl={u.imageUrl}
                        className="h-8 w-8 rounded-full"
                      />
                      <span>
                        <span className="font-medium">{u.name}</span>
                        <span className="block text-muted-foreground">
                          {u.email}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {ownerQuery.trim().length >= 2 &&
            !ownerLoading &&
            ownerResults.length === 0 &&
            !ownerPick ? (
              <p className="text-amber-700 text-sm">
                No user found for that search.
              </p>
            ) : null}
            {ownerPick ? (
              <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
                <UserAvatar
                  name={ownerPick.name}
                  imageUrl={ownerPick.imageUrl}
                  className="h-8 w-8 rounded-full"
                />
                <span className="min-w-0 flex-1">
                  Selected: <strong>{ownerPick.name}</strong> ({ownerPick.email}
                  )
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    onOwnerPickChange(null)
                    onOwnerQueryChange("")
                  }}
                >
                  Change
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="space-y-4 rounded-lg border bg-card px-4 py-4">
        <div className="space-y-1">
          <h3 className="font-medium text-sm">Tenant and display</h3>
          <p className="text-muted-foreground text-xs">
            The owning tenant controls business ownership. Display positions
            control where the expo is visible.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Owning tenant</Label>
          <Select
            value={tenantPartnerOrgId || undefined}
            onValueChange={(nextTenantId) => {
              onTenantPartnerOrgIdChange(nextTenantId)
              if (!displayTargetIds.includes(nextTenantId)) {
                onToggleDisplayTarget(nextTenantId)
              }
            }}
            disabled={tenantOptions.length === 0}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenantOptions.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tenantOptions.length === 0 ? (
            <p className="text-amber-600 text-xs">
              No active tenant organization found. Create one in Partner
              Organizations first.
            </p>
          ) : selectedTenant ? (
            <p className="text-muted-foreground text-xs">
              Expo belongs to {selectedTenant.name}.
            </p>
          ) : (
            <p className="text-amber-600 text-xs">Select a tenant.</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Display positions</Label>
          <div className="max-h-56 overflow-y-auto rounded-lg border">
            {displayTargets.map((target) => {
              const checkboxId = `display-target-${target.id}`
              return (
                <label
                  key={target.id}
                  htmlFor={checkboxId}
                  className="flex cursor-pointer items-start gap-2 rounded px-3 py-2 text-sm hover:bg-muted/60"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={displayTargetIds.includes(target.id)}
                    onCheckedChange={() => onToggleDisplayTarget(target.id)}
                  />
                  <span className="grid gap-0.5">
                    <span className="font-medium">{target.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {target.id === AROBID_DISPLAY_TARGET_ID
                        ? "Show on the main Arobid experience."
                        : "Show on this tenant experience."}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
          {displayTargetIds.length === 0 ? (
            <p className="text-amber-600 text-xs">
              Select at least one display position.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
