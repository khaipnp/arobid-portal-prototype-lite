# Deal Room RFQ Feature Design

**Date:** 2026-06-17  
**Status:** Approved

## Overview

Add the ability to send Request for Quotation (RFQ) messages inside the Deal Room chat. RFQs are structured messages rendered as rich cards in the conversation thread, with a lifecycle of `open → quoted → closed / expired`. Both sides of a conversation (seller and partner/organizer) can send RFQs.

---

## 1. Data Model

### Schema Migration

Two columns added to the existing `chat_messages` table:

```sql
ALTER TABLE chat_messages
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN rfq_metadata JSONB;
```

- `kind` — `'text'` (default) or `'rfq'`
- `rfq_metadata` — nullable, only populated when `kind = 'rfq'`

### RFQ Metadata Shape

```ts
interface RfqMetadata {
  productName: string
  description: string
  productImageUrl?: string    // R2 URL for uploaded product image
  attachmentUrl?: string      // R2 URL for uploaded attachment
  quantity: number
  unit: string                // e.g. '20ft-flat-rack' | '40ft-container' | 'piece'
  destinationCountry?: string
  targetPrice?: string        // e.g. "1.0000 USD"
  expiryDate: string          // ISO date string
  status: 'open' | 'quoted' | 'closed' | 'expired'
}
```

### TypeScript Type Extensions (`lib/deal-room/types.ts`)

```ts
export type MessageKind = 'text' | 'rfq'

export interface RfqMetadata {
  productName: string
  description: string
  productImageUrl?: string
  attachmentUrl?: string
  quantity: number
  unit: string
  destinationCountry?: string
  targetPrice?: string
  expiryDate: string
  status: 'open' | 'quoted' | 'closed' | 'expired'
}

// Message interface extended:
export interface Message {
  // ...existing fields...
  kind: MessageKind            // default 'text'
  rfqMetadata?: RfqMetadata   // present when kind === 'rfq'
}
```

---

## 2. Components

### 2a. `RfqComposerDialog` — new file

**Path:** `components/deal-room/rfq-composer-dialog.tsx`

A modal dialog triggered from the deal-room composer toolbar. Fields (matching `exhibitor-rfq-dialog.tsx`):

- **Product section:** Product Name (Input), Description (Textarea with char counter)
- **Uploads:** Product image (1 image, jpg/jpeg/png/webp, max 5 MB), Attachment (pdf/doc/docx/xlsx/csv, max 5 MB) — both via R2 upload API
- **Quantity & Pricing:** Quantity (Input), Unit (Select: 20ft Flat Rack / 40ft Container / Piece), Destination Country (Input, optional), Target Price (Input, optional, default "1.0000 USD")
- **Expiry date:** Date picker, default 120 days from today. Info banner: "This RFQ will be automatically closed after 120 days."

On submit: calls `onSendRfq(rfqMetadata: RfqMetadata)` prop, which triggers `handleSendRfq()` in the manager.

### 2b. `RfqMessageCard` — new file

**Path:** `components/deal-room/rfq-message-card.tsx`

Rendered inline in the message thread when `message.kind === 'rfq'`. Layout:

- Header: "Request for Quotation" label + status badge
- Body: product name (bold), description snippet, quantity + unit, destination (if set), target price (if set), expiry date
- Product image thumbnail if present; attachment download link if present
- Footer action buttons — shown only to **recipient** (not the sender of this RFQ):
  - "Mark as Quoted" (only if status is `open`) → calls rfq-status PATCH
  - "Close RFQ" (only if status is `open` or `quoted`) → calls rfq-status PATCH

**Expired detection (client-side only):** if `expiryDate < today` and status is `open` or `quoted` → display badge as `expired`, hide action buttons. DB is not updated (prototype scope).

**Status badge colors:**
- `open` → blue
- `quoted` → amber  
- `closed` → green
- `expired` → gray

### 2c. `deal-room-manager.tsx` — two modifications

1. **Composer toolbar:** Add "Send RFQ" button (FileTextIcon or ClipboardListIcon) next to the attachment button. Opens `<RfqComposerDialog>`.

2. **Message render loop:** In the existing message rendering section, branch on `m.kind`:
   - `'rfq'` → `<RfqMessageCard message={m} currentUserId={currentUserId} onStatusUpdate={handleRfqStatusUpdate} />`
   - `'text'` (default) → existing text/attachment bubble render

---

## 3. API

### 3a. Extended: `POST /api/deal-room/conversations/[id]/messages`

Accept two additional optional fields in the request body:

```ts
{
  // ...existing fields...
  kind?: 'text' | 'rfq'        // default 'text'
  rfqMetadata?: RfqMetadata
}
```

`createMessage()` in `lib/deal-room/db.ts` updated to insert `kind` and `rfq_metadata` columns.

### 3b. New: `PATCH /api/deal-room/conversations/[id]/messages/[msgId]/rfq-status`

**File:** `app/api/deal-room/conversations/[conversationId]/messages/[messageId]/rfq-status/route.ts`

Request body:
```ts
{ status: 'quoted' | 'closed' }
```

Authorization rules:
- Caller must be a conversation participant (existing `isConversationParticipant` check)
- Caller must **not** be the sender of the RFQ message (only the recipient can update status)

DB update:
```sql
UPDATE chat_messages
SET rfq_metadata = jsonb_set(rfq_metadata, '{status}', '"quoted"'::jsonb)
WHERE id = $msgId
  AND conversation_id = $conversationId
  AND kind = 'rfq'
  AND sender_id != $userId
RETURNING id
```

After successful update: auto-insert a system message into the thread:
- `"RFQ for '[productName]' has been marked as Quoted."`
- `"RFQ for '[productName]' has been closed."`

New DB helper `updateRfqStatus()` added to `lib/deal-room/db.ts`.

---

## 4. File Change Summary

| File | Action |
|------|--------|
| `lib/deal-room/types.ts` | Add `MessageKind`, `RfqMetadata`, extend `Message` |
| `lib/deal-room/db.ts` | Update `createMessage()`, add `updateRfqStatus()` |
| `components/deal-room/rfq-composer-dialog.tsx` | New component |
| `components/deal-room/rfq-message-card.tsx` | New component |
| `components/deal-room/deal-room-manager.tsx` | Add RFQ button in toolbar, branch render for rfq kind |
| `app/api/deal-room/conversations/[id]/messages/route.ts` | Accept `kind` + `rfqMetadata` |
| `app/api/deal-room/conversations/[id]/messages/[msgId]/rfq-status/route.ts` | New PATCH route |
| DB migration | `ALTER TABLE chat_messages ADD COLUMN kind, rfq_metadata` |

---

## 5. Out of Scope

- Cron job for auto-expiring RFQs (expired detected client-side only)
- RFQ listing / history view (accessed via existing conversation thread)
- Email/push notifications on RFQ status change
- Multiple quotes per RFQ
