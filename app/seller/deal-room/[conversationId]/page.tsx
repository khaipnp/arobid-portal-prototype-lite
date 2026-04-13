import { DealRoomManager } from "@/components/deal-room/deal-room-manager"

interface Props {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params
  return <DealRoomManager initialConversationId={conversationId} />
}
