import {
  ArrowRight,
  CalendarDays,
  Grid2X2,
  Heart,
  Sparkles,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { asset, type HomeExpoCard } from "./data";

type ExhibitionsProps = {
  categories: string[];
  expos: HomeExpoCard[];
};

export function Exhibitions({ categories, expos }: ExhibitionsProps) {
  return (
    <section id="shows" className="bg-white px-5 py-16 md:px-20">
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
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {expos.map((expo) => (
          <ExpoCard key={expo.title} expo={expo} />
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

function ExpoCard({ expo }: { expo: HomeExpoCard }) {
  const statusTone =
    expo.status === "Live"
      ? "bg-[#16a34a]"
      : expo.status === "Upcoming"
        ? "bg-[#f59e0b]"
        : "bg-[#9ca3af]";
  const countdownLabel = expo.status === "Upcoming" ? "Starts in" : "Ends in";

  return (
    <Card className="overflow-hidden rounded-2xl bg-white p-2 shadow-[0_0_12px_rgba(0,0,0,0.08)]">
      <div className="relative h-56 overflow-hidden rounded-xl">
        <Link href={expo.detailHref}>
          <Image
            src={expo.image ?? asset("figma-expo-card.png")}
            alt=""
            fill
            sizes="(min-width: 1280px) 396px, (min-width: 768px) 50vw, 100vw"
            className="size-full bg-[#e6edf3]"
          />
        </Link>
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "h-7 gap-1.5 rounded-full border-0 pr-3 pl-1.5 font-medium text-white text-xs",
              statusTone,
            )}
          >
            <Video className="size-4" />
            {expo.status}
          </Badge>
          {expo.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-7 gap-1.5 rounded-full border-0 bg-white/80 pr-3 pl-1.5 font-normal text-foreground text-xs"
            >
              {tag === "Hot pick" ? (
                <Heart className="size-5 fill-rose-100 text-rose-300" />
              ) : (
                <Sparkles className="size-3 text-sky-500" />
              )}
              {tag}
            </Badge>
          ))}
        </div>
        <Heart className="absolute top-3 right-3 size-7 text-white/65" />
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
      <CardContent className="flex flex-col gap-4 px-5 py-4">
        <div>
          <Link
            href={expo.detailHref}
            className="line-clamp-2 min-h-14 font-medium text-lg leading-7"
          >
            {expo.title}
          </Link>
          <p className="mt-1 text-[#6b7280] text-xs">{expo.segment}</p>
        </div>
        <div className="grid grid-cols-3 gap-5 border-[#e5e7eb] border-t pt-4 text-center">
          {["Exhibitors", "Visitors", "Products/Services"].map(
            (label, index) => (
              <div key={label}>
                <p className="font-medium text-[#ed6203] text-base leading-6">
                  {expo.stats[index]}
                </p>
                <p className="text-[#6b7280] text-xs">{label}</p>
              </div>
            ),
          )}
        </div>
        {expo.disabled ? (
          <Button
            disabled
            className="h-10 w-full bg-[#d1d5db] font-semibold text-[#9ca3af] hover:bg-[#d1d5db]"
          >
            {expo.action}
          </Button>
        ) : (
          <Button
            asChild
            className="h-10 w-full bg-[#ed6203] font-semibold text-white hover:bg-[#dd5a02]"
          >
            <Link href={expo.href}>{expo.action}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
