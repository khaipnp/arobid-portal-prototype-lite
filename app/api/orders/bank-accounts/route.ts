import { NextResponse } from "next/server"
import { createBankAccount } from "@/lib/orders/db"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    bankName?: string
    bankBIN?: string
    accountNumber?: string
    accountHolderName?: string
    branch?: string
    isPrimary?: boolean
  }
  if (
    !body.bankName ||
    !body.bankBIN ||
    !body.accountNumber ||
    !body.accountHolderName
  ) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
  }

  const id = `ba-${crypto.randomUUID()}`
  await createBankAccount({
    id,
    bankName: body.bankName,
    bankBIN: body.bankBIN,
    accountNumber: body.accountNumber,
    accountHolderName: body.accountHolderName,
    branch: body.branch,
    isPrimary: Boolean(body.isPrimary),
  })
  return NextResponse.json({ id })
}
