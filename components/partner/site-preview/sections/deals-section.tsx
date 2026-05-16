export function DealsSection() {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 font-bold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
          >
            HOT DEAL
          </span>
          <h2 className="font-bold text-2xl text-slate-950">Brand eVoucher</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <DealCard large title="Top Ranking" />
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              "Buyer services",
              "Supplier boost",
              "Expo package",
              "Member deals"
            ].map((deal) => (
              <DealCard key={deal} title={deal} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function DealCard({ large, title }: { large?: boolean; title: string }) {
  return (
    <div className="flex min-h-48 flex-col justify-end rounded-3xl bg-slate-900 p-6 text-white">
      <div className="space-y-3">
        <h3 className="font-bold text-2xl">{title}</h3>
        <button
          className="rounded-full px-4 py-2 font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--site-primary)" }}
          type="button"
        >
          {large ? "Claim top deal" : "Claim now"}
        </button>
      </div>
    </div>
  )
}
