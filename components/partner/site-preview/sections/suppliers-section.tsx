import { supplierNames } from "../constants"

export function SuppliersSection({ title }: { title: string }) {
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
        <div className="grid gap-5 md:grid-cols-3">
          {supplierNames.map((supplier, index) => (
            <div
              className="rounded-3xl border bg-white p-5 shadow-sm"
              key={supplier}
            >
              <div className="mb-5 aspect-[16/9] rounded-2xl bg-slate-100" />
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-950 text-xl">
                  {supplier}
                </h3>
                <p className="text-slate-500 text-sm">
                  Verified supplier with export-ready products and active trade
                  programs.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 text-xs">
                    Tier {index + 1}
                  </span>
                  <button
                    className="rounded-full px-4 py-2 font-semibold text-sm text-white"
                    style={{ backgroundColor: "var(--site-primary)" }}
                    type="button"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
