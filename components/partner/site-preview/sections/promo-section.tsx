export function PromoSection() {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {["Digital sourcing", "Verified buyers", "Trade enablement"].map(
          (title) => (
            <div className="rounded-3xl bg-white p-8 shadow-sm" key={title}>
              <div
                className="mb-6 size-12 rounded-2xl"
                style={{ backgroundColor: "var(--site-accent)" }}
              />
              <h3 className="font-bold text-slate-950 text-xl">{title}</h3>
              <p className="mt-2 text-slate-500 text-sm">
                Support business growth through trusted marketplace operations.
              </p>
            </div>
          )
        )}
      </div>
    </section>
  )
}
