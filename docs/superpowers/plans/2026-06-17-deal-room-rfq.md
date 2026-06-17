# Deal Room RFQ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RFQ (Request for Quotation) as a structured message kind in the Deal Room chat, with `open → quoted → closed` lifecycle and rich card rendering in the conversation thread.

**Architecture:** RFQ messages are stored in the existing `chat_messages` table using two new columns: `kind` (text, default `'text'`) and `rfq_metadata` (jsonb). The DB, API, and types layers are updated first, then two new React components (`RfqComposerDialog`, `RfqMessageCard`) are built and wired into the existing `deal-room-manager.tsx`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Bun, Tailwind CSS v4, shadcn/ui, Neon Postgres (`sql` tagged template), Lucide icons, FileReader API (data URL uploads — no R2 in deal room)

---

## File Map

| File | Action |
|------|--------|
| `lib/platform/ensure-schema.ts` | Modify — add 2 `ALTER TABLE` calls after line 1144 |
| `lib/deal-room/types.ts` | Modify — add `MessageKind`, `RfqMetadata`, extend `Message` |
| `lib/deal-room/db.ts` | Modify — update `createMessage()`, `listConversationMessages()` type cast, add `updateRfqStatus()` |
| `app/api/deal-room/conversations/[conversationId]/messages/route.ts` | Modify — accept `kind` + `rfqMetadata` in POST |
| `app/api/deal-room/conversations/[conversationId]/messages/[messageId]/rfq-status/route.ts` | Create — new PATCH route |
| `components/deal-room/rfq-composer-dialog.tsx` | Create — RFQ form dialog |
| `components/deal-room/rfq-message-card.tsx` | Create — RFQ card rendered in thread |
| `components/deal-room/deal-room-manager.tsx` | Modify — add RFQ button, dialog, render branch, status handler |

---

## Task 1: Schema Migration

**Files:**
- Modify: `lib/platform/ensure-schema.ts` (after line 1144)

- [ ] **Step 1: Add two `ALTER TABLE` calls after the `idx_chat_messages_sender` index line (line 1144)**

Insert immediately after:
```ts
await sql`create index if not exists idx_chat_messages_sender on chat_messages (sender_id)`
```

Add:
```ts
await sql`alter table chat_messages add column if not exists kind text not null default 'text'`
await sql`alter table chat_messages add column if not exists rfq_metadata jsonb`
```

- [ ] **Step 2: Run schema bootstrap to apply migration**

```bash
bun run scripts/platform-seed.ts 2>/dev/null || bun dev &
# Or just start dev server which calls ensurePlatformSchema on first request:
# Navigate to /api/... in browser, or:
node -e "require('./lib/platform/ensure-schema.ts')" 2>/dev/null || true
```

Verify columns exist:
```bash
# Check via psql or any DB client:
# SELECT column_name FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name IN ('kind', 'rfq_metadata');
# Expected: 2 rows returned
```

- [ ] **Step 3: Commit**

```bash
rtk git add lib/platform/ensure-schema.ts
rtk git commit -m "feat: add kind and rfq_metadata columns to chat_messages"
```

---

## Task 2: Types

**Files:**
- Modify: `lib/deal-room/types.ts`

- [ ] **Step 1: Add `MessageKind` and `RfqMetadata` types, extend `Message`**

Replace the full contents of `lib/deal-room/types.ts` with:

```ts
export type ConversationType = "direct"

export type MessageStatus = "sent" | "delivered" | "read"

export type MessageKind = "text" | "rfq"

export type RfqStatus = "open" | "quoted" | "closed" | "expired"

export type MessageFileType =
  | "jpg"
  | "jpeg"
  | "png"
  | "webp"
  | "mp4"
  | "pdf"
  | "md"
  | "doc"
  | "docx"
  | "csv"
  | "xlsx"

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

export interface RfqMetadata {
  productName: string
  description: string
  productImageUrl?: string
  attachmentUrl?: string
  attachmentName?: string
  quantity: number
  unit: string
  destinationCountry?: string
  targetPrice?: string
  expiryDate: string // ISO date string "YYYY-MM-DD"
  status: RfqStatus
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
  kind: MessageKind
  rfqMetadata?: RfqMetadata
}

export interface Conversation {
  id: string
  type: ConversationType
  members: ConversationMember[]
  createdAt: string
  isReadOnly: boolean
  participantArchived?: boolean
  lastMessage?: string
  lastMessageAt?: string
}
```

