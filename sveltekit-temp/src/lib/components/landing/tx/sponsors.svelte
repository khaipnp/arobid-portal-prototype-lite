<script lang="ts">
import { asset } from "./data.js"

const sponsors = [
  ["Google", "sponsor-google.svg"],
  ["Microsoft", "sponsor-microsoft.svg"],
  ["Dropbox", "sponsor-dropbox.svg"],
  ["OpenAI", "sponsor-openai.svg"],
  ["Claude", "sponsor-claude.svg"]
] as const
</script>

<section class="bg-white px-5 pb-10 md:px-[78px]">
  <div class="border-[#e5e7eb] border-t pt-10 text-center">
    <p class="font-medium">Get sponsored by companies such as:</p>
    <div class="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-14">
      {#each sponsors as [name, image]}
        <img
          src={asset(image)}
          alt={name}
          class="h-8 max-w-[163px] object-contain"
        />
      {/each}
      <span class="font-bold text-2xl">HubSpot</span>
    </div>
  </div>
</section>
