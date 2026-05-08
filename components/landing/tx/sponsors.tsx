import Image from "next/image"

import { asset } from "./data"

export function Sponsors() {
  const sponsors = [
    ["Google", "sponsor-google.svg"],
    ["Microsoft", "sponsor-microsoft.svg"],
    ["Dropbox", "sponsor-dropbox.svg"],
    ["OpenAI", "sponsor-openai.svg"],
    ["Claude", "sponsor-claude.svg"],
  ] as const

  return (
    <section className="bg-white px-5 pb-10 md:px-[78px]">
      <div className="border-[#e5e7eb] border-t pt-10 text-center">
        <p className="font-medium">Get sponsored by companies such as:</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {sponsors.map(([name, image]) => (
            <Image
              key={name}
              src={asset(image)}
              alt={name}
              width={163}
              height={32}
              className="h-8 max-w-[163px] object-contain"
            />
          ))}
          <span className="font-bold text-2xl">HubSpot</span>
        </div>
      </div>
    </section>
  )
}
