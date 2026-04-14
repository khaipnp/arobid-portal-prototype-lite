# Epic Overview: Event GoLIVE

## 1. Business Context

The Event GoLIVE epic is the **live content programming layer** for TradeXpo. It builds on top of **Core: Streaming Service** to represent scheduled live sessions — workshops, talkshows, keynotes, panel discussions, and product demos — as first-class items in the Expo agenda.

In an offline Expo, these sessions happen on a physical stage or in a seminar room. In TradeXpo, the same concept is a **GoLIVE Event** — an Expo session scoped to a specific Expo, scheduled and managed by the Organizer, broadcast live by a designated Broadcaster, and watched by Visitors on the Expo Detail page.

This epic focuses exclusively on the **TradeXpo business layer**:
- How Organizers create and manage GoLIVE sessions within an Expo
- How GoLIVE sessions appear and behave on the Expo Detail page
- How Expo-level visibility rules govern what Visitors see

Broadcast mechanics, video delivery, replay, and live comments are handled by **Core: Streaming Service**.

## 2. Scope

| In Scope | Out of Scope |
|----------|-------------|
| Create, edit, and cancel GoLIVE sessions within an Expo | Streaming infrastructure (handled by Core: Streaming Service) |
| Session scheduling with or without a start time | Live comments (handled by Core: Streaming Service) |
| Session type classification (Workshop, Keynote, etc.) | External event ticketing |
| Broadcaster assignment per session | Multi-speaker stage management |
| GoLIVE schedule display on Expo Detail page | Native in-browser broadcasting studio |
| Expo visibility rules (Upcoming / Live / Archive) | AI-generated captions / transcription |

## 3. Product Model

### GoLIVE Event as an Expo Session

A `GoLIVEEvent` is a **session item in the agenda of an Expo**. It wraps a `StreamSession` from Core: Streaming Service and adds TradeXpo-specific context: scheduling, session type, Expo linkage, and broadcaster assignment.

### Actor Mapping

| TradeXpo Actor | Core Streaming Role |
|----------------|---------------------|
| **Expo Organizer** | Provisions the StreamSession (via GoLIVEEvent creation) |
| **Broadcaster** | Stream Host — receives credentials, goes live via RTMP |
| **Visitor** | Stream Viewer — watches live or replay on the Expo Detail page |

## 4. Data Model

### GoLIVEEvent

| Field | Type | Description |
|-------|------|-------------|
| `goLiveEventId` | String | Internal session ID |
| `expoId` | FK | Parent Expo |
| `streamSessionId` | FK | Linked Core StreamSession |
| `title` | String | Session title. Max 100 characters |
| `description` | Text, nullable | Session description shown to Visitors |
| `thumbnailUrl` | String, nullable | Optional cover image |
| `sessionType` | Enum | `Workshop` \| `Talkshow` \| `Keynote` \| `Panel` \| `ProductDemo` \| `Other` |
| `scheduledStartAt` | DateTime, nullable | Planned session start time. Absent if the session is on-demand |
| `status` | Enum | `Scheduled` \| `Ready` \| `Live` \| `Ended` \| `Canceled` |
| `broadcasterUserId` | FK | Assigned broadcaster; must be a member of the Expo |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

> `LiveComment` is owned by Core: Streaming Service and linked via `streamSessionId`. TradeXpo does not duplicate this model.

## 5. GoLIVE Event Status Machine

### Status Transitions

```
Create with scheduledStartAt ───► Scheduled
Create without scheduledStartAt ─► Ready

Scheduled ──[Core stream goes Active]──► Live
Ready ──────[Core stream goes Active]──► Live

Scheduled ──[Organizer cancels]────────► Canceled
Ready ──────[Organizer cancels]────────► Canceled

Live ────────[Core stream ends]─────────► Ended
```

### Mapping to Core StreamSession

| GoLIVEEvent status | Core StreamSession status | Note |
|--------------------|--------------------------|------|
| `Scheduled` | `Provisioned` | Has a planned start time |
| `Ready` | `Provisioned` | No planned start time; can go live at any time |
| `Live` | `Active` | Broadcaster has started streaming |
| `Ended` | `Ended` | Stream has stopped |
| `Canceled` | `Canceled` | Session was canceled before going live |

`Scheduled` and `Ready` are both `Provisioned` at the Core level. The distinction is TradeXpo business logic: a session either has a scheduled time or it does not.

### State Meaning

| Status | Meaning |
|--------|---------|
| `Scheduled` | Session is published with a planned start time and is not yet live |
| `Ready` | Session is created without a planned time; can go live when the broadcaster starts |
| `Live` | Session is actively streaming; reflects the linked StreamSession transitioning to `Active` |
| `Ended` | Session has finished; replay may be available via Core |
| `Canceled` | Session was canceled before going live |

### Expo Visibility Rules

| Expo Status | GoLIVE Visibility |
|------------|-------------------|
| `Upcoming` | Show `Scheduled` and `Ready` sessions as upcoming agenda items |
| `Live` | Show all non-canceled sessions; `Live` sessions are watchable |
| `Archive` | Show `Ended` sessions only if replay is available |

## 6. Story Map

| # | Story | Actor | Scope |
|---|-------|-------|-------|
| [US-01] | Create and Manage a GoLIVE Event | Expo Organizer | Session setup, scheduling, broadcaster assignment |
| [US-02] | GoLIVE Session on Expo Detail Page | Visitor | Schedule display, watch entry point, replay access |

## 7. Dependencies

| Dependency | Direction | Note |
|-----------|-----------|------|
| **Core: Streaming Service** | Upstream | Provides StreamSession, stream credentials, broadcast detection, replay, and live comments |
| Expo Management | Upstream | Organizer accesses GoLIVE management within the Expo Management panel |
| Expo Detail Page ([US-01][TX]) | Downstream | GoLIVE schedule section is rendered as a component on this page |
| Authentication / Roles | Upstream | Organizer and Broadcaster role permissions |

## 8. Key Product Rules

| Topic | Rule |
|------|------|
| Session ownership | Every GoLIVE Event belongs to exactly one Expo |
| Broadcaster assignment | Each session has one designated broadcaster in v1 |
| Broadcaster scope | Designated broadcaster must be a member of the Expo (Organizer or Exhibitor) |
| Stream credentials | Managed by Core: Streaming Service; visible only to the designated broadcaster |
| Status source | GoLIVEEvent status is the business-facing status; it reflects changes in the linked StreamSession |
| Editing rules | A GoLIVE Event can be edited only when status is `Scheduled` or `Ready`; editing is disabled while `Live` |
| Cancel vs. Delete | Canceling marks the session as `Canceled` and retains it in Expo history; deleting removes it entirely and is only available before the session goes live |
| Replay | Controlled by `replayEnabled` on the Core StreamSession; the GoLIVE Event surface shows replay if the asset is available after the session ends |

## 9. Summary

Event GoLIVE turns Expo agenda sessions into interactive online live content for TradeXpo. Session scheduling, Expo integration, and broadcaster assignment are defined here. Streaming mechanics, video delivery, and live comments are delegated to Core: Streaming Service, keeping this epic focused on TradeXpo business rules.
