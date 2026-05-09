"use client"

import { BoxIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type VirtualLobbyDialogProps = {
  src?: string
  expoTitle?: string
}

export function VirtualLobbyDialog({
  src = "https://arobidglobal.shapespark.com/foodexpo2025_lobby/",
  expoTitle = "Virtual Lobby",
}: VirtualLobbyDialogProps) {
  const autoplaySrc = src.includes("#") ? `${src}&autoplay` : `${src}#autoplay`
  const [open, setOpen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      iframeRef.current?.focus()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="items-center justify-center gap-2 rounded-full bg-legend shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_#f37b42]">
          <BoxIcon className="size-5" />
          Virtual Lobby
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="!top-0 !left-0 !h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 sm:!max-w-none gap-0 rounded-none p-0 ring-0 ring-transparent"
      >
        <DialogTitle className="sr-only">{expoTitle}</DialogTitle>
        <DialogDescription className="sr-only">
          Interactive 3D virtual lobby
        </DialogDescription>
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between bg-white px-4 lg:px-8">
            {/*Title*/}
            <h2 className="select-none font-semibold text-lg">{expoTitle}</h2>
            {/* Close modal */}
            <DialogClose asChild>
              <Button
                variant="secondary"
                size="icon-lg"
                className="rounded-full"
              >
                <XIcon className="size-4" />
              </Button>
            </DialogClose>
          </div>
          <iframe
            ref={iframeRef}
            title={expoTitle}
            src={autoplaySrc}
            className="h-full w-full border-0"
            loading="eager"
            tabIndex={-1}
            allow="gyroscope; accelerometer; xr-spatial-tracking; vr;"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
