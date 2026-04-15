import { sql } from "@/lib/db/neon"
import type {
  ChatUser,
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
} from "@/lib/deal-room/types"

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

export async function listChatUsers(): Promise<ChatUser[]> {
  const rows = (await sql`
    select * from chat_users order by name asc
  `) as {
    id: string
    name: string
    email: string
    company: string
    job_title: string | null
    phone: string | null
    website: string | null
    location: string | null
    avatar_url: string | null
    is_active: boolean
  }[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    jobTitle: r.job_title ?? undefined,
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    location: r.location ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    isActive: r.is_active,
  }))
}

export async function listConversations(): Promise<Conversation[]> {
  const convRows = (await sql`
    select * from chat_conversations order by created_at desc
  `) as {
    id: string
    type: Conversation["type"]
    created_at: string | Date
    is_read_only: boolean
  }[]

  const memberRows = (await sql`
    select * from chat_conversation_members
  `) as {
    conversation_id: string
    user_id: string
    joined_at: string | Date
    is_archived: boolean
  }[]

  const membersByConv = new Map<string, ConversationMember[]>()
  for (const m of memberRows) {
    const list = membersByConv.get(m.conversation_id) ?? []
    list.push({
      userId: m.user_id,
      joinedAt: toIso(m.joined_at),
      isArchived: m.is_archived,
    })
    membersByConv.set(m.conversation_id, list)
  }

  return convRows.map((r) => ({
    id: r.id,
    type: r.type,
    members: membersByConv.get(r.id) ?? [],
    createdAt: toIso(r.created_at),
    isReadOnly: r.is_read_only,
  }))
}

export async function listMessagesByConversation(): Promise<
  Record<string, Message[]>
> {
  const rows = (await sql`
    select * from chat_messages order by sent_at asc
  `) as {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    attachments: MessageAttachment[]
    status: Message["status"]
    sent_at: string | Date
    edited_at: string | Date | null
    is_deleted: boolean
    is_system_message: boolean
  }[]

  const out: Record<string, Message[]> = {}
  for (const r of rows) {
    const list = out[r.conversation_id] ?? []
    list.push({
      id: r.id,
      conversationId: r.conversation_id,
      senderId: r.sender_id,
      content: r.content,
      attachments: r.attachments ?? [],
      status: r.status,
      sentAt: toIso(r.sent_at),
      editedAt: r.edited_at ? toIso(r.edited_at) : undefined,
      isDeleted: r.is_deleted,
      isSystemMessage: r.is_system_message,
    })
    out[r.conversation_id] = list
  }
  return out
}

export async function listUnreadCountsForUser(
  userId: string,
): Promise<Record<string, number>> {
  const rows = (await sql`
    select conversation_id, unread_count from chat_unread_counts
    where user_id = ${userId}
  `) as { conversation_id: string; unread_count: number }[]
  const out: Record<string, number> = {}
  for (const r of rows) {
    out[r.conversation_id] = Number(r.unread_count)
  }
  return out
}
