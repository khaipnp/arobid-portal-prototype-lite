import { sql } from "@/lib/db/neon"
import type {
  ChatUser,
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment
} from "@/lib/deal-room/types"

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

export async function listChatUsers(userId?: string): Promise<ChatUser[]> {
  const rows = (
    userId
      ? await sql`
    select u.*, c.name as company from users u
    left join companies c on c.id = u.company_id
    where u.id in (
      select user_id from chat_conversation_members
      where conversation_id in (
        select conversation_id from chat_conversation_members
        where user_id = ${userId}
      )
    )
    or u.id = ${userId}
    order by u.name asc
  `
      : await sql`
    select u.*, c.name as company from users u
    left join companies c on c.id = u.company_id
    order by u.name asc
  `
  ) as {
    id: string
    name: string
    email: string
    company: string | null
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
    company: r.company ?? "Individual",
    jobTitle: r.job_title ?? undefined,
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    location: r.location ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    isActive: r.is_active
  }))
}

export async function listConversations(
  userId?: string
): Promise<
  (Conversation & { lastMessage?: string; lastMessageAt?: string })[]
> {
  const convRows = (
    userId
      ? await sql`
    select c.*,
      (select content from chat_messages where conversation_id = c.id order by sent_at desc limit 1) as last_message,
      (select sent_at from chat_messages where conversation_id = c.id order by sent_at desc limit 1) as last_message_at
    from chat_conversations c
    join chat_conversation_members m on m.conversation_id = c.id
    where m.user_id = ${userId}
    order by coalesce((select sent_at from chat_messages where conversation_id = c.id order by sent_at desc limit 1), c.created_at) desc
  `
      : await sql`
    select *,
      (select content from chat_messages where conversation_id = chat_conversations.id order by sent_at desc limit 1) as last_message,
      (select sent_at from chat_messages where conversation_id = chat_conversations.id order by sent_at desc limit 1) as last_message_at
    from chat_conversations order by created_at desc
  `
  ) as {
    id: string
    type: Conversation["type"]
    created_at: string | Date
    is_read_only: boolean
    last_message?: string
    last_message_at?: string | Date
  }[]

  const memberRows = (await sql`
    select * from chat_conversation_members
    where conversation_id in (select id from chat_conversations)
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
      isArchived: m.is_archived
    })
    membersByConv.set(m.conversation_id, list)
  }

  return convRows.map((r) => ({
    id: r.id,
    type: r.type,
    members: membersByConv.get(r.id) ?? [],
    createdAt: toIso(r.created_at),
    isReadOnly: r.is_read_only,
    lastMessage: r.last_message,
    lastMessageAt: r.last_message_at ? toIso(r.last_message_at) : undefined
  }))
}

export async function listMessagesByConversation(
  userId?: string
): Promise<Record<string, Message[]>> {
  const rows = (
    userId
      ? await sql`
    select m.* from chat_messages m
    join chat_conversation_members ccm on ccm.conversation_id = m.conversation_id
    where ccm.user_id = ${userId}
    order by m.sent_at asc
  `
      : await sql`
    select * from chat_messages order by sent_at asc
  `
  ) as {
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
      isSystemMessage: r.is_system_message
    })
    out[r.conversation_id] = list
  }
  return out
}

export async function listUnreadCountsForUser(
  userId: string
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

export async function createMessage(input: {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachments: MessageAttachment[]
  status: Message["status"]
  sentAt: string
}): Promise<void> {
  await sql`
    insert into chat_messages (
      id,
      conversation_id,
      sender_id,
      content,
      attachments,
      status,
      sent_at,
      edited_at,
      is_deleted,
      is_system_message
    )
    values (
      ${input.id},
      ${input.conversationId},
      ${input.senderId},
      ${input.content},
      ${JSON.stringify(input.attachments)}::jsonb,
      ${input.status},
      ${input.sentAt},
      null,
      false,
      false
    )
  `
}

export async function updateMessageContent(input: {
  messageId: string
  conversationId: string
  content: string
  editedAt: string
}): Promise<void> {
  await sql`
    update chat_messages
    set content = ${input.content}, edited_at = ${input.editedAt}
    where id = ${input.messageId}
      and conversation_id = ${input.conversationId}
      and is_deleted = false
      and is_system_message = false
  `
}

export async function softDeleteMessage(input: {
  messageId: string
  conversationId: string
}): Promise<void> {
  await sql`
    update chat_messages
    set is_deleted = true, attachments = '[]'::jsonb
    where id = ${input.messageId}
      and conversation_id = ${input.conversationId}
      and is_system_message = false
  `
}

export async function archiveConversationForUser(input: {
  conversationId: string
  userId: string
}): Promise<void> {
  await sql`
    update chat_conversation_members
    set is_archived = true
    where conversation_id = ${input.conversationId}
      and user_id = ${input.userId}
  `
}
