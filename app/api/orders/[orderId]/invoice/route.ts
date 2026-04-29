import { NextResponse } from "next/server"
import { listOrders, updateInvoiceProcessing } from "@/lib/orders/db"
import type {
  InvoiceStatus,
  Order,
  TransactionLogEntry,
} from "@/lib/tradexpo/types"

interface Props {
  params: Promise<{ orderId: string }>
}

function applyInvoiceAction(
  order: Order,
  action: "export" | "issue" | "send",
): {
  nextStatus: InvoiceStatus
  patch: Partial<Order>
  logEntry: TransactionLogEntry
} | null {
  const now = new Date().toISOString()

  if (action === "export") {
    if (order.status !== "Paid" || order.invoiceStatus !== "requested_paid") {
      return null
    }
    const exportBatchId = `INV-EXPORT-${Date.now()}`
    return {
      nextStatus: "exported",
      patch: {
        invoiceStatus: "exported",
        exportedAt: now,
        exportedBy: "admin@arobid.com",
        exportBatchId,
        updatedAt: now,
      },
      logEntry: {
        id: `tx-${order.id}-invoice-export-${Date.now()}`,
        orderId: order.id,
        type: "status_change",
        status: order.status,
        actor: "Admin (admin@arobid.com)",
        note: `Invoice data exported (${exportBatchId})`,
        processedAt: now,
      },
    }
  }

  if (action === "issue") {
    if (order.invoiceStatus !== "exported") return null
    return {
      nextStatus: "issued",
      patch: {
        invoiceStatus: "issued",
        issuedAt: now,
        issuedBy: "finance@arobid.com",
        updatedAt: now,
      },
      logEntry: {
        id: `tx-${order.id}-invoice-issued-${Date.now()}`,
        orderId: order.id,
        type: "status_change",
        status: order.status,
        actor: "Finance/Admin (finance@arobid.com)",
        note: "Invoice marked as issued",
        processedAt: now,
      },
    }
  }

  if (order.invoiceStatus !== "issued") return null
  return {
    nextStatus: "sent",
    patch: {
      invoiceStatus: "sent",
      sentAt: now,
      sentBy: "finance@arobid.com",
      updatedAt: now,
    },
    logEntry: {
      id: `tx-${order.id}-invoice-sent-${Date.now()}`,
      orderId: order.id,
      type: "status_change",
      status: order.status,
      actor: "Finance/Admin (finance@arobid.com)",
      note: "Invoice marked as sent",
      processedAt: now,
    },
  }
}

export async function POST(request: Request, { params }: Props) {
  const { orderId } = await params
  const body = (await request.json()) as {
    action?: "export" | "issue" | "send"
  }
  if (!body.action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 })
  }

  const orders = await listOrders()
  const order = orders.find((entry) => entry.id === orderId)
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 })
  }

  const update = applyInvoiceAction(order, body.action)
  if (!update) {
    return NextResponse.json(
      { error: "Action is not allowed." },
      { status: 400 },
    )
  }

  await updateInvoiceProcessing({
    orderId,
    invoiceStatus: update.nextStatus,
    exportedAt: update.patch.exportedAt,
    exportedBy: update.patch.exportedBy,
    exportBatchId: update.patch.exportBatchId,
    issuedAt: update.patch.issuedAt,
    issuedBy: update.patch.issuedBy,
    sentAt: update.patch.sentAt,
    sentBy: update.patch.sentBy,
    log: {
      id: update.logEntry.id,
      actor: update.logEntry.actor,
      note: update.logEntry.note ?? "",
      processedAt: update.logEntry.processedAt,
    },
  })

  return NextResponse.json({
    order: { ...order, ...update.patch },
    logEntry: update.logEntry,
  })
}
