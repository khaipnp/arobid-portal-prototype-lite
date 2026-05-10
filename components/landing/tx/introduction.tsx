export function Introduction() {
  return (
    <section className="relative overflow-hidden bg-white px-5 py-16 text-center md:px-[78px]">
      <div className="absolute inset-x-0 top-0 mx-auto aspect-square max-w-[1120px] rounded-full bg-[radial-gradient(circle,rgba(237,98,3,0.14),rgba(255,255,255,0)_62%)]" />
      <div className="relative">
        <h2 className="font-semibold text-[32px] leading-10">AI-Powered</h2>
        <p className="font-semibold text-[#ed6203] text-[32px] leading-10">
          Virtual Trade Ecosystem
        </p>
        <p className="mt-2 text-foreground">
          Delivering qualified leads for Sellers, smart sourcing for Buyers, and
          custom event solutions for Partners.
        </p>
        <div className="relative mx-auto mt-10 max-w-4xl rounded-3xl border border-white bg-white/50 p-2 shadow-sm backdrop-blur">
          <video
            src="https://pub-f9f549362b7a4bc2ad361c7ca1858854.r2.dev/arobid_video_4055941c-07e3-446a-9c42-0b614213d5bf_20260213064240_1770964909747.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="aspect-video w-full rounded-2xl object-cover"
          />
        </div>
        <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["95%", "AI Matching Precision"],
            ["90%", "Cost Optimization"],
            ["100%", "Verified Business Entities"],
            ["60%", "Faster Decision Making"]
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-[#e5e7eb] last:border-r-0 md:border-r"
            >
              <p className="font-semibold text-[#ed6203] text-[32px] leading-10">
                {value}
              </p>
              <p className="text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
