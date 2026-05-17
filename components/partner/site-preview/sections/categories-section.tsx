import { categoryLabels } from "../constants"

export function CategoriesSection() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <h2
          className="text-center font-bold text-3xl"
          style={{ color: "var(--site-primary)" }}
        >
          Browse by Categories
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {categoryLabels.map((category) => (
            <div className="space-y-3 text-center" key={category}>
              <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-slate-100">
                <div
                  className="size-10 rounded-2xl"
                  style={{ backgroundColor: "var(--site-accent)" }}
                />
              </div>
              <div className="font-medium text-slate-700 text-sm">
                {category}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
