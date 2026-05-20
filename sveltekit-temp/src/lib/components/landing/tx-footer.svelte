<script lang="ts">
const footerColumns = [
  ["Get to know us", "About Arobid", "Newsroom", "Careers"],
  ["Business Services", "SmartCapital"],
  ["Source from Arobid", "Request for Quote", "Sourcing Knowledge Center"],
  [
    "Sell on Arobid.com",
    "Start Selling on Arobid",
    "Seller Central Login",
    "Membership Program"
  ],
  ["Get support", "Help Center", "Contact us"]
]
</script>

<footer class="border-muted border-t bg-white px-5 py-11 md:px-18">
  <section class="container mx-auto">
    <div class="grid gap-8 md:grid-cols-5">
      {#each footerColumns as [title, ...items]}
        <div>
          <h3 class="font-semibold text-sm">{title}</h3>
          <ul class="mt-4 space-y-3 text-[#6b7280] text-sm">
            {#each items as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    <div class="mt-8 flex flex-wrap items-center justify-center gap-8 border-[#f3f4f6] border-b pb-6">
      <span class="font-semibold text-sm">Follow us</span>
      <span class="font-bold text-3xl text-[#1877f2]">f</span>
      <img
        src="https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/Icon_of_Zalo.svg.png"
        alt="Zalo logo"
        class="size-8 cursor-pointer"
      />
      <span class="grid h-7 w-9 place-items-center rounded bg-red-600 font-bold text-white text-xs">
        You
      </span>
      <span class="grid size-8 place-items-center rounded bg-[#0a66c2] font-bold text-white">
        in
      </span>
      <span class="ml-4 font-semibold text-sm">Certified</span>
      <img
        src="/landing/bct-certi.png"
        alt="bct logo"
        class="h-8 w-auto cursor-pointer"
      />
      <span class="ml-4 font-semibold text-sm">Payment</span>
      <img
        src="/landing/vnpay.svg"
        alt="VNPAY logo"
        class="h-8 w-auto"
      />
    </div>
    <div class="mt-4 space-y-1 text-center text-[#6b7280] text-xs">
      <p>B2B Marketplace | TradeXpo | Goods for Good | AroUni</p>
      <p>
        Policies and rules: Policy | Legal notice | Terms & conditions |
        Categories Sitemap
      </p>
      <p>
        (c) 2026 - Arobid Technology Joint Stock Company - Certificate
        number: 0318608079 - Email: support@arobid.com
      </p>
    </div>
  </section>
</footer>
