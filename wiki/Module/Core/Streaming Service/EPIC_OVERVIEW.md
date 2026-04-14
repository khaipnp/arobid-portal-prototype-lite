# Epic Overview: Streaming Service

## 1. Business Context

The Streaming Service epic provides the **platform-level live streaming capability** for Arobid. Any product module — TradeXpo, B2B Marketplace, or future modules — can provision and run a stream session without re-implementing streaming infrastructure.

The service is responsible for:
- Issuing private stream credentials to a designated host
- Detecting when a broadcast starts and ends via RTMP ingest
- Distributing the live video feed to viewers
- Recording and serving replay content after the stream ends
- Hosting a real-time public comment thread attached to each stream session

This epic defines **generic streaming primitives**. It has no knowledge of TradeXpo Expos, B2B products, or any module-specific business context. Modules that use this service define their own business rules on top.

## 2. Scope

| In Scope | Out of Scope |
|----------|-------------|
| Provisioning a stream session with private credentials | Module-specific session management UI |
| RTMP-based broadcast from external tools (OBS, Streamlabs) | Native in-browser broadcasting studio |
| Live video delivery to viewers | AI-generated captions / transcription |
| Replay recording and playback | Automated clip generation |
| Real-time public comment thread per stream session | Advanced moderation (Q&A voting, pinning, reactions) |
| Basic comment moderation (delete by authorized users) | Multi-speaker / co-host stage management |
| Guest comment identity capture (display name + email) | |

## 3. Product Model

### Generic Actors

| Actor | Role |
|-------|------|
| **Platform / Module** | Provisions a stream session on behalf of its business context |
| **Stream Host** | The designated broadcaster — receives credentials and goes live via RTMP |
| **Stream Viewer** | Watches the live stream or replay; may post comments during a live session |

### Core Primitives

The primary object is a **StreamSession** — a single broadcast instance. A module creates a StreamSession when it needs to run a live content event. The StreamSession owns the stream credentials, tracks the broadcast lifecycle, and anchors all live comments.

## 4. Data Model

### StreamSession

| Field | Type | Description |
|-------|------|-------------|
| `streamSessionId` | String | Internal session ID |
| `status` | Enum | `Provisioned` \| `Active` \| `Ended` \| `Canceled` |
| `hostUserId` | FK | Designated broadcaster / stream host |
| `streamUrl` | String | Private RTMP endpoint |
| `streamKeyEncrypted` | String | Private stream credential |
| `replayEnabled` | Boolean | Whether replay should be available after the stream ends |
| `replayUrl` | String, nullable | Playback URL for the recorded session |
| `startedAt` | DateTime, nullable | Actual stream start time |
| `endedAt` | DateTime, nullable | Actual stream end time |
| `peakViewerCount` | Integer, nullable | Peak concurrent viewers during the session |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### LiveComment

| Field | Type | Description |
|-------|------|-------------|
| `liveCommentId` | String | Internal comment ID |
| `streamSessionId` | FK | Parent stream session |
| `authorUserId` | FK, nullable | Present for authenticated users |
| `guestDisplayName` | String, nullable | Present for guest commenters |
| `guestEmail` | String, nullable | Stored privately, never shown publicly |
| `commentText` | Text | Max 500 characters |
| `isDeleted` | Boolean | Soft-delete flag |
| `createdAt` | DateTime | |
| `deletedAt` | DateTime, nullable | |
| `deletedByUserId` | FK, nullable | User who removed the comment |

## 5. StreamSession State Machine

```
Provisioned ──[valid stream ingest]──► Active
Provisioned ──[canceled]─────────────► Canceled
Active ──────[stream ends / timeout]─► Ended
```

### State Meaning

| Status | Meaning |
|--------|---------|
| `Provisioned` | Session created; credentials issued; waiting for the host to start streaming |
| `Active` | Host is currently streaming; live video is being distributed to viewers |
| `Ended` | Stream has ended; replay may be available |
| `Canceled` | Session was canceled before going live |

## 6. Story Map

| # | Story | Actor |
|---|-------|-------|
| [US-01] | Provision a Stream Session | Platform / Module |
| [US-02] | Broadcast a Stream Session | Stream Host |
| [US-03] | Watch a Stream Session | Stream Viewer |
| [US-04] | Live Comments in a Stream Session | Stream Viewer / Moderator |

## 7. Dependencies

| Dependency | Direction | Note |
|-----------|-----------|------|
| Authentication / Identity | Upstream | User identity required for Stream Host assignment and authenticated viewer comments |
| RTMP ingest / video delivery infrastructure | Platform dependency | Detects stream start/end and distributes live playback to viewers |
| Realtime messaging layer | Platform dependency | Delivers live comments and status updates to viewers without page refresh |

## 8. Key Product Rules

| Topic | Rule |
|------|------|
| Credential scoping | Stream credentials are private, issued per StreamSession, and valid only for that session |
| Credential lifecycle | Credentials are invalidated when the session transitions to `Ended` or `Canceled` |
| Watch access | Any user (guest or authenticated) can watch a live stream or replay |
| Comment access | Anyone can read comments; posting is allowed only while the session is `Active` |
| Guest comments | Guest must provide display name and email before their first comment in a session; identity is remembered for the duration of the browser session |
| Moderation | Authorized users (defined by the consuming module) can delete any comment |
| Replay | Optional per session; only available after the session has ended and a replay asset exists |

## 9. Summary

The Streaming Service provides the foundational live content primitives for Arobid: provision a stream session, broadcast it, watch it, and comment on it in real time. It is module-agnostic — any product area can build live content experiences on top of these primitives without re-implementing the streaming layer.
