import Image from "next/image"

export function PromoSection({ media = [] }: { media?: string[] }) {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {["Digital sourcing", "Verified buyers", "Trade enablement"].map(
          (title, index) => {
            const imageUrl = media[index]

            return (
              <div
                className="overflow-hidden rounded-3xl bg-white p-8 shadow-sm"
                key={title}
              >
                <div className="relative mb-6 size-14 overflow-hidden rounded-2xl bg-slate-100">
                  {imageUrl ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="56px"
                      src={imageUrl}
                    />
                  ) : (
                    <div
                      className="size-full"
                      style={{ backgroundColor: "var(--site-accent)" }}
                    />
                  )}
                </div>
                <h3 className="font-bold text-slate-950 text-xl">{title}</h3>
                <p className="mt-2 text-slate-500 text-sm">
                  Support business growth through trusted marketplace
                  operations.
                </p>
              </div>
            )
          }
        )}
      </div>
    </section>
  )
}
