<script lang="ts">
import { ArrowRight, Grid2X2 } from "lucide-svelte"
import { cn } from "$lib/utils.js"
import type { HomeExpoCard } from "./data.js"
import ExpoCard from "./expo-card.svelte"

let {
  categories,
  expos,
  isAuthenticated = false
} = $props<{
  categories: string[]
  expos: HomeExpoCard[]
  isAuthenticated?: boolean
}>()

let selectedCategory = $state(0)
</script>

<section id="shows" class="container mx-auto bg-white py-16 px-5">
  <h2 class="text-center font-semibold text-3xl leading-10">
    Explore Industry Shows
  </h2>
  <div class="mt-10 flex gap-4 overflow-x-auto pb-1">
    {#each categories as category, index}
      <button
        type="button"
        class={cn(
          "inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm transition",
          selectedCategory === index
            ? "border border-legend bg-[#ffeae1] text-legend"
            : "bg-[#f9fafb] text-foreground hover:bg-[#f3f4f6]"
        )}
        onclick={() => selectedCategory = index}
      >
        <Grid2X2 class="size-4" />
        {category}
      </button>
    {/each}
  </div>
  <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each expos as expo (expo.id)}
      <ExpoCard {expo} {isAuthenticated} />
    {/each}
  </div>
  <div class="mt-8 text-center">
    <button
      type="button"
      class="inline-flex h-10 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 text-sm hover:bg-[#f9fafb] transition"
    >
      View More
      <ArrowRight class="size-4" />
    </button>
  </div>
</section>
