export type ConversationType = "direct" | "expo_group"

export type MessageStatus = "sent" | "delivered" | "read"

export type MessageFileType = "pdf" | "png" | "jpg" | "jpeg" | "xlsx" | "docx"

export interface ChatUser {
  id: string
  name: string
  email: string
  company: string
  jobTitle?: string
  phone?: string
  website?: string
  location?: string
  avatarUrl?: string
  isActive: boolean
}

export interface ConversationMember {
  userId: string
  joinedAt: string
  isArchived: boolean
}

export interface MessageAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number // bytes
  fileType: MessageFileType
}

export interface Message {
  id: string
  conversationId: string
  senderId: string // userId or "system"
  content: string
  attachments: MessageAttachment[]
  status: MessageStatus
  sentAt: string
  editedAt?: string
  isDeleted: boolean
  isSystemMessage: boolean
}

export interface Conversation {
  id: string
  type: ConversationType
  name?: string // display name for expo_group
  contextType?: "expo"
  contextId?: string // expoId for expo_group
  members: ConversationMember[]
  createdAt: string
  isReadOnly: boolean // true when expo is archived
}
