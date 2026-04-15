"use client"

import {
  CircleIcon,
  MaximizeIcon,
  PauseIcon,
  PlayIcon,
  UsersIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import type { StreamSession } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

interface Props {
  session: StreamSession
  title: string
  sessionType: string
  onStreamEnded?: () => void
}

export function StreamPlayer({
  session,
  title,
  sessionType,
  onStreamEnded,
}: Props) {
  const isLive = session.status === "Active"
  const isReplay = session.status === "Ended" && session.replayUrl !== null
  const isProcessing =
    session.status === "Ended" &&
    session.replayUrl === null &&
    session.replayEnabled

  const [playing, setPlaying] = React.useState(false)
  const [muted, setMuted] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [viewerCount, setViewerCount] = React.useState(
    session.peakViewerCount ?? 0,
  )
  const [showControls, setShowControls] = React.useState(true)
  const controlsTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  // Simulate live viewer count fluctuation
  React.useEffect(() => {
    if (!isLive || !playing) return
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const delta = Math.floor(Math.random() * 11) - 5
        return Math.max(1, prev + delta)
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [isLive, playing])

  // Simulate replay progress
  React.useEffect(() => {
    if (!isReplay || !playing) return
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setPlaying(false)
          return 100
        }
        return prev + 0.5
      })
    }, 500)
    return () => clearInterval(interval)
  }, [isReplay, playing])

  function handleMouseMove() {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }

  const gradients: Record<string, string> = {
    Workshop: "from-emerald-900 via-emerald-800 to-teal-900",
    Keynote: "from-blue-950 via-blue-900 to-indigo-900",
    Talkshow: "from-violet-900 via-purple-900 to-indigo-900",
    Panel: "from-slate-900 via-slate-800 to-zinc-900",
    ProductDemo: "from-orange-900 via-amber-900 to-yellow-900",
    Other: "from-gray-900 via-gray-800 to-gray-900",
  }
  const gradient = gradients[sessionType] ?? gradients.Other
  const liveBars = React.useMemo(
    () => Array.from({ length: 20 }, (_, index) => `bar-${index}`),
    [],
  )

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: video player container needs mouse events for control visibility
    <div
      className={cn(
        "relative flex aspect-video w-full select-none overflow-hidden rounded-lg bg-gradient-to-br",
        gradient,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(true)}
    >
      {/* Fake video content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {isLive && playing && (
          <>
            {/* Animated live bars */}
            <div className="flex items-end gap-1 h-12">
              {liveBars.map((barKey, i) => (
                <div
                  key={barKey}
                  className="w-1.5 rounded-full bg-white/30"
                  style={{
                    height: `${20 + Math.sin((Date.now() / 300 + i) * 0.8) * 60}%`,
                    animation: `pulse ${0.6 + i * 0.05}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </>
        )}
        {!playing && (
          <div className="text-center">
            <p className="mb-2 font-semibold text-white/60 text-sm uppercase tracking-widest">
              {sessionType}
            </p>
            <p className="max-w-md px-4 text-center font-semibold text-white text-xl leading-snug">
              {title}
            </p>
            {isLive && (
              <p className="mt-3 text-white/50 text-sm">
                Click play to watch live
              </p>
            )}
            {isReplay && (
              <p className="mt-3 text-white/50 text-sm">
                Click play to watch replay
              </p>
            )}
            {isProcessing && (
              <div className="mt-4 rounded-lg bg-black/40 px-6 py-3">
                <p className="text-amber-300 text-sm font-medium">
                  Replay is being prepared…
                </p>
                <p className="mt-1 text-white/50 text-xs">
                  This may take a few minutes
                </p>
              </div>
            )}
            {session.status === "Ended" && !session.replayEnabled && (
              <div className="mt-4 rounded-lg bg-black/40 px-6 py-3">
                <p className="text-white/60 text-sm">This stream has ended</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-200",
          showControls || !playing ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="flex items-center gap-2">
          {isLive && playing && (
            <div className="flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5">
              <CircleIcon className="h-2 w-2 fill-white text-white animate-pulse" />
              <span className="font-bold text-white text-xs">LIVE</span>
            </div>
          )}
          <span className="rounded bg-black/40 px-2 py-0.5 text-white/80 text-xs">
            {sessionType}
          </span>
        </div>
        {isLive && playing && (
          <div className="flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-0.5">
            <UsersIcon className="h-3 w-3 text-white/70" />
            <span className="text-white text-xs">
              {viewerCount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Play button overlay */}
      {!playing && (isLive || isReplay) && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110">
            <PlayIcon className="h-7 w-7 fill-white text-white ml-1" />
          </div>
        </button>
      )}

      {/* Bottom controls */}
      {(isLive || isReplay) && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-200",
            showControls || !playing ? "opacity-100" : "opacity-0",
          )}
        >
          {isReplay && (
            <div className="mb-2">
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setMuted((m) => !m)}
            >
              {muted ? (
                <VolumeXIcon className="h-4 w-4" />
              ) : (
                <Volume2Icon className="h-4 w-4" />
              )}
            </Button>
            {isReplay && (
              <span className="ml-2 text-white/70 text-xs">
                {Math.floor((progress / 100) * 120)}:
                {String(
                  Math.floor(((progress / 100) * 120 * 60) % 60),
                ).padStart(2, "0")}{" "}
                / 2:00:00
              </span>
            )}
            <div className="ml-auto">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              >
                <MaximizeIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