- [ ] **Step 2: Typecheck**

```bash
bun typecheck 2>&1 | head -40
```

Expected: type errors only from db.ts / manager (will fix in later tasks), not from types.ts itself.

- [ ] **Step 3: Commit**

```bash
rtk git add lib/deal-room/types.ts
rtk git commit -m "feat: add RfqMetadata and MessageKind types to deal-room"
```

---

## Task 3: DB Layer

**Files:**
- Modify: `lib/deal-room/db.ts`

- [ ] **Step 1: Update `createMessage()` to accept `kind` and `rfqMetadata`**

Find `createMessage` (line ~505). Replace the function with:

```ts
export async function createMessage(input: {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachments: MessageAttachment[]
  status: Message["status"]
  sentAt: string
  kind?: Message["kind"]
  rfqMetadata?: RfqMetadata
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
      is_system_message,
      kind,
      rfq_metadata
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
      false,
      ${input.kind ?? "text"},
      ${input.rfqMetadata ? JSON.stringify(input.rfqMetadata) : null}::jsonb
    )
  `
}
```

- [ ] **Step 2: Update `listConversationMessages()` type cast to include `kind` and `rfq_metadata`**

Find the `rows` type cast in `listConversationMessages` (line ~449). Replace the cast block and mapping:

```ts
  }) as {
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
    kind: Message["kind"]
    rfq_metadata: RfqMetadata | null
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
    isSystemMessage: r.is_system_message,
    kind: r.kind ?? "text",
    rfqMetadata: r.rfq_metadata ?? undefined
  }))
```

- [ ] **Step 3: Add `updateRfqStatus()` function at end of `lib/deal-room/db.ts`**

```ts
export async function updateRfqStatus(input: {
  messageId: string
  conversationId: string
  requesterId: string
  status: "quoted" | "closed"
}): Promise<{ productName: string } | null> {
  const rows = (await sql`
    update chat_messages
    set rfq_metadata = jsonb_set(
      rfq_metadata,
      '{status}',
      ${JSON.stringify(input.status)}::jsonb
    )
    where id = ${input.messageId}
      and conversation_id = ${input.conversationId}
      and kind = 'rfq'
      and sender_id != ${input.requesterId}
      and is_deleted = false
    returning rfq_metadata->>'productName' as product_name
  `) as { product_name: string }[]

  return rows[0] ? { productName: rows[0].product_name } : null
}
```

- [ ] **Step 4: Add `RfqMetadata` import at the top of `lib/deal-room/db.ts`**

The import line already imports from `@/lib/deal-room/types` — add `RfqMetadata` to the existing import:

```ts
import type {
  ChatUser,
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
  RfqMetadata
} from "@/lib/deal-room/types"
```

- [ ] **Step 5: Typecheck**

```bash
bun typecheck 2>&1 | grep "lib/deal-room" | head -20
```

Expected: no errors in `lib/deal-room/db.ts`.

- [ ] **Step 6: Commit**

```bash
rtk git add lib/deal-room/db.ts
rtk git commit -m "feat: extend deal-room db layer for RFQ kind messages"
```

---

## Task 4: Extend POST Messages API

**Files:**
- Modify: `app/api/deal-room/conversations/[conversationId]/messages/route.ts`

- [ ] **Step 1: Accept `kind` and `rfqMetadata` in POST body and pass to `createMessage`**

In the `POST` handler, update the body type and the `createMessage` call:

```ts
import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import {
  createMessage,
  isConversationParticipant,
  listConversationMessages
} from "@/lib/deal-room/db"
import type { Message, RfqMetadata } from "@/lib/deal-room/types"

