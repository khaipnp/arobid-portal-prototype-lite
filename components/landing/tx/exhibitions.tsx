"use client";

import {
  ArrowRight,
  CalendarDays,
  Grid2X2,
  Heart,
  RadioIcon,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { asset, type HomeExpoCard } from "./data";

type ExhibitionsProps = {
  categories: string[];
  expos: HomeExpoCard[];
  isAuthenticated?: boolean;
};

export function Exhibitions({
  categories,
  expos,
  isAuthenticated = false,
}: ExhibitionsProps) {
  return (
    <section id="shows" className="container mx-auto bg-white py-16">
      <h2 className="text-center font-semibold text-3xl leading-10">
        Explore Industry Shows
      </h2>
      <div className="mt-10 flex gap-4 overflow-x-auto pb-1">
        {categories.map((category, index) => (
          <button
            type="button"
            key={category}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm",
              index === 0
                ? "border border-legend bg-[#ffeae1] text-legend"
                : "bg-[#f9fafb] text-foreground",
            )}
          >
            <Grid2X2 className="size-4" />
            {category}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {expos.map((expo) => (
          <ExpoCard
            key={expo.id}
            expo={expo}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
      <div className="mt-8 text-center">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 text-sm"
        >
          View More
          <ArrowRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

function ExpoCard({
  expo,
  isAuthenticated,
}: {
  expo: HomeExpoCard;
  isAuthenticated: boolean;
}) {
  const [isWishlisted, setIsWishlisted] = useState(!!expo.isWishlisted);
  const [isWishlistPending, setIsWishlistPending] = useState(false);
  const statusTone =
    expo.status === "Live"
      ? "bg-[#16a34a]"
      : expo.status === "Upcoming"
        ? "bg-[#f59e0b]"
        : "bg-[#9ca3af]";
  const countdownLabel = expo.status === "Upcoming" ? "Starts in" : "Ends in";

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to save expos to your wishlist");
      return;
    }

    const nextValue = !isWishlisted;
    setIsWishlisted(nextValue);
    setIsWishlistPending(true);
    try {
      const res = await fetch(
        nextValue
          ? "/api/wishlist"
          : `/api/wishlist?targetType=expo&targetId=${encodeURIComponent(expo.id)}`,
        {
          method: nextValue ? "POST" : "DELETE",
          headers: nextValue ? { "Content-Type": "application/json" } : {},
          body: nextValue
            ? JSON.stringify({ targetType: "expo", targetId: expo.id })
            : undefined,
        },
      );

      if (!res.ok) {
        setIsWishlisted(!nextValue);
        const payload = await res.json().catch(() => null);
        toast.error(payload?.error ?? "Could not update wishlist");
        return;
      }

      toast.success(
        nextValue
          ? "Expo saved to your wishlist"
          : "Expo removed from your wishlist",
      );
    } catch (_err) {
      setIsWishlisted(!nextValue);
      toast.error("Could not update wishlist");
    } finally {
      setIsWishlistPending(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-4xl">
      <CardContent className="space-y-4">
        <div className="relative h-56 overflow-hidden rounded-xl">
          <Link href={expo.detailHref} className="relative block size-full">
            <Image
              src={expo.image ?? asset("figma-expo-card.png")}
              alt=""
              width={2000}
              height={1000}
              className="aspect-2/1 object-cover"
            />
          </Link>
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
            <Badge
              className={cn("h-6 font-medium text-white text-xs", statusTone)}
            >
              <RadioIcon className="size-4" />
              {expo.status}
            </Badge>
            {expo.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-6 bg-white/80 font-medium"
              >
                {tag === "Hot pick" ? (
                  <Heart className="size-5 fill-rose-200 text-rose-400" />
                ) : (
                  <Sparkles className="size-3 text-sky-500" />
                )}
                {tag}
              </Badge>
            ))}
          </div>
          <button
            type="button"
            className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/80 text-muted transition hover:text-rose-600 disabled:opacity-60"
            disabled={isWishlistPending}
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted ? "Remove expo from wishlist" : "Save expo"
            }
            onClick={toggleWishlist}
          >
            <Heart
              className={cn(
                "size-5",
                isWishlisted && "fill-rose-500 text-rose-600",
              )}
            />
          </button>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 rounded-b-xl bg-black/40 px-3 py-2 text-white backdrop-blur">
            <div className="rounded-lg bg-white/30 p-2 text-white">
              <CalendarDays className="size-5" />
            </div>
            <div className="min-w-0 flex-1 text-xs leading-4">
              <p className="text-white/90">Duration</p>
              <p className="font-medium">{expo.durationLabel}</p>
            </div>
            <div className="hidden text-right text-xs leading-4 sm:block">
              <p className="text-white/90">{countdownLabel}</p>
              <p className="font-medium">{expo.countdown}</p>
            </div>
          </div>
        </div>
        <div>
          <Link
            href={expo.detailHref}
            className="line-clamp-2 min-h-14 font-medium text-lg leading-snug"
          >
            {expo.title}
          </Link>
          <p className="mt-1 text-muted-foreground text-sm">{expo.segment}</p>
        </div>
        <div className="grid grid-cols-3 gap-5 border-t pt-4 text-center">
          {["Exhibitors", "Visitors", "Products/Services"].map(
            (label, index) => (
              <div key={label}>
                <p className="font-medium text-legend text-lg leading-snug">
                  {expo.stats[index]}
                </p>
                <p className="text-muted-foreground text-xs">{label}</p>
              </div>
            ),
          )}
        </div>
      </CardContent>
    </Card>
  );
}
