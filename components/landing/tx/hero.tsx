import { Box } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { asset } from "./data";

export function Hero() {
  return (
    <section className="relative min-h-[617px] overflow-hidden">
      <Image
        src={asset("hero-bg.jpg")}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 h-[350px] bg-linear-to-b from-black/0 to-black/80 backdrop-blur-[2px]" />
      <div className="container relative mx-auto flex min-h-[617px] items-end justify-between gap-8 px-5 pb-10 md:pb-14">
        <div className="max-w-3xl pb-8 text-white">
          <p className="font-medium text-sm drop-shadow-lg">
            20 MAY - 22 MAY, 2026
          </p>
          <h1 className="mt-2 max-w-2xl font-medium text-4xl leading-[1.15] tracking-normal drop-shadow-xl md:text-[36px]">
            Vietnam International Furniture Manufacturing & Wood Expo (VIFMW) #1
          </h1>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/seller"
              className="inline-flex h-10 w-[178px] items-center justify-center gap-2 rounded-full bg-[#ed6203] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_#f37b42]"
            >
              <Box className="size-5" />
              Virtual Lobby
            </Link>
            <Link
              href="/expos/vifmw-2026"
              className="inline-flex h-10 w-[178px] items-center justify-center rounded-full border border-white bg-white/10 font-medium text-white backdrop-blur"
            >
              View Detail
            </Link>
          </div>
          <div className="mt-6 flex items-end gap-4">
            <div className="font-normal text-lg">
              01<span className="align-baseline text-[10px]">/05</span>
            </div>
            <div className="mb-2 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-white/80" />
              <span className="h-1.5 w-6 rounded-full bg-white" />
              <span className="size-1.5 rounded-full bg-white/80" />
              <span className="size-1.5 rounded-full bg-white/80" />
              <span className="size-1.5 rounded-full bg-white/80" />
            </div>
          </div>
        </div>
        <article className="mb-8 hidden size-[218px] overflow-hidden rounded-2xl bg-white p-1 shadow-2xl lg:block">
          <Image
            src={asset("hero-card.jpg")}
            alt=""
            width={210}
            height={118}
            className="h-[118px] w-full rounded-xl object-cover"
          />
          <div className="p-2">
            <p className="font-medium text-[#6b7280] text-xs">
              20 MAY - 22 MAY, 2026
            </p>
            <h2 className="mt-1 font-medium text-sm leading-5">
              Vietnam International Paper & Stationery Expo (VPAPS) #1
            </h2>
          </div>
        </article>
      </div>
    </section>
  );
}
