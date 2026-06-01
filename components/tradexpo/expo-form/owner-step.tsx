import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  onRequestOwnerChange
}: OwnerStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-lg leading-none">Expo owner</h2>
        <p className="text-muted-foreground text-sm">
          Changing owner requires confirmation, then selecting a new user from
          search results.
        </p>
      </div>
      <div className="space-y-3">
        {isEdit && !isChangingOwner && currentOwnerDisplay ? (
          <div className="flex flex-col gap-3 rounded-md border px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground text-xs">Current owner</p>
              <p>
                <strong>{currentOwnerDisplay.label}</strong> (
                {currentOwnerDisplay.email})
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
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
                      className="w-full rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted/50"
                    >
                      <span className="font-medium">{u.name}</span>
                      <span className="block text-muted-foreground">
                        {u.email}
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
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
                Selected: <strong>{ownerPick.name}</strong> ({ownerPick.email})
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-7"
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
    </div>
  )
}
