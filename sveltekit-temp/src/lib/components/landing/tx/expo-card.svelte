<script lang="ts">
import { CalendarDays, Heart, RadioIcon, Sparkles } from "lucide-svelte"
import { Badge } from "$lib/components/ui/badge/index.js"
import { Button } from "$lib/components/ui/button/index.js"
import * as Card from "$lib/components/ui/card/index.js"
import { cn } from "$lib/utils.js"
import { asset, type HomeExpoCard } from "./data.js"

let { expo, isAuthenticated } = $props<{
  expo: HomeExpoCard
  isAuthenticated: boolean
}>()

let isWishlisted = $state(!!expo.isWishlisted)
let isWishlistPending = $state(false)

const statusTone =
  expo.status === "Live"
    ? "bg-[#16a34a]"
    : expo.status === "Upcoming"
      ? "bg-[#f59e0b]"
      : "bg-[#9ca3af]"

const countdownLabel = expo.status === "Upcoming" ? "Starts in" : "Ends in"

const toggleWishlist = async () => {
  if (!isAuthenticated) {
    alert("Please login to save expos to your wishlist")
    return
  }

  const nextValue = !isWishlisted
  isWishlisted = nextValue
  isWishlistPending = true

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
          : undefined
      }
    )

    if (!res.ok) {
      isWishlisted = !nextValue
      const payload = await res.json().catch(() => null)
      console.error(payload?.error ?? "Could not update wishlist")
      return
    }
  } catch (_err) {
    isWishlisted = !nextValue
    console.error("Could not update wishlist")
  } finally {
    isWishlistPending = false
  }
}
</script>

<Card.Root class="overflow-hidden rounded-3xl shadow-[0_0_12px_rgba(0,0,0,0.08)] border-0">
  <div class="relative h-56 overflow-hidden rounded-xl">
    <a href={expo.detailHref}>
      <img
        src={expo.image ?? asset("figma-expo-card.png")}
        alt=""
        class="size-full object-cover bg-[#e6edf3]"
      />
    </a>
    <div class="absolute top-3 left-3 flex flex-wrap items-center gap-2">
      <Badge class={cn("h-6 font-medium text-white text-xs gap-1", statusTone)}>
        <RadioIcon class="size-4" />
        {expo.status}
      </Badge>
      {#each expo.tags as tag}
        <Badge variant="secondary" class="h-6 bg-white/80 font-medium gap-1">
          {#if tag === "Hot pick"}
            <Heart class="size-5 fill-rose-200 text-rose-400" />
          {:else}
            <Sparkles class="size-3 text-sky-500" />
          {/if}
          {tag}
        </Badge>
      {/each}
    </div>
    <button
      type="button"
      class="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/80 text-muted transition hover:text-rose-600 disabled:opacity-60"
      disabled={isWishlistPending}
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? "Remove expo from wishlist" : "Save expo"}
      onclick={toggleWishlist}
    >
      <Heart
        class={cn(
          "size-5",
          isWishlisted && "fill-rose-500 text-rose-600"
        )}
      />
    </button>
    <div class="absolute inset-x-0 bottom-0 flex items-center gap-3 rounded-b-xl bg-black/40 px-3 py-2 text-white backdrop-blur">
      <div class="rounded-lg bg-white/30 p-2 text-white">
        <CalendarDays class="size-5" />
      </div>
      <div class="min-w-0 flex-1 text-xs leading-4">
        <p class="text-white/90">Duration</p>
        <p class="font-medium">{expo.durationLabel}</p>
      </div>
      <div class="hidden text-right text-xs leading-4 sm:block">
        <p class="text-white/90">{countdownLabel}</p>
        <p class="font-medium">{expo.countdown}</p>
      </div>
    </div>
  </div>
  <Card.Content class="flex flex-col gap-4 px-5 py-4">
    <div>
      <a
        href={expo.detailHref}
        class="line-clamp-2 min-h-14 font-medium text-lg leading-7 hover:text-legend transition-colors"
      >
        {expo.title}
      </a>
      <p class="mt-1 text-muted-foreground text-xs">{expo.segment}</p>
    </div>
    <div class="grid grid-cols-3 gap-5 border-t pt-4 text-center">
      {#each ["Exhibitors", "Visitors", "Products/Services"] as label, index}
        <div>
          <p class="font-medium text-[#ed6203] text-base leading-6">
            {expo.stats[index]}
          </p>
          <p class="text-[#6b7280] text-xs">{label}</p>
        </div>
      {/each}
    </div>
    {#if expo.disabled}
      <Button
        disabled
        class="w-full bg-muted font-semibold text-muted-foreground hover:bg-muted cursor-not-allowed"
      >
        {expo.action}
      </Button>
    {:else}
      <a
        href={expo.href}
        class="inline-flex h-10 w-full items-center justify-center rounded-md bg-legend px-4 py-2 text-sm font-semibold text-white hover:bg-legend-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {expo.action}
      </a>
    {/if}
  </Card.Content>
</Card.Root>
