<script lang="ts">
import { Check } from "lucide-svelte"
import { cn } from "$lib/utils.js"
import { asset, plans } from "./data.js"
</script>

<section
  id="pricing"
  class="overflow-hidden bg-[linear-gradient(180deg,#fff_3%,#ffe0d2_54%,#fff_109%)] px-5 py-16 md:px-[78px]"
>
  <h2 class="text-center font-semibold text-[#ed6203] text-[32px] leading-10">
    Virtual Booth Solutions
  </h2>
  <div class="mx-auto mt-10 grid max-w-[1284px] gap-10 lg:grid-cols-3">
    {#each plans as plan}
      <article
        class={cn(
          "relative overflow-hidden rounded-2xl border-2 bg-white/80 p-2 backdrop-blur-sm",
          plan.featured
            ? "border-[#ed6203] shadow-[0_0_24px_rgba(0,0,0,0.08)]"
            : "border-white"
        )}
      >
        <div class="relative h-[166px] overflow-hidden rounded-xl bg-[#e6edf3]">
          <img
            src={asset(plan.image)}
            alt=""
            class="size-full object-cover"
          />
          <div class="absolute inset-0 grid place-items-center">
            <span class="rounded-full bg-black/45 px-4 py-3 text-white text-xl backdrop-blur">
              3D
            </span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-xl">{plan.name}</h3>
          <p class="mt-2 min-h-10 text-[#6b7280] text-xs leading-4">
            {plan.description}
          </p>
          <div class="mt-4 flex items-baseline gap-4">
            <span class="text-xs">Only from</span>
            <span class="font-semibold text-3xl">{plan.price}</span>
          </div>
        </div>
        <div class="rounded-xl border border-[#f3f4f6] bg-white p-4">
          <ul class="space-y-2">
            {#each plan.features as feature}
              <li class="flex items-center gap-3 text-sm">
                <Check class="size-4 text-emerald-600" />
                <span
                  class={cn(
                    /^[0-9]|Product Listing/.test(feature) ? "font-semibold" : ""
                  )}
                >
                  {feature}
                </span>
              </li>
            {/each}
          </ul>
          <button
            type="button"
            class="mt-6 h-10 w-full rounded-full bg-[#f3f4f6] font-medium text-sm hover:bg-[#e5e7eb] transition"
          >
            Explore Exhibitions
          </button>
        </div>
      </article>
    {/each}
  </div>
</section>
