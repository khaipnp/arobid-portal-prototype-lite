"use client"

import { HeartIcon, MessageCircleIcon, Share2Icon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

type ExhibitorCardActionsProps = {
  exhibitorId: string
  exhibitorCompany: string
  onChatClick?: () => void
}

export function ExhibitorCardActions({
  exhibitorId,
  exhibitorCompany,
  onChatClick
}: ExhibitorCardActionsProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const shareUrl = `https://arobid.com/exhibitor/${exhibitorId}`
  const shareText = `Check out ${exhibitorCompany} at TradeXpo`

  const shareItems = [
    {
      label: "Link",
      logoUrl:
        "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/link-icon-free-vector.jpg",
      href: shareUrl
    },
    {
      label: "Facebook",
      logoUrl:
        "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/Facebook_Logo_(2019).png.webp",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      label: "Zalo",
      logoUrl:
        "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/Icon_of_Zalo.svg.png",
      href: `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`
    },
    {
      label: "LinkedIn",
      logoUrl:
        "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/2496097.png",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
    },
    {
      label: "X",
      logoUrl: "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/X_logo.jpg",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      label: "Whatsapp",
      logoUrl:
        "https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/2496112.png",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
    }
  ]

  return (
    <div className="flex border-t pt-0.5">
      <Button
        type="button"
        variant="ghost"
        className="flex-1 rounded-lg font-medium text-muted-foreground hover:text-foreground"
        onClick={() => toast("You added the exhibitor to your wishlist")}
      >
        <HeartIcon />
        Wishlist
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="default"
        className="flex-1 rounded-lg font-medium text-muted-foreground hover:text-foreground"
        onClick={onChatClick}
      >
        <MessageCircleIcon /> Chat Now
      </Button>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 rounded-lg font-medium text-muted-foreground hover:text-foreground"
          >
            <Share2Icon />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-4xl p-6 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Share {exhibitorCompany}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="mx-auto flex w-fit flex-col items-center gap-2 rounded-xl p-3">
              <p className="select-none font-semibold text-lg">
                {exhibitorCompany}
              </p>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
                alt={`QR code for ${exhibitorCompany}`}
                width={180}
                height={180}
                unoptimized
                className="rounded-lg"
              />
              <Button size="sm" variant="secondary" className="rounded-full">
                Click to Download
              </Button>
            </div>
            <div className="grid grid-cols-6">
              {shareItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1"
                >
                  <Image
                    src={item.logoUrl ?? ""}
                    alt={item.label ?? ""}
                    width={1000}
                    height={1000}
                    className="size-10 rounded-full border border-gray-200 object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