interface Props {
  params: Promise<{ conversationId: string }>
}

export async function GET(_request: Request, { params }: Props) {
  const { conversationId } = await params
  try {
    const userId = await requireApiUserId()
    const messages = await listConversationMessages({
      conversationId,
      userId
    })

    return NextResponse.json({ messages })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { conversationId } = await params
    const userId = await requireApiUserId()
    const body = (await request.json()) as {
      id?: string
      senderId?: string
      content?: string
      attachments?: Message["attachments"]
      status?: Message["status"]
      sentAt?: string
      kind?: Message["kind"]
      rfqMetadata?: RfqMetadata
    }
    if (!body.id || !body.senderId || !body.sentAt) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
    }
    if (body.senderId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }
    const canAccessConversation = await isConversationParticipant({
      conversationId,
      userId
    })
    if (!canAccessConversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      )
    }
    await createMessage({
      id: body.id,
      conversationId,
      senderId: userId,
      content: body.content ?? "",
      attachments: body.attachments ?? [],
      status: body.status ?? "sent",
      sentAt: body.sentAt,
      kind: body.kind ?? "text",
      rfqMetadata: body.rfqMetadata
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
bun typecheck 2>&1 | grep "messages/route" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add app/api/deal-room/conversations/
rtk git commit -m "feat: extend POST messages API to accept RFQ kind and metadata"
```

---

## Task 5: PATCH RFQ Status API

**Files:**
- Create: `app/api/deal-room/conversations/[conversationId]/messages/[messageId]/rfq-status/route.ts`

- [ ] **Step 1: Create the directory and route file**

```bash
mkdir -p app/api/deal-room/conversations/\[conversationId\]/messages/\[messageId\]/rfq-status
```

- [ ] **Step 2: Write the PATCH route**

Create `app/api/deal-room/conversations/[conversationId]/messages/[messageId]/rfq-status/route.ts`:

```ts
import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import {
  createMessage,
  isConversationParticipant,
  updateRfqStatus
} from "@/lib/deal-room/db"

interface Props {
  params: Promise<{ conversationId: string; messageId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { conversationId, messageId } = await params
    const userId = await requireApiUserId()

    const body = (await request.json()) as { status?: string }
    if (body.status !== "quoted" && body.status !== "closed") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 })
    }

    const canAccess = await isConversationParticipant({
      conversationId,
      userId
    })
    if (!canAccess) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      )
    }

    const result = await updateRfqStatus({
      messageId,
      conversationId,
      requesterId: userId,
      status: body.status
    })
    if (!result) {
      return NextResponse.json(
        { error: "RFQ not found or cannot be updated." },
        { status: 404 }
      )
    }

    const label = body.status === "quoted" ? "Quoted" : "Closed"
    await createMessage({
      id: `msg-sys-${Date.now()}`,
      conversationId,
      senderId: "system",
      content: `RFQ for "${result.productName}" has been marked as ${label}.`,
      attachments: [],
      status: "sent",
      sentAt: new Date().toISOString(),
      kind: "text"
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error updating RFQ status:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Typecheck**

```bash
bun typecheck 2>&1 | grep "rfq-status" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
rtk git add app/api/deal-room/conversations/
rtk git commit -m "feat: add PATCH rfq-status API for deal room RFQ lifecycle"
```

---

## Task 6: RfqComposerDialog Component

**Files:**
- Create: `components/deal-room/rfq-composer-dialog.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { CalendarIcon, PaperclipIcon, UploadIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { RfqMetadata } from "@/lib/deal-room/types"

const MAX_DESCRIPTION_LENGTH = 400
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5 MB
const IMAGE_TYPES = new Set(["jpg", "jpeg", "png", "webp"])
const ATTACHMENT_TYPES = new Set(["pdf", "doc", "docx", "xlsx", "csv"])

function getDefaultExpiry(): string {
  const d = new Date()
  d.setDate(d.getDate() + 120)
  return d.toISOString().slice(0, 10)
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "#")
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

interface Props {
  open: boolean
  onClose: () => void
  onSendRfq: (metadata: RfqMetadata) => void
}

export function RfqComposerDialog({ open, onClose, onSendRfq }: Props) {
  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState("piece")
  const [destinationCountry, setDestinationCountry] = useState("")
  const [targetPrice, setTargetPrice] = useState("")
  const [expiryDate, setExpiryDate] = useState(getDefaultExpiry)
  const [productImageUrl, setProductImageUrl] = useState<string | undefined>()
  const [productImageName, setProductImageName] = useState<string | undefined>()
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>()
  const [attachmentName, setAttachmentName] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!IMAGE_TYPES.has(ext)) {
      setError("Image must be JPG, JPEG, PNG, or WEBP.")
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be under 5 MB.")
      return
    }
    setError(null)
    const url = await fileToDataUrl(file)
    setProductImageUrl(url)
    setProductImageName(file.name)
    e.target.value = ""
  }

  async function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ATTACHMENT_TYPES.has(ext)) {
      setError("Attachment must be PDF, DOC, DOCX, XLSX, or CSV.")
      return
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setError("Attachment must be under 5 MB.")
      return
    }
    setError(null)
    setAttachmentUrl("#")
    setAttachmentName(file.name)
    e.target.value = ""
  }

  function handleSubmit() {
    if (!productName.trim()) {
      setError("Product name is required.")
      return
    }
    if (!description.trim()) {
      setError("Description is required.")
      return
    }
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty < 1) {
      setError("Quantity must be at least 1.")
      return
    }
    if (!expiryDate) {
      setError("Expiry date is required.")
      return
    }
    setError(null)
    onSendRfq({
      productName: productName.trim(),
      description: description.trim(),
      productImageUrl,
      attachmentUrl,
      attachmentName,
      quantity: qty,
      unit,
      destinationCountry: destinationCountry.trim() || undefined,
      targetPrice: targetPrice.trim() || undefined,
      expiryDate,
      status: "open"
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-80">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close RFQ dialog"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-start justify-center p-3 sm:p-4">
        <div className="relative mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-3xl flex-col rounded-4xl bg-white p-3 shadow-2xl sm:mt-6 sm:p-4">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-4">
              <h3 className="font-semibold text-xl">Request for Quotation</h3>

              <section className="space-y-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-sm">Product Name</label>
                  <Input
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-sm">Description</label>
                  <Textarea
                    className="min-h-28 resize-none"
                    placeholder="Describe your requirements..."
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Product image upload */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Upload product image (1 image)</p>
                    <p className="text-muted-foreground text-xs">Format jpg, jpeg, png, webp, max 5 MB</p>
                    {productImageUrl ? (
                      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-sm">{productImageName}</span>
                        <button
                          type="button"
                          onClick={() => { setProductImageUrl(undefined); setProductImageName(undefined) }}
                        >
                          <XIcon className="size-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex h-28 w-full flex-col items-center justify-center rounded-lg border border-muted-foreground/40 border-dashed bg-muted/20"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <UploadIcon className="mb-2 size-5 text-muted-foreground" />
                        <p className="font-medium text-sm">Upload image</p>
                        <input
                          ref={imageInputRef}
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleImageChange}
                        />
                      </button>
                    )}
                  </div>

                  {/* Attachment upload */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Upload attachment</p>
                    <p className="text-muted-foreground text-xs">Format pdf, doc, docx, xlsx, csv, max 5 MB</p>
                    {attachmentName ? (
                      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">{attachmentName}</span>
                        <button
                          type="button"
                          onClick={() => { setAttachmentUrl(undefined); setAttachmentName(undefined) }}
                        >
                          <XIcon className="size-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex h-28 w-full flex-col items-center justify-center rounded-lg border border-muted-foreground/40 border-dashed bg-muted/20"
                        onClick={() => attachmentInputRef.current?.click()}
                      >
                        <UploadIcon className="mb-2 size-5 text-muted-foreground" />
                        <p className="font-medium text-sm">Upload file</p>
                        <input
                          ref={attachmentInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xlsx,.csv"
                          onChange={handleAttachmentChange}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-3 border-muted border-t pt-4">
                <h3 className="font-semibold text-base">Quantity &amp; Pricing</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">Unit</label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="20ft-flat-rack">20ft Flat Rack</SelectItem>
                        <SelectItem value="40ft-container">40ft Container</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">Destination Country</label>
                    <Input
                      placeholder="Enter destination country"
                      value={destinationCountry}
                      onChange={(e) => setDestinationCountry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-sm">Target Price (Optional)</label>
                    <Input
                      placeholder="e.g. 1.0000 USD"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <div className="rounded-2xl border border-muted bg-muted/30 p-4">
                <p className="font-medium text-sm">Expiry date</p>
                <div className="relative mt-3">
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="pr-9"
                  />
                  <CalendarIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900 text-sm">
                <p className="flex gap-2">
                  <span>🕒</span>
                  <span>
                    This RFQ will be automatically closed after{" "}
                    <strong>120 days</strong>, regardless of quotation status.
                  </span>
                </p>
              </div>

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-2 pb-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-legend text-white hover:bg-legend-600"
              onClick={handleSubmit}
            >
              Send RFQ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
bun typecheck 2>&1 | grep "rfq-composer" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add components/deal-room/rfq-composer-dialog.tsx
rtk git commit -m "feat: add RfqComposerDialog component for deal room"
```

---

## Task 7: RfqMessageCard Component

**Files:**
- Create: `components/deal-room/rfq-message-card.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { DownloadIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Message, RfqStatus } from "@/lib/deal-room/types"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<RfqStatus, string> = {
  open: "Open",
  quoted: "Quoted",
  closed: "Closed",
  expired: "Expired"
}

const STATUS_VARIANT: Record<RfqStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  quoted: "bg-amber-100 text-amber-800",
  closed: "bg-green-100 text-green-800",
  expired: "bg-muted text-muted-foreground"
}

const UNIT_LABEL: Record<string, string> = {
  piece: "Piece",
  "20ft-flat-rack": "20ft Flat Rack",
  "40ft-container": "40ft Container"
}

interface Props {
  message: Message
  isOwn: boolean
  currentUserId: string
  onStatusUpdate: (messageId: string, status: "quoted" | "closed") => void
}

export function RfqMessageCard({
  message,
  isOwn,
  currentUserId: _currentUserId,
  onStatusUpdate
}: Props) {
  const meta = message.rfqMetadata
  if (!meta) return null

  const isExpired =
    new Date(meta.expiryDate) < new Date() &&
    (meta.status === "open" || meta.status === "quoted")

  const effectiveStatus: RfqStatus = isExpired ? "expired" : meta.status
  const canAct = !isOwn && (effectiveStatus === "open" || effectiveStatus === "quoted")

  return (
    <div
      className={cn(
        "w-80 max-w-full rounded-2xl border bg-background shadow-sm",
        isOwn ? "border-legend/30" : "border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold text-sm">Request for Quotation</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            STATUS_VARIANT[effectiveStatus]
          )}
        >
          {STATUS_LABEL[effectiveStatus]}
        </span>
      </div>

      {/* Product image */}
      {meta.productImageUrl && (
        <div className="border-b">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.productImageUrl}
            alt={meta.productName}
            className="h-36 w-full rounded-none object-cover"
          />
        </div>
      )}

      {/* Body */}
      <div className="space-y-2.5 px-4 py-3">
        <div>
          <p className="font-semibold text-sm">{meta.productName}</p>
          <p className="mt-0.5 line-clamp-3 text-muted-foreground text-xs">
            {meta.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div>
            <span className="text-muted-foreground">Qty: </span>
            <span className="font-medium">
              {meta.quantity} {UNIT_LABEL[meta.unit] ?? meta.unit}
            </span>
          </div>
          {meta.destinationCountry && (
            <div>
              <span className="text-muted-foreground">Destination: </span>
              <span className="font-medium">{meta.destinationCountry}</span>
            </div>
          )}
          {meta.targetPrice && (
            <div>
              <span className="text-muted-foreground">Target: </span>
              <span className="font-medium">{meta.targetPrice}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Expires: </span>
            <span className="font-medium">
              {new Date(meta.expiryDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {meta.attachmentName && (
          <a
            href={meta.attachmentUrl ?? "#"}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
            download={meta.attachmentName}
          >
            <DownloadIcon className="size-3.5" />
            <span className="truncate">{meta.attachmentName}</span>
          </a>
        )}
      </div>

      {/* Actions — visible to recipient only */}
      {canAct && (
        <div className="flex gap-2 border-t px-4 py-3">
          {effectiveStatus === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onStatusUpdate(message.id, "quoted")}
            >
              Mark as Quoted
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive text-xs hover:bg-destructive/10"
            onClick={() => onStatusUpdate(message.id, "closed")}
          >
            Close RFQ
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
bun typecheck 2>&1 | grep "rfq-message" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add components/deal-room/rfq-message-card.tsx
rtk git commit -m "feat: add RfqMessageCard component for deal room thread"
```

---

## Task 8: Wire Into DealRoomManager

**Files:**
- Modify: `components/deal-room/deal-room-manager.tsx`

This task has 5 changes. Make them in order.

- [ ] **Step 1: Add imports at the top of `deal-room-manager.tsx`**

Add `ClipboardListIcon` to the existing lucide-react import block (line ~4):
```ts
ClipboardListIcon,
```

Add component imports after the existing local imports (before `const MAX_ATTACHMENTS...`):
```ts
import { RfqComposerDialog } from "./rfq-composer-dialog"
import { RfqMessageCard } from "./rfq-message-card"
```

Also add `RfqMetadata` to the types import from `@/lib/deal-room/types`:
```ts
import type { ChatUser, Conversation, Message, RfqMetadata } from "@/lib/deal-room/types"
```

- [ ] **Step 2: Add `showRfqDialog` state near the other composer states (around line 293)**

After `const [composerError, setComposerError] = useState<string | null>(null)` add:
```ts
const [showRfqDialog, setShowRfqDialog] = useState(false)
```

- [ ] **Step 3: Add `handleSendRfq` and `handleRfqStatusUpdate` functions after `handleSendMessage` (around line 518)**

```ts
async function handleSendRfq(rfqMetadata: RfqMetadata) {
  if (!activeConversationId) return
  const newMsg: Message = {
    id: `msg-${Date.now()}`,
    conversationId: activeConversationId,
    senderId: currentUserId,
    content: `RFQ: ${rfqMetadata.productName}`,
    attachments: [],
    status: "sent",
    sentAt: new Date().toISOString(),
    isDeleted: false,
    isSystemMessage: false,
    kind: "rfq",
    rfqMetadata
  }
  try {
    const response = await fetch(
      `/api/deal-room/conversations/${activeConversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newMsg.id,
          senderId: newMsg.senderId,
          content: newMsg.content,
          attachments: [],
          status: newMsg.status,
          sentAt: newMsg.sentAt,
          kind: "rfq",
          rfqMetadata
        })
      }
    )
    if (!response.ok) return
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] ?? []), newMsg]
    }))
  } catch {
    // keep silent — optimistic message not shown on failure
  }
}

