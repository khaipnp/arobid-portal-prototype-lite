import { AlertTriangleIcon, InfoIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
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

export function ManagementStep({
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
        <h2 className="font-semibold text-xl leading-none">Management</h2>
        <p className="text-muted-foreground text-sm">
          Assign the manager, owning tenant, and where this expo appears.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Expo Owner</CardTitle>
          <CardAction>
            <Button
              type="button"
              className="p-0 text-legend capitalize"
              variant="link"
              size="xs"
              onClick={onRequestOwnerChange}
            >
              Change owner
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isEdit && !isChangingOwner && currentOwnerDisplay ? (
            <div className="flex items-center gap-3">
              <UserAvatar
                size="lg"
                name={currentOwnerDisplay.label}
                imageUrl={currentOwnerDisplay.imageUrl}
              />
              <div className="space-y-0.5">
                <p className="font-medium leading-none">
                  {currentOwnerDisplay.label}
                </p>
                <p className="font-normal text-muted-foreground text-sm">
                  {currentOwnerDisplay.email}
                </p>
              </div>
            </div>
          ) : null}

          {isChangingOwner ? (
            <>
              {isEdit ? (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                  <AlertTriangleIcon />
                  <AlertTitle>You are changing the owner</AlertTitle>
                  <AlertDescription>
                    Owner change is pending. Search and select a new owner
                    before saving.
                  </AlertDescription>
                </Alert>
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
                <p className="text-legend text-sm">
                  No user found for that search.
                </p>
              ) : null}
              {ownerPick ? (
                <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
                  <UserAvatar
                    name={ownerPick.name}
                    imageUrl={ownerPick.imageUrl}
                  />
                  <span className="min-w-0 flex-1">
                    Selected: <strong>{ownerPick.name}</strong> (
                    {ownerPick.email}
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
        </CardContent>
        <Separator />
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Tenant Management
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon size="16" className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                The owning tenant controls business ownership.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>
            Can skip if don't assign a tenant yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        <Separator />
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Display Positions
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon size="16" className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Display positions control where the expo is visible.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>
            Select at least one display position.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-56 overflow-y-auto rounded-2xl border">
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
        </CardContent>
      </Card>
    </div>
  )
}
