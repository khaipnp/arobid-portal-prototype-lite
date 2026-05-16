export function FeatureCardsSection() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {["Trusted data", "Smart matching", "Member benefits"].map((title) => (
          <div className="rounded-3xl border p-8" key={title}>
            <h3
              className="font-bold text-2xl"
              style={{ color: "var(--site-primary)" }}
            >
              {title}
            </h3>
            <p className="mt-3 text-slate-500">
              Simple tools for partner-led digital trade experiences.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
