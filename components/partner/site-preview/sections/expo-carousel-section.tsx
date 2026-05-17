export function ExpoCarouselSection() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-10 py-16 text-white">
          <div className="max-w-xl space-y-4">
            <p
              className="font-semibold text-sm uppercase tracking-[0.2em]"
              style={{ color: "var(--site-accent)" }}
            >
              TradeXpo Live
            </p>
            <h2 className="font-bold text-4xl">
              Discover upcoming exhibitions
            </h2>
            <p className="text-white/70">
              Promote curated expo programs with one strong carousel banner.
            </p>
            <button
              className="rounded-full px-5 py-3 font-semibold text-sm text-white"
              style={{ backgroundColor: "var(--site-primary)" }}
              type="button"
            >
              Browse expos
            </button>
          </div>
          <div className="absolute right-8 bottom-8 flex gap-2">
            <span className="h-2 w-8 rounded-full bg-white" />
            <span className="size-2 rounded-full bg-white/40" />
            <span className="size-2 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  )
}
