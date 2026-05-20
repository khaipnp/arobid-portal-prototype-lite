<script lang="ts">
import { ArrowRight, Building2, Store, Users } from "lucide-svelte"
import { cn } from "$lib/utils.js"
</script>

<section
  id="ecosystem"
  class="grid min-h-[713px] items-center gap-5 overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#fff_0,#e4e7ff_100%)] px-5 py-12 md:px-[78px] lg:grid-cols-[384px_1fr]"
>
  <div>
    <h2 class="font-bold text-[#2d2d2d] text-[32px] leading-10">
      Comprehensive Trade Ecosystem
    </h2>
    <p class="mt-6 text-foreground leading-6">
      Bridging the gap between Sellers, Buyers, and Partners on one seamless
      platform.
    </p>
  </div>
  <div class="relative mx-auto h-[560px] w-full max-w-[880px]">
    <div class="absolute inset-0 grid place-items-center">
      <div class="grid size-[300px] place-items-center rounded-full border-2 border-[#ff5a00] bg-[#ff5a00]">
        <div class="grid size-[188px] place-items-center rounded-full bg-white text-center font-bold text-4xl">
          Trade<span class="text-[#ff5a00]">X</span>po
        </div>
      </div>
      <div class="absolute size-[470px] rounded-full border border-[#ff5a00]" />
      <div class="absolute size-[610px] rounded-full bg-white/20" />
    </div>

    <!-- Sellers (Exhibitors) Card -->
    <article
      class={cn(
        "absolute w-[248px] rounded-xl border border-white bg-white/60 p-6 shadow-2xl backdrop-blur-md",
        "top-[210px] left-4 md:left-[112px]"
      )}
    >
      <div class="flex items-center gap-3 font-semibold">
        <span class="text-[#00b871]"><Store /></span>
        Sellers (Exhibitors)
      </div>
      <p class="mt-1 text-sm">Reach 50,000+ global buyers.</p>
      <a href="/seller">
        <button
          type="button"
          class="mt-5 inline-flex h-8 items-center gap-1 rounded-full bg-[#ed6203] px-4 font-medium text-sm text-white hover:bg-[#d55602] transition"
        >
          Book a Booth
          <ArrowRight class="size-4" />
        </button>
      </a>
    </article>

    <!-- Buyers (Visitors) Card -->
    <article
      class={cn(
        "absolute w-[248px] rounded-xl border border-white bg-white/60 p-6 shadow-2xl backdrop-blur-md",
        "top-8 right-4 md:right-6"
      )}
    >
      <div class="flex items-center gap-3 font-semibold">
        <span class="text-[#00b871]"><Users /></span>
        Buyers (Visitors)
      </div>
      <p class="mt-1 text-sm">Register to sync calendar.</p>
      <button
        type="button"
        class="mt-5 inline-flex h-8 items-center gap-1 rounded-full bg-[#ed6203] px-4 font-medium text-sm text-white hover:bg-[#d55602] transition"
      >
        Add to Calendar
        <ArrowRight class="size-4" />
      </button>
    </article>

    <!-- Partners Card -->
    <article
      class={cn(
        "absolute w-[248px] rounded-xl border border-white bg-white/60 p-6 shadow-2xl backdrop-blur-md",
        "right-10 bottom-10 md:right-[82px]"
      )}
    >
      <div class="flex items-center gap-3 font-semibold">
        <span class="text-[#00b871]"><Building2 /></span>
        Partners
      </div>
      <p class="mt-1 text-sm">Custom-budget Shows & Bulk Packages</p>
      <a href="/partner">
        <button
          type="button"
          class="mt-5 inline-flex h-8 items-center gap-1 rounded-full bg-[#ed6203] px-4 font-medium text-sm text-white hover:bg-[#d55602] transition"
        >
          Become a Partner
          <ArrowRight class="size-4" />
        </button>
      </a>
    </article>
  </div>
</section>
