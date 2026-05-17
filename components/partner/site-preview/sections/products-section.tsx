import { productNames } from "../constants"

export function ProductsSection({ title }: { title: string }) {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h2
            className="font-bold text-3xl"
            style={{ color: "var(--site-primary)" }}
          >
            {title}
          </h2>
          <button
            className="font-semibold text-sm"
            style={{ color: "var(--site-primary)" }}
            type="button"
          >
            View all
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {productNames.map((product, index) => (
            <div
              className="overflow-hidden rounded-3xl border bg-white shadow-sm"
              key={product}
            >
              <div className="aspect-square bg-slate-100" />
              <div className="space-y-3 p-4">
                <h3 className="line-clamp-2 font-semibold text-slate-950 text-sm">
                  {product}
                </h3>
                <p
                  className="font-bold"
                  style={{ color: "var(--site-primary)" }}
                >
                  ${(index + 2) * 12}.00
                </p>
                <button
                  className="w-full rounded-full px-3 py-2 font-semibold text-sm text-white"
                  style={{ backgroundColor: "var(--site-primary)" }}
                  type="button"
                >
                  View product
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
