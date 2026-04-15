import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { LiveComments } from "@/components/streaming/live-comments"
import { StreamPlayer } from "@/components/streaming/stream-player"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  listGoLIVEEvents,
  listLiveComments,
  listStreamSessions,
} from "@/lib/tradexpo/db/platform-data"

interface Props {
  params: Promise<{ sessionId: string }>
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  Workshop: "Workshop",
  Talkshow: "Talkshow",
  Keynote: "Keynote",
  Panel: "Panel",
  ProductDemo: "Product Demo",
  Other: "Other",
}

export const dynamic = "force-dynamic"

export default async function WatchPage({ params }: Props) {
  const { sessionId } = await params
  const [streamSessions, goLiveEvents, liveComments] = await Promise.all([
    listStreamSessions(),
    listGoLIVEEvents(),
    listLiveComments(),
  ])

  const session = streamSessions.find((s) => s.streamSessionId === sessionId)
  if (!session) notFound()

  // Can't watch Provisioned or Canceled sessions
  if (session.status === "Provisioned" || session.status === "Canceled")
    notFound()

  const event = goLiveEvents.find((e) => e.streamSessionId === sessionId)
  const initialComments = liveComments.filter(
    (c) => c.streamSessionId === sessionId && !c.isDeleted,
  )
  const title = event?.title ?? "Live Session"
  const sessionType = event?.sessionType ?? "Other"
  const description = event?.description

  const isLive = session.status === "Active"
  const isModerator = session.hostUserId === "user-khai" // current user is host

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href="/seller/my-expos">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate font-medium text-sm">{title}</span>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {SESSION_TYPE_LABELS[sessionType]}
          </Badge>
          {isLive && (
            <Badge className="shrink-0 bg-red-600 text-white text-xs hover:bg-red-600">
              LIVE
            </Badge>
          )}
          {!isLive && (
            <Badge variant="outline" className="shrink-0 text-xs">
              Replay
            </Badge>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Player */}
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="mx-auto w-full max-w-4xl p-4 space-y-4">
            <StreamPlayer
              session={session}
              title={title}
              sessionType={sessionType}
            />

            <div className="space-y-2">
              <h1 className="font-bold text-xl leading-snug">{title}</h1>
              {description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              )}
              {event && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>Broadcaster: {event.broadcasterDisplayName}</span>
                  {session.startedAt && (
                    <span>
                      Started:{" "}
                      {new Date(session.startedAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments sidebar */}
        <aside className="hidden w-80 shrink-0 border-l lg:flex lg:flex-col">
          <LiveComments
            streamSessionId={sessionId}
            sessionStatus={session.status}
            initialComments={initialComments}
            isModerator={isModerator}
          />
        </aside>
      </div>
    </div>
  )
}
