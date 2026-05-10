"use client"

import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { VirtualLobbyDialog } from "@/components/tradexpo/expo-detail/virtual-lobby-dialog"

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem
} from "@/components/ui/carousel"
import { getAssetUrl } from "@/lib/image-utils"
import { cn } from "@/lib/utils"

export interface HeroExpoItem {
  title: string
  dateLabel: string
  slug: string
  detailHref: string
  actionHref?: string
  virtualLobbyUrl?: string
  backgroundImage?: string
}

export interface HeroProps {
  expos: HeroExpoItem[]
}

export function Hero({ expos }: HeroProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap())

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on("select", onSelect)

    // Auto slide every 10 seconds
    const intervalId = setInterval(() => {
      api.scrollNext()
    }, 10000)

    return () => {
      api.off("select", onSelect)
      clearInterval(intervalId)
    }
  }, [api])

  if (!expos || expos.length === 0) return null

  const activeExpo = expos[current]
  const nextExpo = expos[(current + 1) % expos.length]

  return (
    <div className="relative min-h-154 w-full overflow-hidden">
      {/* Background Sliding Layer */}
      <Carousel
        setApi={setApi}
        className="absolute inset-0 size-full"
        opts={{ loop: true }}
      >
        <CarouselContent className="ml-0 h-154">
          {expos.map((expo, index) => (
            <CarouselItem key={expo.slug} className="relative pl-0">
              <div className="relative size-full">
                <Image
                  src={getAssetUrl(
                    expo.backgroundImage,
                    expo.title,
                    1920,
                    1080
                  )}
                  alt={expo.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Static Overlay Layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 bottom-0 h-80 bg-linear-to-b from-black/0 to-black/80 backdrop-blur-[2px]" />

        <div className="container relative mx-auto flex h-full items-end justify-between gap-8 px-5 pb-10 md:pb-14">
          {/* Main Content - Updates based on activeExpo */}
          <div className="pointer-events-auto max-w-3xl pb-8 text-white">
            <p className="font-medium text-sm drop-shadow-lg transition-all duration-500">
              {activeExpo.dateLabel}
            </p>
            <h1 className="mt-2 max-w-2xl font-medium text-4xl leading-[1.15] tracking-normal drop-shadow-xl transition-all duration-500 md:text-[36px]">
              {activeExpo.title}
            </h1>

            <div className="mt-8 flex flex-wrap gap-4">
              <VirtualLobbyDialog
                src={activeExpo.virtualLobbyUrl}
                expoTitle={activeExpo.title}
              />
              <Link
                href={activeExpo.detailHref}
                className="inline-flex h-10 w-44 items-center justify-center rounded-full border border-white bg-white/10 font-medium text-white backdrop-blur"
              >
                View Detail
              </Link>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-end gap-4">
              <div className="font-normal text-lg">
                {String(current + 1).padStart(2, "0")}
                <span className="align-baseline text-[10px]">
                  /{String(expos.length).padStart(2, "0")}
                </span>
              </div>
              <div className="mb-2 flex items-center gap-1">
                {expos.map((_, i) => (
                  <button
                    type="button"
                    key={`hero-dot-${expos[i].slug}`}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      current === i
                        ? "h-1.5 w-6 bg-white"
                        : "size-1.5 bg-white/80"
                    )}
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Card for the NEXT expo */}
          {expos.length > 1 && (
            <article
              className="pointer-events-auto mb-8 hidden size-56 cursor-pointer overflow-hidden rounded-2xl bg-white p-1 shadow-2xl transition-all duration-500 hover:scale-105 lg:block"
              onClick={() => api?.scrollNext()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  api?.scrollNext()
                }
              }}
              aria-label={`Next expo: ${nextExpo.title}`}
            >
              <div className="relative h-28 w-full overflow-hidden rounded-xl">
                <Image
                  src={getAssetUrl(
                    nextExpo.backgroundImage,
                    nextExpo.title,
                    400,
                    225
                  )}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-2">
                <p className="font-medium text-[#6b7280] text-xs">
                  {nextExpo.dateLabel}
                </p>
                <h2 className="mt-1 line-clamp-2 font-medium text-sm leading-5">
                  {nextExpo.title}
                </h2>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
