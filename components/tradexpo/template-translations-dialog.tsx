"use client"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { TranslationRecord } from "@/lib/tradexpo/types"

interface Props {
  templateName: string
  initialTranslations: TranslationRecord[]
}

export function TemplateTranslationsDialog({
  templateName,
  initialTranslations
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [translations, setTranslations] = React.useState<TranslationRecord[]>(
    () => initialTranslations.map((tr) => ({ ...tr }))
  )
  const [languageCode, setLanguageCode] = React.useState("vi")
  const [name, setName] = React.useState("")

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedCode = languageCode.trim().toLowerCase()
    if (!normalizedCode || !name.trim()) return

    setTranslations((current) => {
      const exists = current.some(
        (tr) => tr.languageCode.toLowerCase() === normalizedCode
      )
      if (exists) {
        return current.map((tr) =>
          tr.languageCode.toLowerCase() === normalizedCode
            ? { ...tr, name: name.trim() }
            : tr
        )
      }
      return [...current, { languageCode: normalizedCode, name: name.trim() }]
    })

    setName("")
  }

  function handleRemove(code: string) {
    setTranslations((current) =>
      current.filter((tr) => tr.languageCode !== code)
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="mt-3"
      >
        Manage Translations
        {translations.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {translations.length}
          </Badge>
        )}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setName("")
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Translations — {templateName}</DialogTitle>
            <DialogDescription>
              Add or update localized names. Falls back to the default name when
              no translation exists for a locale.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleAdd}>
            <Input
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value.toLowerCase())}
              placeholder="language code (vi, ja)"
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="translated name"
            />
            <Button type="submit">Add</Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Language</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-3 text-muted-foreground"
                    >
                      No translations yet. Add one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  translations.map((tr) => (
                    <TableRow key={tr.languageCode}>
                      <TableCell>{tr.languageCode}</TableCell>
                      <TableCell>{tr.name}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="xs" variant="destructive">
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent size="sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove translation?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This translation entry will be deleted from this
                                template.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleRemove(tr.languageCode)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
