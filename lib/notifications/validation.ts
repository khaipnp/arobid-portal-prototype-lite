import type { NotificationEventPayload } from "@/lib/notifications/types"

export function parseNotificationEvent(
  input: unknown,
): NotificationEventPayload {
  if (!input || typeof input !== "object") {
    throw new Error("missing required notification fields")
  }

  const candidate = input as Record<string, unknown>
  const requiredFields = [
    "userId",
    "source",
    "type",
    "title",
    "body",
    "deepLinkPath",
  ] as const

  for (const field of requiredFields) {
    if (
      typeof candidate[field] !== "string" ||
      candidate[field].trim().length === 0
    ) {
      throw new Error("missing required notification fields")
    }
  }

  const parsed: NotificationEventPayload = {
    userId: candidate.userId as string,
    source: candidate.source as string,
    type: candidate.type as string,
    title: candidate.title as string,
    body: candidate.body as string,
    deepLinkPath: candidate.deepLinkPath as string,
    ...(typeof candidate.referenceId === "string"
      ? { referenceId: candidate.referenceId }
      : {}),
    ...(typeof candidate.referenceType === "string"
      ? { referenceType: candidate.referenceType }
      : {}),
  }

  if (
    parsed.referenceId !== undefined &&
    parsed.referenceId.trim().length === 0
  ) {
    throw new Error("missing required notification fields")
  }

  if (
    parsed.referenceType !== undefined &&
    parsed.referenceType.trim().length === 0
  ) {
    throw new Error("missing required notification fields")
  }

  if (parsed.title.length > 80) {
    throw new Error("title must be <= 80 characters")
  }

  if (parsed.body.length > 120) {
    throw new Error("body must be <= 120 characters")
  }

  return parsed
}
