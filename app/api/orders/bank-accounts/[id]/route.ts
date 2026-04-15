import { NextResponse } from "next/server"
import {
  deleteBankAccount,
  setBankAccountActiveState,
  setPrimaryBankAccount,
  updateBankAccount,
} from "@/lib/orders/db"

interface Props {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { id } = await params
  const body = (await request.json()) as
    | {
        action: "update"
        bankName: string
        bankBIN: string
        accountNumber: string
        accountHolderName: string
        branch?: string
        isPrimary: boolean
      }
    | { action: "set-primary" }
    | { action: "activate" }
    | { action: "deactivate" }

  switch (body.action) {
    case "update":
      await updateBankAccount(id, {
        bankName: body.bankName,
        bankBIN: body.bankBIN,
        accountNumber: body.accountNumber,
        accountHolderName: body.accountHolderName,
        branch: body.branch,
        isPrimary: body.isPrimary,
      })
      break
    case "set-primary":
      await setPrimaryBankAccount(id)
      break
    case "activate":
      await setBankAccountActiveState(id, true)
      break
    case "deactivate":
      await setBankAccountActiveState(id, false)
      break
    default:
      return NextResponse.json({ error: "Invalid action." }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { id } = await params
  await deleteBankAccount(id)
  return NextResponse.json({ ok: true })
}
