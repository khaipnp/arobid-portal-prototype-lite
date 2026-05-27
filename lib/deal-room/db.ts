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

const DEFAULT_MESSAGE_LIMIT = 500

function normalizeLimit(
  limit: number | undefined,
  fallback = DEFAULT_MESSAGE_LIMIT
) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return fallback
  return Math.max(1, Math.min(1000, Math.floor(limit)))
}

export async function isConversationMember(input: {
  conversationId: string
  userId: string
}): Promise<boolean> {
  const rows = (await sql`
    select 1 as exists
    from chat_conversation_members
    where conversation_id = ${input.conversationId}
      and user_id = ${input.userId}
    limit 1
  `) as { exists: number }[]

  return rows.length > 0
}

export async function findConversationPartnerOrganizationForUser(input: {
  conversationId: string
  userId: string
}): Promise<string | null> {
  const rows = (await sql`
    select ccpm.partner_org_id
    from chat_conversation_partner_members ccpm
    inner join partner_memberships pm
      on pm.partner_org_id = ccpm.partner_org_id
    inner join partner_organizations po
      on po.id = ccpm.partner_org_id
    where ccpm.conversation_id = ${input.conversationId}
      and pm.user_id = ${input.userId}
      and pm.status = 'active'
      and po.status = 'active'
    order by po.created_at asc
    limit 1
  `) as { partner_org_id: string }[]

  return rows[0]?.partner_org_id ?? null
}

export async function isConversationParticipant(input: {
  conversationId: string
  userId: string
}): Promise<boolean> {
  if (await isConversationMember(input)) return true
  return (await findConversationPartnerOrganizationForUser(input)) !== null
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
      m.is_archived as participant_archived,
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
    participant_archived?: boolean
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
    participantArchived: r.participant_archived,
    lastMessage: r.last_message,
    lastMessageAt: r.last_message_at ? toIso(r.last_message_at) : undefined
  }))
}

export async function listPartnerOrganizationMemberUserIds(
  partnerOrgId: string
): Promise<string[]> {
  const rows = (await sql`
    select user_id
    from partner_memberships
    where partner_org_id = ${partnerOrgId}
      and status = 'active'
    order by created_at asc
  `) as { user_id: string }[]

  return rows.map((row) => row.user_id)
}

