"use client"

import { PencilIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { ExpoStatus } from "@/lib/tradexpo/types"

type ConfirmKind = "approve" | "archive" | "delete"

export function ExpoDetailActions({
  expoId,
  name,
  ownerEmail,
  status
}: {
  expoId: string
  name: string
  ownerEmail: string
  status: ExpoStatus
}) {
  const router = useRouter()
  const [confirmKind, setConfirmKind] = React.useState<ConfirmKind | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  async function runConfirm() {
    if (!confirmKind) return
    setBusy(true)
    setNotice(null)
    try {
      if (confirmKind === "delete") {
        const res = await fetch(`/api/tradexpo/expos/${expoId}`, {
          method: "DELETE"
        })
        if (!res.ok) {
          setNotice({ type: "error", text: "Could not delete expo." })
          return
        }
        router.push("/admin/tradexpo/expos")
        router.refresh()
        return
      }

      const nextStatus: ExpoStatus =
        confirmKind === "approve" ? "Live" : "Archived"
      const res = await fetch(`/api/tradexpo/expos/${expoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      })
      if (!res.ok) {
        setNotice({
          type: "error",
          text:
            confirmKind === "approve"
              ? "Could not approve expo."
              : "Could not archive expo."
        })
        return
      }

      if (confirmKind === "approve") {
        setNotice({
          type: "success",
          text: `"${name}" is now Live. Approval notification sent to ${ownerEmail}.`
        })
      } else {
        setNotice({
          type: "success",
          text: `"${name}" has been archived.`
        })
      }
      setConfirmKind(null)
      router.refresh()
    } catch {
      setNotice({ type: "error", text: "Network error. Please try again." })
    } finally {
      setBusy(false)
    }
  }

  const dialogCopy =
    confirmKind === "approve"
      ? {
          title: "Approve expo?",
          description: `This will set "${name}" to Live and notify the owner at ${ownerEmail}.`,
          actionLabel: "Approve",
          destructive: false
        }
      : confirmKind === "archive"
        ? {
            title: "Archive expo?",
            description: `"${name}" will be archived and removed from the public listing.`,
            actionLabel: "Archive",
            destructive: false
          }
        : confirmKind === "delete"
          ? {
              title: "Delete expo?",
              description: `This will permanently delete "${name}". This action cannot be undone.`,
              actionLabel: "Delete",
              destructive: true
            }
          : null

  const canArchive = status !== "Archived" && status !== "Canceled"

  return (
    <div className="space-y-3">
      {notice ? (
        <p
          className={
            notice.type === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 text-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800 text-sm dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
          }
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/tradexpo/expos/${expoId}/edit`}>
            <PencilIcon className="mr-1.5 size-4" />
            Edit
          </Link>
        </Button>
        {status === "Pending Review" ? (
          <Button
            size="sm"
            onClick={() => setConfirmKind("approve")}
            disabled={busy}
          >
            Approve
          </Button>
        ) : null}
        {canArchive ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmKind("archive")}
            disabled={busy}
          >
            Archive
          </Button>
        ) : null}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmKind("delete")}
          disabled={busy}
        >
          Delete
        </Button>
      </div>

      <AlertDialog
        open={confirmKind !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null)
        }}
      >
        <AlertDialogContent>
          {dialogCopy ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{dialogCopy.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {dialogCopy.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className={
                    dialogCopy.destructive
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : undefined
                  }
                  disabled={busy}
                  onClick={(e) => {
                    e.preventDefault()
                    void runConfirm()
                  }}
                >
                  {dialogCopy.actionLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
