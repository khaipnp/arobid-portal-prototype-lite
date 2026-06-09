"use client"

import { HeartIcon, MessageCircleIcon, Share2Icon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
import { cn } from "@/lib/utils"

type ExhibitorCardActionsProps = {
  exhibitorId: string
  exhibitorCompany: string
  isAuthenticated?: boolean
  initialIsWishlisted?: boolean
  onChatClick?: () => void
}

export function ExhibitorCardActions({
  exhibitorId,
  exhibitorCompany,
  isAuthenticated = false,
  initialIsWishlisted = false,
  onChatClick
}: ExhibitorCardActionsProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted)
  const [isWishlistPending, setIsWishlistPending] = useState(false)
  const shareUrl = `https://arobid.com/exhibitor/${exhibitorId}`
  const shareText = `Check out ${exhibitorCompany} at TradeXpo`

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to save sellers to your wishlist")
      return
    }

    const nextValue = !isWishlisted
    setIsWishlisted(nextValue)
    setIsWishlistPending(true)
    try {
      const res = await fetch(
        nextValue
          ? "/api/wishlist"
          : `/api/wishlist?targetType=seller&targetId=${encodeURIComponent(exhibitorId)}`,
        {
          method: nextValue ? "POST" : "DELETE",
          headers: nextValue ? { "Content-Type": "application/json" } : {},
          body: nextValue
            ? JSON.stringify({ targetType: "seller", targetId: exhibitorId })
            : undefined
        }
      )

      if (!res.ok) {
        setIsWishlisted(!nextValue)
        const payload = await res.json().catch(() => null)
        toast.error(payload?.error ?? "Could not update wishlist")
        return
      }

      toast.success(
        nextValue
          ? "Seller saved to your wishlist"
          : "Seller removed from your wishlist"
      )
    } catch (_err) {
      setIsWishlisted(!nextValue)
      toast.error("Could not update wishlist")
    } finally {
      setIsWishlistPending(false)
    }
  }

  const shareItems = [
    {
      label: "Copy Link",
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
        size="md"
        className={cn(
          "flex-1 rounded-xl font-medium text-[13px] text-muted-foreground leading-none hover:text-foreground",
          isWishlisted && "text-rose-600 hover:text-rose-700"
        )}
        disabled={isWishlistPending}
        aria-pressed={isWishlisted}
        onClick={toggleWishlist}
      >
        <HeartIcon className={cn(isWishlisted && "fill-current")} />
        {isWishlisted ? "Saved" : "Wishlist"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="md"
        className="flex-1 rounded-xl font-medium text-[13px] text-muted-foreground leading-none hover:text-foreground"
        onClick={onChatClick}
      >
        <MessageCircleIcon size={16} /> Chat Now
      </Button>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="flex-1 rounded-xl font-medium text-[13px] text-muted-foreground leading-none"
          >
            <Share2Icon />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Share {exhibitorCompany}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="mx-auto flex w-fit flex-col items-center gap-2 rounded-xl p-3">
              <p className="select-none font-semibold text-lg line-clamp-2 max-w-3xs text-center">
                {exhibitorCompany}
              </p>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
                alt={`QR code for ${exhibitorCompany}`}
                width={132}
                height={132}
                unoptimized
                className="rounded-lg"
              />
              <Button size="sm" variant="secondary" className="rounded-full">
                Click to Download
              </Button>
            </div>
            <div className="grid grid-cols-6">
              {shareItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1.5"
                >
                  <Image
                    src={item.logoUrl ?? ""}
                    alt={item.label ?? ""}
                    width={1000}
                    height={1000}
                    className="size-9 rounded-full border border-gray-200 object-center"
                  />
                  <span className="line-clamp-2 font-medium text-xs">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
