<script lang="ts">
import { cn } from "$lib/utils.js"

const strategic = [
  "V",
  "VTTA",
  "ITPC",
  "HCMC",
  "CSED",
  "ISC",
  "HMEA",
  "VIFSA",
  "WISA",
  "KORETOVIET"
]
const alliance = [
  "ACCG",
  "OCEAN USA",
  "VIC",
  "Viet",
  "EcoHub",
  "Camel",
  "Kocham",
  "High West",
  "Jardin",
  "Bamboo"
]

const doubledAlliance = [...alliance, ...alliance]
</script>

<section class="bg-white px-5 py-16 text-center">
  <h2 class="font-bold text-[32px] leading-10">Partners</h2>
  <p class="mt-10 font-medium">Strategic Partners</p>
  <div class="mx-auto mt-6 flex max-w-[900px] flex-wrap justify-center gap-x-[70px] gap-y-8">
    {#each strategic as name}
      <div class="grid size-20 place-items-center rounded-lg bg-white font-bold text-sm shadow-sm">
        <span class="text-[#ed6203]">{name}</span>
      </div>
    {/each}
  </div>
  <p class="mt-12 font-medium">
    Alliance Partners - Procurement Partners - Top Brands
  </p>
  <div class="mt-6 flex gap-10 overflow-hidden">
    {#each doubledAlliance as name, i (i + '-' + name)}
      <div
        class={cn(
          "grid place-items-center rounded-lg bg-white font-bold shadow-sm",
          "size-16 text-[11px] shrink-0"
        )}
      >
        <span class="text-[#ed6203]">{name}</span>
      </div>
    {/each}
  </div>
</section>
