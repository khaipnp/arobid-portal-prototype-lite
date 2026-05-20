<script lang="ts">
import { BadgeCheck, CircleDollarSign, Plane, Zap } from "lucide-svelte"
import { cn } from "$lib/utils.js"

const steps = [
  { icon: Zap, label: "Find Your Show", color: "text-emerald-500" },
  { icon: BadgeCheck, label: "Pick Your Spot", color: "text-sky-500" },
  {
    icon: CircleDollarSign,
    label: "Pick Solution Plan",
    color: "text-violet-500"
  },
  { icon: Plane, label: "Start Global Trading", color: "text-orange-500" }
]
</script>

<section class="container bg-white px-5 py-12 text-center mx-auto">
  <h2 class="font-semibold text-[#ed6203] text-xl">
    Standardized Booth Setup Process
  </h2>
  <p class="mt-2 text-[#6b7280] text-sm">
    A standardized setup flow that transforms buyers' discovery into
    exhibitors' lead growth.
  </p>
  <div class="mx-auto mt-10 grid max-w-[1284px] gap-6 md:grid-cols-4">
    {#each steps as { icon: Icon, label, color }, index}
      <div class="relative flex flex-col items-center gap-5">
        <div class="grid size-[72px] place-items-center rounded-full bg-white shadow-[0_18px_35px_rgba(0,0,0,0.08)]">
          <Icon class={cn("size-10", color)} />
        </div>
        <div class="grid size-6 place-items-center rounded-full bg-[#ffeae1] font-medium text-[#ed6203] text-xs">
          {index + 1}
        </div>
        <p class="font-semibold text-xl">{label}</p>
      </div>
    {/each}
  </div>
</section>
