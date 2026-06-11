import Image from "next/image"

function isVideoMedia(src: string) {
  return /\.(mp4|webm|ogg|mov)(?:$|[?#])/i.test(src)
}

export function SectionMedia({
  src,
  alt,
  sizes,
  className
}: {
  src?: string
  alt: string
  sizes: string
  className?: string
}) {
  if (!src) return null

  if (isVideoMedia(src)) {
    return (
      <video autoPlay className={className} loop muted playsInline src={src} />
    )
  }

  return <Image alt={alt} className={className} fill sizes={sizes} src={src} />
}