async function handleRfqStatusUpdate(
  messageId: string,
  status: "quoted" | "closed"
) {
  if (!activeConversationId) return
  try {
    const response = await fetch(
      `/api/deal-room/conversations/${activeConversationId}/messages/${messageId}/rfq-status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      }
    )
    if (!response.ok) return
    // Update local state for the RFQ message
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]:
        prev[activeConversationId]?.map((m) =>
          m.id === messageId && m.rfqMetadata
            ? { ...m, rfqMetadata: { ...m.rfqMetadata, status } }
            : m
        ) ?? []
    }))
    // Re-fetch messages to get the system message inserted by server
    const msgRes = await fetch(
      `/api/deal-room/conversations/${activeConversationId}/messages`
    )
    if (msgRes.ok) {
      const data = (await msgRes.json()) as { messages: Message[] }
      setMessagesMap((prev) => ({
        ...prev,
        [activeConversationId]: data.messages
      }))
    }
  } catch {
    // silent — UI still reflects local update
  }
}
```

- [ ] **Step 4: Add RFQ button in the composer toolbar (around line 1065)**

Find the composer's attachment button:
```tsx
<Button size="icon" variant="ghost" asChild>
  <label className="cursor-pointer">
    <input
      type="file"
      ...
    />
    <PaperclipIcon className="size-4" />
    <span className="sr-only">Attach files</span>
  </label>
</Button>
```

Add the RFQ button immediately **after** the Paperclip button (before the `<Textarea>`):
```tsx
<Button
  size="icon"
  variant="ghost"
  type="button"
  title="Send RFQ"
  onClick={() => setShowRfqDialog(true)}
>
  <ClipboardListIcon className="size-4" />
  <span className="sr-only">Send RFQ</span>
</Button>
```

- [ ] **Step 5: Add RFQ render branch and dialog in JSX**

In the message render loop (around line 813), find the system message branch:
```tsx
if (msg.isSystemMessage) {
  return (
    <div key={msg.id} className="flex justify-center py-1">
```

Insert a new branch **before** it:
```tsx
// RFQ message card
if (msg.kind === "rfq" && msg.rfqMetadata) {
  return (
    <div
      key={msg.id}
      className={cn(
        "flex",
        isOwn ? "justify-end" : "justify-start",
        idx > 0 &&
          activeMessages[idx - 1].senderId !== msg.senderId &&
          "mt-3"
      )}
    >
      <RfqMessageCard
        message={msg}
        isOwn={isOwn}
        currentUserId={currentUserId}
        onStatusUpdate={handleRfqStatusUpdate}
      />
    </div>
  )
}
```

Find where `<RfqComposerDialog>` should be mounted — add it just before the closing `</div>` of the main return (after line 1107, before `</div>`):
```tsx
<RfqComposerDialog
  open={showRfqDialog}
  onClose={() => setShowRfqDialog(false)}
  onSendRfq={handleSendRfq}
/>
```

- [ ] **Step 6: Typecheck**

```bash
bun typecheck 2>&1 | grep "deal-room-manager\|rfq" | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
rtk git add components/deal-room/deal-room-manager.tsx
rtk git commit -m "feat: integrate RFQ send and card into deal-room-manager"
```

---

## Task 9: Schema Migration (Dev DB)

The schema migration in Task 1 is added to `ensure-schema.ts` but only runs when the function is called. Trigger it now against the shared dev/prod DB.

- [ ] **Step 1: Start dev server to trigger `ensurePlatformSchema`**

```bash
bun dev &
# Wait a few seconds, then make a request:
curl -s http://localhost:1995/api/deal-room/conversations 2>/dev/null | head -5
```

Or trigger directly by visiting any deal-room page in the browser.

- [ ] **Step 2: Verify columns exist on live DB**

```bash
# Use any DB inspection tool or:
curl -s http://localhost:1995/api/deal-room/conversations/TEST_ID/messages \
  -H "Content-Type: application/json" 2>/dev/null
# Expected: either 401 (auth) or 404 (not found) — not a DB column error
```

- [ ] **Step 3: Final typecheck and lint**

```bash
bun typecheck 2>&1 | grep -v "node_modules" | grep "error TS" | head -20
bun check 2>&1 | tail -10
```

Expected: 0 new errors (14 pre-existing TS errors are fine).

- [ ] **Step 4: Final commit if any lint fixes**

```bash
rtk git status
# If bun check auto-fixed formatting:
rtk git add -A
rtk git commit -m "chore: lint fixes after deal room RFQ feature"
```
