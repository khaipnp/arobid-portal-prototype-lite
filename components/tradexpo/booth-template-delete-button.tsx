"use client"

import { Trash2Icon } from "lucide-react"
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
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteBoothTemplate } from "@/lib/tradexpo/actions/booth-templates"

export function BoothTemplateDeleteButton({
  templateId,
  templateName
}: {
  templateId: string
  templateName: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteBoothTemplate(templateId)
        setOpen(false)
        router.push("/admin/tradexpo/booth-templates")
        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete template"
        )
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="md" className="rounded-full">
          Move to Trash
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete template?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove booth template {templateName} and its linked
            unused assets.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-rose-600 text-sm">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
          >
            {pending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
