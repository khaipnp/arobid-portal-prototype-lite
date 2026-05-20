<script lang="ts">
const stats = [
  ["95%", "AI Matching Precision"],
  ["90%", "Cost Optimization"],
  ["100%", "Verified Business Entities"],
  ["60%", "Faster Decision Making"]
]
</script>

<section class="relative overflow-hidden bg-white px-5 py-16 text-center md:px-20">
  <div class="absolute inset-x-0 top-0 mx-auto aspect-square max-w-5xl rounded-full bg-[radial-gradient(circle,rgba(237,98,3,0.14),rgba(255,255,255,0)_62%)]" />
  <div class="relative">
    <h2 class="font-semibold text-[32px] leading-10">AI-Powered</h2>
    <p class="font-semibold text-3xl text-legend leading-10">
      Virtual Trade Ecosystem
    </p>
    <p class="mt-2 text-foreground">
      Delivering qualified leads for Sellers, smart sourcing for Buyers, and
      custom event solutions for Partners.
    </p>
    <div class="relative mx-auto mt-10 max-w-4xl rounded-3xl border border-white bg-white/50 p-2 shadow-sm backdrop-blur">
      <video
        src="https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/arobid_video_4055941c-07e3-446a-9c42-0b614213d5bf_20260213064240_1770964909747.mp4"
        autoplay
        muted
        loop
        playsinline
        class="aspect-video w-full rounded-2xl object-cover"
      >
        <track kind="captions" />
      </video>
    </div>
    <div class="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
      {#each stats as [value, label]}
        <div class="border-[#e5e7eb] last:border-r-0 md:border-r">
          <p class="font-semibold text-3xl text-legend leading-10">
            {value}
          </p>
          <p class="text-sm">{label}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
