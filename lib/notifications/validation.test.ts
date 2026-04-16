import { describe, expect, test } from "bun:test"

import { parseNotificationEvent } from "@/lib/notifications/validation"

describe("parseNotificationEvent", () => {
  const validPayload = {
    userId: "user-1",
    source: "chat",
    type: "message_received",
    title: "New message",
    body: "You have a new message",
    deepLinkPath: "/chat/conversations/abc",
  } as const

  test("accepts valid event payload", () => {
    const payload = parseNotificationEvent(validPayload)

    expect(payload.userId).toBe("user-1")
    expect(payload.title).toBe("New message")
  })

  test("rejects payload missing title", () => {
    expect(() =>
      parseNotificationEvent({
        ...validPayload,
        title: "",
      }),
    ).toThrow("missing required notification fields")
  })

  test("rejects payload missing body", () => {
    expect(() =>
      parseNotificationEvent({
        ...validPayload,
        body: "",
      }),
    ).toThrow("missing required notification fields")
  })

  test("rejects payload with non-string title", () => {
    expect(() =>
      parseNotificationEvent({
        ...validPayload,
        title: 123,
      }),
    ).toThrow("missing required notification fields")
  })

  test("rejects payload with non-string deepLinkPath", () => {
    expect(() =>
      parseNotificationEvent({
        ...validPayload,
        deepLinkPath: { path: "/chat" },
      }),
    ).toThrow("missing required notification fields")
  })

  test("rejects title longer than 80 chars", () => {
    expect(() =>
      parseNotificationEvent({
        ...validPayload,
        title: "x".repeat(81),
      }),
    ).toThrow("title must be <= 80 characters")
  })

  test("rejects body longer than 120 chars", () => {
    expect(() =>
      parseNotificationEvent({
        ...validPayload,
        body: "x".repeat(121),
      }),
    ).toThrow("body must be <= 120 characters")
  })
})