export async function listChatUsersForPartnerOrganization(
  partnerOrgId: string
): Promise<ChatUser[]> {
  const rows = (await sql`
    select distinct u.*, c.name as company
    from users u
    left join companies c on c.id = u.company_id
    where u.id in (
      select ccm.user_id
      from chat_conversation_members ccm
      inner join chat_conversation_partner_members ccpm
        on ccpm.conversation_id = ccm.conversation_id
      where ccpm.partner_org_id = ${partnerOrgId}
      union
      select pm.user_id
      from partner_memberships pm
      where pm.partner_org_id = ${partnerOrgId}
        and pm.status = 'active'
    )
    order by u.name asc
  `) as {
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

export async function listConversationsForPartnerOrganization(
  partnerOrgId: string
): Promise<
  (Conversation & { lastMessage?: string; lastMessageAt?: string })[]
> {
  const convRows = (await sql`
    select c.*,
      ccpm.is_archived as participant_archived,
      (select content from chat_messages where conversation_id = c.id order by sent_at desc limit 1) as last_message,
      (select sent_at from chat_messages where conversation_id = c.id order by sent_at desc limit 1) as last_message_at
    from chat_conversations c
    inner join chat_conversation_partner_members ccpm
      on ccpm.conversation_id = c.id
    where ccpm.partner_org_id = ${partnerOrgId}
    order by coalesce((select sent_at from chat_messages where conversation_id = c.id order by sent_at desc limit 1), c.created_at) desc
  `) as {
    id: string
    type: Conversation["type"]
    created_at: string | Date
    is_read_only: boolean
    participant_archived: boolean
    last_message?: string
    last_message_at?: string | Date
  }[]

  const memberRows = (await sql`
    select ccm.*
    from chat_conversation_members ccm
    inner join chat_conversation_partner_members ccpm
      on ccpm.conversation_id = ccm.conversation_id
    where ccpm.partner_org_id = ${partnerOrgId}
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
    participantArchived: r.participant_archived,
    lastMessage: r.last_message,
    lastMessageAt: r.last_message_at ? toIso(r.last_message_at) : undefined
  }))
}

export async function listMessagesByConversation(
  userId?: string,
  options?: { limit?: number }
): Promise<Record<string, Message[]>> {
  const limit = normalizeLimit(options?.limit)
  const rows = (
    userId
      ? await sql`
    select *
    from (
      select m.*
      from chat_messages m
      join chat_conversation_members ccm on ccm.conversation_id = m.conversation_id
      where ccm.user_id = ${userId}
      order by m.sent_at desc
      limit ${limit}
    ) recent_messages
    order by sent_at asc
  `
      : await sql`
    select *
    from (
      select * from chat_messages order by sent_at desc limit ${limit}
    ) recent_messages
    order by sent_at asc
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

export async function listMessagesByConversationForPartnerOrganization(
  partnerOrgId: string,
  options?: { limit?: number }
): Promise<Record<string, Message[]>> {
  const limit = normalizeLimit(options?.limit)
  const rows = (await sql`
    select *
    from (
      select m.*
      from chat_messages m
      inner join chat_conversation_partner_members ccpm
        on ccpm.conversation_id = m.conversation_id
      where ccpm.partner_org_id = ${partnerOrgId}
      order by m.sent_at desc
      limit ${limit}
    ) recent_messages
    order by sent_at asc
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
      isSystemMessage: r.is_system_message
    })
    out[r.conversation_id] = list
  }
  return out
}

export async function listConversationMessages(input: {
  conversationId: string
  userId: string
  limit?: number
}): Promise<Message[]> {
  const limit = normalizeLimit(input.limit)
  const rows = (await sql`
    select *
    from (
      select m.*
      from chat_messages m
      where m.conversation_id = ${input.conversationId}
        and (
          exists (
            select 1
            from chat_conversation_members ccm
            where ccm.conversation_id = m.conversation_id
              and ccm.user_id = ${input.userId}
          )
          or exists (
            select 1
            from chat_conversation_partner_members ccpm
            inner join partner_memberships pm
              on pm.partner_org_id = ccpm.partner_org_id
            inner join partner_organizations po
              on po.id = ccpm.partner_org_id
            where ccpm.conversation_id = m.conversation_id
              and pm.user_id = ${input.userId}
              and pm.status = 'active'
              and po.status = 'active'
          )
        )
      order by m.sent_at desc
      limit ${limit}
    ) recent_messages
    order by sent_at asc
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

  return rows.map((r) => ({
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
  }))
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

export async function listUnreadCountsForPartnerOrganization(
  partnerOrgId: string
): Promise<Record<string, number>> {
  const rows = (await sql`
    select conversation_id, unread_count
    from chat_partner_unread_counts
    where partner_org_id = ${partnerOrgId}
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
  senderId: string
  content: string
  editedAt: string
}): Promise<boolean> {
  const rows = (await sql`
    update chat_messages
    set content = ${input.content}, edited_at = ${input.editedAt}
    where id = ${input.messageId}
      and conversation_id = ${input.conversationId}
      and sender_id = ${input.senderId}
      and is_deleted = false
      and is_system_message = false
    returning id
  `) as { id: string }[]

  return rows.length > 0
}

export async function softDeleteMessage(input: {
  messageId: string
  conversationId: string
  senderId: string
}): Promise<boolean> {
  const rows = (await sql`
    update chat_messages
    set is_deleted = true, attachments = '[]'::jsonb
    where id = ${input.messageId}
      and conversation_id = ${input.conversationId}
      and sender_id = ${input.senderId}
      and is_system_message = false
    returning id
  `) as { id: string }[]

  return rows.length > 0
}

export async function archiveConversationForUser(input: {
  conversationId: string
  userId: string
}): Promise<boolean> {
  const rows = (await sql`
    update chat_conversation_members
    set is_archived = true
    where conversation_id = ${input.conversationId}
      and user_id = ${input.userId}
    returning conversation_id
  `) as { conversation_id: string }[]

  return rows.length > 0
}

export async function archiveConversationForPartnerOrganization(input: {
  conversationId: string
  partnerOrgId: string
}): Promise<boolean> {
  const rows = (await sql`
    update chat_conversation_partner_members
    set is_archived = true
    where conversation_id = ${input.conversationId}
      and partner_org_id = ${input.partnerOrgId}
    returning conversation_id
  `) as { conversation_id: string }[]

  return rows.length > 0
}
