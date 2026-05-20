<script lang="ts">
import { Minus, Plus } from "lucide-svelte"
import { cn } from "$lib/utils.js"
import { faqs } from "./data.js"

let { defaultOpenFaq = 1 } = $props<{ defaultOpenFaq?: number }>()
let openFaq = $state(defaultOpenFaq)
let activeTab = $state(0)

const tabs = ["For Sellers", "For Buyers", "For Partners"]
</script>

<section class="bg-[#f9fafb] px-5 py-16">
  <h2 class="text-center font-bold text-3xl leading-10">
    Frequently asked questions
  </h2>
  <div class="mx-auto mt-10 max-w-5xl">
    <div class="grid border-[#e5e7eb] border-b text-center md:grid-cols-3">
      {#each tabs as tab, index}
        <button
          type="button"
          class={cn(
            "h-12 text-sm transition",
            activeTab === index
              ? "border-[#ed6203] border-b-2 font-semibold text-[#ed6203]"
              : "text-muted-foreground hover:text-foreground"
          )}
          onclick={() => activeTab = index}
        >
          {tab}
        </button>
      {/each}
    </div>
    <div class="mt-5 space-y-5">
      {#each faqs as faq, index}
        {@const open = openFaq === index}
        <button
          type="button"
          onclick={() => openFaq = open ? -1 : index}
          class={cn(
            "w-full rounded-lg px-6 py-5 text-left text-sm transition-all duration-300",
            open
              ? "bg-white shadow-[0_0_24px_rgba(0,0,0,0.08)]"
              : "bg-[#f9fafb] hover:bg-[#f3f4f6]"
          )}
        >
          <span class="flex items-center justify-between gap-4 font-medium">
            {faq.question}
            {#if open}
              <Minus class="size-5 text-[#6b7280]" />
            {:else}
              <Plus class="size-5 text-[#6b7280]" />
            {/if}
          </span>
          {#if open}
            <span class="mt-3 block text-foreground leading-5 transition-all">
              {faq.answer}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</section>
