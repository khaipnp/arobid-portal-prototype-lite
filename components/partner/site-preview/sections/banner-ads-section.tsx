import { SectionMedia } from "./section-media"

function pickBannerMedia(media: string[]) {
  return media.find(Boolean) ?? ""
}

export function BannerAdsSection({ media = [] }: { media?: string[] }) {
  const bannerMedia = pickBannerMedia(media)

  return (
    <section className="bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-sm">
          <div className="relative aspect-[16/5] min-h-[180px] overflow-hidden">
            <SectionMedia
              alt="Inline banner placement"
              className="object-cover"
              sizes="1152px"
              src={bannerMedia}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-slate-950/10 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
