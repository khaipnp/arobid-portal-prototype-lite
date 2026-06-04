import Image from "next/image"

export function FeatureCardsSection({ media = [] }: { media?: string[] }) {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {["Trusted data", "Smart matching", "Member benefits"].map(
          (title, index) => {
            const imageUrl = media[index]

            return (
              <div className="overflow-hidden rounded-3xl border" key={title}>
                <div className="relative aspect-[16/9] bg-slate-100">
                  {imageUrl ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="384px"
                      src={imageUrl}
                    />
                  ) : null}
                </div>
                <div className="p-8">
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
              </div>
            )
          }
        )}
      </div>
    </section>
  )
}
